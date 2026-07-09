import Constants from "expo-constants";

export const VIDEO_CALL_PROVIDER =
  process.env.EXPO_PUBLIC_VIDEO_CALL_PROVIDER ?? "";
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? "";
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const HEALTH_CHECK_PATH = "/api/health";

function normalizedVideoCallProvider() {
  return VIDEO_CALL_PROVIDER.trim().toLowerCase();
}

function parseApiBaseUrl() {
  const value = API_BASE_URL.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function getApiBaseUrlHost() {
  return parseApiBaseUrl()?.host ?? "";
}

function getNormalizedApiBaseUrl() {
  return API_BASE_URL.trim().replace(/\/+$/, "");
}

export function getCallServerHealthUrl() {
  const baseUrl = getNormalizedApiBaseUrl();
  return baseUrl ? `${baseUrl}${HEALTH_CHECK_PATH}` : "not configured";
}

export function isLocalApiBaseUrl() {
  const hostname = parseApiBaseUrl()?.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function getApiBaseUrlErrorMessage() {
  if (!API_BASE_URL.trim()) {
    return "API server is not configured. Set EXPO_PUBLIC_API_BASE_URL in EAS preview environment and rebuild the APK.";
  }

  const apiUrl = parseApiBaseUrl();
  if (!apiUrl) {
    return "API server URL is invalid. Set EXPO_PUBLIC_API_BASE_URL to your Mac LAN IP or deployed backend URL.";
  }

  if (isProductionBuild() && apiUrl.protocol !== "https:") {
    return "Invalid API URL for production APK. Use an HTTPS API URL.";
  }

  if (!__DEV__ && isLocalApiBaseUrl()) {
    return "Invalid API URL for APK. Use your Mac LAN IP or deployed backend URL, not localhost.";
  }

  return null;
}

export function getVideoCallProviderErrorMessage() {
  const provider = normalizedVideoCallProvider();
  if (!provider) {
    return "Video call provider is not configured. Add EXPO_PUBLIC_VIDEO_CALL_PROVIDER=agora in EAS preview environment and rebuild APK.";
  }

  if (provider !== "agora") {
    return "Invalid video call provider. Expected agora.";
  }

  return null;
}

export const isVideoCallConfigured =
  getVideoCallProviderErrorMessage() === null &&
  AGORA_APP_ID.trim().length > 0 &&
  getApiBaseUrlErrorMessage() === null;

export function getVideoCallSetupMessage() {
  const apiBaseUrlError = getApiBaseUrlErrorMessage();
  if (apiBaseUrlError) return apiBaseUrlError;

  const providerError = getVideoCallProviderErrorMessage();
  if (providerError) return providerError;

  if (!AGORA_APP_ID.trim()) {
    return "Agora is not configured in this APK. Add EXPO_PUBLIC_AGORA_APP_ID, EXPO_PUBLIC_API_BASE_URL, and EXPO_PUBLIC_VIDEO_CALL_PROVIDER=agora in EAS preview environment, then rebuild APK.";
  }

  return null;
}

export const videoCallSetupMessage =
  getVideoCallSetupMessage() ??
  "Video call setup is not configured yet. Please add Agora keys and the API base URL.";

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: string;
}

const CALL_SERVER_MESSAGE =
  "Unable to connect to the call server. Please check your internet connection or try again later.";

function getBuildProfile() {
  const buildProfile = Constants.expoConfig?.extra?.buildProfile;
  return typeof buildProfile === "string" ? buildProfile : "";
}

function shouldShowCallServerDiagnostics() {
  const buildProfile = getBuildProfile();
  return __DEV__ || buildProfile === "development" || buildProfile === "preview" || buildProfile === "local";
}

function isProductionBuild() {
  return !__DEV__ && getBuildProfile() === "production";
}

function getNetworkFailureReason(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "Network request failed";
}

function withCallServerDiagnostics(
  message: string,
  options: {
    healthCheckFailed?: boolean;
    reason?: string;
  } = {},
) {
  if (!shouldShowCallServerDiagnostics()) return message;

  const baseUrl = API_BASE_URL.trim() || "not configured";
  const healthCheckFailed =
    typeof options.healthCheckFailed === "boolean"
      ? options.healthCheckFailed
      : "not checked";

  return [
    message,
    "",
    `API base URL: ${baseUrl}`,
    `Health check URL: ${getCallServerHealthUrl()}`,
    `Health check failed: ${healthCheckFailed}`,
    options.reason ? `Reason: ${options.reason}` : null,
    "For a local IP, your phone and API server must be on the same Wi-Fi.",
    "Local HTTP APIs require Android cleartext traffic to be enabled in preview/dev builds.",
  ]
    .filter(Boolean)
    .join("\n");
}

function friendlyNetworkError(error: unknown, healthCheckFailed?: boolean) {
  const text = error instanceof Error ? error.message.toLowerCase() : "";
  if (text.includes("aborted") || text.includes("timeout")) {
    return withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
      healthCheckFailed,
      reason: getNetworkFailureReason(error),
    });
  }
  if (text.includes("network request failed") || text.includes("failed to fetch")) {
    return withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
      healthCheckFailed,
      reason: getNetworkFailureReason(error),
    });
  }
  return null;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkCallServerHealth() {
  const apiBaseUrlError = getApiBaseUrlErrorMessage();
  if (apiBaseUrlError) throw new Error(apiBaseUrlError);

  const healthCheckUrl = getCallServerHealthUrl();
  let response: Response;
  try {
    response = await fetchWithTimeout(healthCheckUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new Error(
      friendlyNetworkError(error, true) ??
        withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
          healthCheckFailed: true,
          reason: getNetworkFailureReason(error),
        }),
    );
  }

  if (!response.ok) {
    throw new Error(
      withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
        healthCheckFailed: true,
        reason: `Health check returned HTTP ${response.status}`,
      }),
    );
  }
}

function getTokenRequestErrorMessage(status: number, serverMessage?: string) {
  const normalized = serverMessage?.trim();

  if (status === 401) {
    return "Your session expired. Please sign in again before starting a video call.";
  }

  if (status === 403) {
    if (normalized?.toLowerCase().includes("not accepted")) {
      return "This booking is not accepted yet.";
    }
    return normalized || "You are not allowed to join this booking call.";
  }

  if (status === 404) return "Booking was not found.";
  if (status === 408 || status === 504) {
    return withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
      healthCheckFailed: false,
      reason: `Token request returned HTTP ${status}`,
    });
  }
  if (status >= 500) return "The call server is unavailable right now. Please try again later.";

  return normalized || "Could not start the video call. Please try again.";
}

export async function requestAgoraToken(input: {
  bookingId: string;
  role?: "publisher" | "subscriber";
  accessToken: string;
}) {
  const apiBaseUrlError = getApiBaseUrlErrorMessage();
  if (apiBaseUrlError) {
    throw new Error(apiBaseUrlError);
  }

  const videoCallSetupError = getVideoCallSetupMessage();
  if (videoCallSetupError) {
    throw new Error(videoCallSetupError);
  }

  await checkCallServerHealth();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${getNormalizedApiBaseUrl()}/api/agora/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        bookingId: input.bookingId,
        role: input.role ?? "publisher",
      }),
    });
  } catch (error) {
    throw new Error(
      friendlyNetworkError(error, false) ??
        withCallServerDiagnostics(CALL_SERVER_MESSAGE, {
          healthCheckFailed: false,
          reason: getNetworkFailureReason(error),
        }),
    );
  }

  const data = (await response.json().catch(() => null)) as
    | (Partial<AgoraTokenResponse> & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(getTokenRequestErrorMessage(response.status, data?.error));
  }

  if (
    !data?.token ||
    !data.appId ||
    !data.channelName ||
    typeof data.uid !== "number" ||
    data.uid <= 0 ||
    !data.expiresAt
  ) {
    throw new Error("The Agora token response was incomplete.");
  }

  return data as AgoraTokenResponse;
}
