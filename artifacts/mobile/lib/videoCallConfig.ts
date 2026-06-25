export const VIDEO_CALL_PROVIDER =
  process.env["EXPO_PUBLIC_VIDEO_CALL_PROVIDER"] ?? "";
export const AGORA_APP_ID = process.env["EXPO_PUBLIC_AGORA_APP_ID"] ?? "";
export const API_BASE_URL = process.env["EXPO_PUBLIC_API_BASE_URL"] ?? "";

export const isVideoCallConfigured =
  VIDEO_CALL_PROVIDER.trim().length > 0 &&
  AGORA_APP_ID.trim().length > 0 &&
  API_BASE_URL.trim().length > 0;

export const videoCallSetupMessage =
  "Video call setup is not configured yet. Please add Agora keys and the API base URL.";

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: string;
}

export async function requestAgoraToken(input: {
  channelName: string;
  uid: number;
  role?: "publisher" | "subscriber";
}) {
  if (!isVideoCallConfigured) {
    throw new Error(videoCallSetupMessage);
  }

  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/api/agora/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelName: input.channelName,
      uid: input.uid,
      role: input.role ?? "publisher",
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | (Partial<AgoraTokenResponse> & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "Could not get an Agora token from the backend.");
  }

  if (!data?.token || !data.appId || !data.channelName || !data.uid || !data.expiresAt) {
    throw new Error("The Agora token response was incomplete.");
  }

  return data as AgoraTokenResponse;
}
