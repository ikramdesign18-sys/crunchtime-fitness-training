import { Router, type IRouter, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { createHash } from "node:crypto";
import { RtcRole, RtcTokenBuilder } from "agora-token";

const router: IRouter = Router();

type AgoraRole = "publisher" | "subscriber";
type BookingStatus = "pending" | "accepted" | "active" | "declined";

interface AgoraTokenRequest {
  bookingId?: unknown;
  role?: unknown;
}

interface SupabaseUserResponse {
  id?: unknown;
}

interface BookingRow {
  id: string;
  user_id: string;
  trainer_id: string;
  status: BookingStatus;
  payment_status: string | null;
}

interface ProfileRow {
  id: string;
  role: string;
}

type FetchJsonResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

function getTokenExpirySeconds() {
  const raw = process.env.AGORA_TOKEN_EXPIRE_SECONDS?.trim() || "3600";
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 3600;
}

function normalizeRole(role: unknown): AgoraRole {
  return role === "subscriber" ? "subscriber" : "publisher";
}

function createAgoraNumericUid(userId: string) {
  const digest = createHash("sha256").update(userId).digest();
  const value = digest.readUInt32BE(0) & 0x7fffffff;
  return value > 0 ? value : 1;
}

function getBearerToken(authHeader: unknown) {
  if (typeof authHeader !== "string") return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !serviceRoleKey) return null;
  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

async function getAuthenticatedUserId(accessToken: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = (await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })) as unknown as FetchJsonResponse;

  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as SupabaseUserResponse | null;
  return typeof user?.id === "string" ? user.id : null;
}

async function fetchSingleFromSupabase<T>(path: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = (await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
  })) as unknown as FetchJsonResponse;

  if (!response.ok) {
    throw new Error(`supabase-query-failed-${response.status}`);
  }

  const rows = (await response.json().catch(() => [])) as T[];
  return rows[0] ?? null;
}

async function fetchBooking(bookingId: string) {
  const encodedId = encodeURIComponent(bookingId);
  return fetchSingleFromSupabase<BookingRow>(
    `bookings?id=eq.${encodedId}&select=id,user_id,trainer_id,status,payment_status&limit=1`,
  );
}

async function fetchProfile(userId: string) {
  const encodedId = encodeURIComponent(userId);
  return fetchSingleFromSupabase<ProfileRow>(
    `profiles?id=eq.${encodedId}&select=id,role&limit=1`,
  );
}

function isAcceptedCallStatus(status: string) {
  return status === "accepted" || status === "active";
}

function isBookingPaymentConfirmed(booking: BookingRow) {
  return (
    booking.payment_status === "paid" ||
    booking.payment_status === "free_promo" ||
    booking.payment_status === "waived"
  );
}

router.post("/agora/token", async (req: ExpressRequest, res: ExpressResponse) => {
  const appId = process.env.AGORA_APP_ID?.trim() ?? "";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim() ?? "";

  if (!appId || !appCertificate) {
    res.status(503).json({
      error:
        "Agora token server is not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE to api-server/.env.",
    });
    return;
  }

  if (!getSupabaseConfig()) {
    res.status(503).json({
      error:
        "Video call authorization is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to api-server/.env.",
    });
    return;
  }

  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    res.status(401).json({ error: "Please sign in before joining this video call." });
    return;
  }

  const body = req.body as AgoraTokenRequest;
  const bookingId =
    typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const role = normalizeRole(body.role);

  if (!bookingId) {
    res.status(400).json({ error: "bookingId is required." });
    return;
  }

  const channelName = `booking-${bookingId}`;

  if (channelName.length > 64) {
    res.status(400).json({ error: "Booking id is too long for video calls." });
    return;
  }

  let requesterId: string | null;
  let booking: BookingRow | null;
  let profile: ProfileRow | null;
  try {
    requesterId = await getAuthenticatedUserId(accessToken);
    if (!requesterId) {
      res.status(401).json({ error: "Your session expired. Please sign in again." });
      return;
    }

    booking = await fetchBooking(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking was not found." });
      return;
    }

    if (!isAcceptedCallStatus(booking.status)) {
      res.status(403).json({ error: "This booking is not accepted yet." });
      return;
    }

    if (!isBookingPaymentConfirmed(booking)) {
      res.status(403).json({ error: "This booking payment is not confirmed yet." });
      return;
    }

    profile = await fetchProfile(requesterId);
  } catch (error) {
    req.log?.error({ err: error }, "Agora booking authorization failed");
    res.status(503).json({ error: "Could not verify this booking right now. Please try again." });
    return;
  }

  const isParticipant =
    booking.user_id === requesterId ||
    booking.trainer_id === requesterId ||
    profile?.role === "admin";

  if (!isParticipant) {
    res.status(403).json({ error: "You are not allowed to join this booking call." });
    return;
  }

  const uid = createAgoraNumericUid(requesterId);
  const expireSeconds = getTokenExpirySeconds();
  const expiresAtMs = Date.now() + expireSeconds * 1000;
  const agoraRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    expireSeconds,
    expireSeconds,
  );

  if (!token) {
    res.status(503).json({
      error:
        "Agora token could not be generated. Replace placeholder AGORA_APP_ID and AGORA_APP_CERTIFICATE with real Agora project values in api-server/.env.",
    });
    return;
  }

  res.json({
    token,
    appId,
    channelName,
    uid,
    expiresAt: new Date(expiresAtMs).toISOString(),
  });
});

export default router;
