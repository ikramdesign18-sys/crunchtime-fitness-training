import { Router, type IRouter } from "express";
import { RtcRole, RtcTokenBuilder } from "agora-token";

const router: IRouter = Router();

type AgoraRole = "publisher" | "subscriber";

interface AgoraTokenRequest {
  channelName?: unknown;
  uid?: unknown;
  role?: unknown;
}

function getEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getTokenExpirySeconds() {
  const raw = getEnvValue("AGORA_TOKEN_EXPIRE_SECONDS") || "3600";
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 3600;
}

function normalizeUid(uid: unknown) {
  if (typeof uid === "number" && Number.isInteger(uid) && uid > 0) {
    return uid;
  }

  if (typeof uid === "string") {
    const trimmed = uid.trim();
    if (/^[1-9]\d*$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isSafeInteger(numeric)) return numeric;
    }
  }

  return null;
}

function normalizeRole(role: unknown): AgoraRole {
  return role === "subscriber" ? "subscriber" : "publisher";
}

router.post("/agora/token", (req, res) => {
  const appId = getEnvValue("AGORA_APP_ID");
  const appCertificate = getEnvValue("AGORA_APP_CERTIFICATE");

  if (!appId || !appCertificate) {
    res.status(503).json({
      error:
        "Agora token server is not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE to api-server/.env.",
    });
    return;
  }

  const body = req.body as AgoraTokenRequest;
  const channelName =
    typeof body.channelName === "string" ? body.channelName.trim() : "";
  const uid = normalizeUid(body.uid);
  const role = normalizeRole(body.role);

  if (!channelName) {
    res.status(400).json({ error: "channelName is required." });
    return;
  }

  if (channelName.length > 64) {
    res.status(400).json({ error: "channelName must be 64 characters or fewer." });
    return;
  }

  if (!uid) {
    res.status(400).json({
      error: "uid is required and must be a positive integer for Agora RTC tokens.",
    });
    return;
  }

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
