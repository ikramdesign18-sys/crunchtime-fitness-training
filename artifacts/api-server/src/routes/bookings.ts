import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();

type BookingPaymentStatus = "unpaid" | "paid" | "failed" | "refunded" | "free_promo" | "waived";
type FreeBookingPaymentStatus = Extract<BookingPaymentStatus, "free_promo" | "waived">;

interface SupabaseUserResponse {
  id?: unknown;
  email?: unknown;
}

interface ProfileRow {
  id: string;
  role: "user" | "trainer" | "admin";
}

interface BookingRow {
  id: string;
  user_id: string;
  trainer_id: string;
  status: string;
  payment_status: BookingPaymentStatus | null;
  amount_paid: number | null;
}

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getSupabaseConfig() {
  const url = env("SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/+$/, ""), serviceRoleKey };
}

function getBearerToken(authHeader: unknown) {
  if (typeof authHeader !== "string") return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function supabaseFetch<T>(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`supabase-${response.status}-${text}`);
  }

  return (await response.json().catch(() => null)) as T;
}

async function supabaseSingle<T>(path: string) {
  const rows = await supabaseFetch<T[]>(path);
  return rows?.[0] ?? null;
}

async function getAuthenticatedUser(accessToken: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as SupabaseUserResponse | null;
  if (typeof user?.id !== "string") return null;
  return { id: user.id, email: typeof user.email === "string" ? user.email : null };
}

async function requireUser(req: Request) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  return getAuthenticatedUser(token);
}

async function fetchProfile(userId: string) {
  return supabaseSingle<ProfileRow>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=id,role&limit=1`,
  );
}

async function fetchBooking(bookingId: string) {
  return supabaseSingle<BookingRow>(
    `bookings?id=eq.${encodeURIComponent(bookingId)}&select=id,user_id,trainer_id,status,payment_status,amount_paid&limit=1`,
  );
}

function normalizeFreePaymentStatus(value: unknown): FreeBookingPaymentStatus | null {
  if (value === "free_promo" || value === "waived") return value;
  return null;
}

function canMarkBookingFree(profile: ProfileRow | null, booking: BookingRow, status: FreeBookingPaymentStatus, userId: string) {
  if (profile?.role === "admin") return true;
  if (profile?.role === "trainer" && booking.trainer_id === userId && status === "free_promo") {
    return true;
  }
  return false;
}

router.post("/bookings/:id/payment-status", async (req, res) => {
  if (!getSupabaseConfig()) {
    res.status(503).json({ error: "Booking payment server is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before updating a booking." });
    return;
  }

  const paymentStatus = normalizeFreePaymentStatus((req.body as Record<string, unknown>).paymentStatus);
  if (!paymentStatus) {
    res.status(400).json({ error: "Only free_promo or waived payment status can be set here." });
    return;
  }

  try {
    const [profile, booking] = await Promise.all([
      fetchProfile(user.id),
      fetchBooking(req.params.id),
    ]);

    if (!booking) {
      res.status(404).json({ error: "Booking was not found." });
      return;
    }

    if (!canMarkBookingFree(profile, booking, paymentStatus, user.id)) {
      res.status(403).json({ error: "You are not allowed to mark this booking as free." });
      return;
    }

    if (booking.status === "declined") {
      res.status(409).json({ error: "Declined bookings cannot be marked as free." });
      return;
    }

    if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
      res.status(409).json({ error: "This booking already has a finalized payment status." });
      return;
    }

    const rows = await supabaseFetch<BookingRow[]>(`bookings?id=eq.${encodeURIComponent(booking.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        payment_status: paymentStatus,
        amount_paid: 0,
      }),
    });

    res.json({ booking: rows[0] ?? { ...booking, payment_status: paymentStatus, amount_paid: 0 } });
  } catch (error) {
    req.log?.error({ err: error }, "Free booking payment status update failed");
    res.status(500).json({ error: "Could not update this booking. Please try again." });
  }
});

export default router;
