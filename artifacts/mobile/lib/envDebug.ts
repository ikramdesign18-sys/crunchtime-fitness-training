export interface SafeEnvDebugStatus {
  SUPABASE_URL: boolean;
  SUPABASE_ANON_KEY: boolean;
  API_BASE_URL: boolean;
  API_BASE_URL_VALUE: string;
  API_BASE_URL_HOST: string;
  AGORA_APP_ID: boolean;
  VIDEO_CALL_PROVIDER: boolean;
  VIDEO_CALL_PROVIDER_VALUE: string;
}

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getSafeEnvDebugStatus(): SafeEnvDebugStatus {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const videoCallProvider = process.env.EXPO_PUBLIC_VIDEO_CALL_PROVIDER ?? "";

  return {
    SUPABASE_URL: isPresent(process.env.EXPO_PUBLIC_SUPABASE_URL),
    SUPABASE_ANON_KEY: isPresent(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    API_BASE_URL: isPresent(apiBaseUrl),
    API_BASE_URL_VALUE: apiBaseUrl?.trim() || "not-configured",
    API_BASE_URL_HOST: getUrlHostOnly(apiBaseUrl),
    AGORA_APP_ID: isPresent(process.env.EXPO_PUBLIC_AGORA_APP_ID),
    VIDEO_CALL_PROVIDER: isPresent(videoCallProvider),
    VIDEO_CALL_PROVIDER_VALUE: videoCallProvider.trim() || "not-configured",
  };
}

function getUrlHostOnly(value: string | undefined) {
  if (!value?.trim()) return "not-configured";

  try {
    return new URL(value.trim()).host || "invalid-url";
  } catch {
    return "invalid-url";
  }
}

export function formatSafeEnvDebugStatus() {
  const status = getSafeEnvDebugStatus();
  return [
    `SUPABASE_URL present: ${status.SUPABASE_URL}`,
    `SUPABASE_ANON_KEY present: ${status.SUPABASE_ANON_KEY}`,
    `API_BASE_URL present: ${status.API_BASE_URL}`,
    `API_BASE_URL value: ${status.API_BASE_URL_VALUE}`,
    `API_BASE_URL host: ${status.API_BASE_URL_HOST}`,
    `AGORA_APP_ID present: ${status.AGORA_APP_ID}`,
    `VIDEO_CALL_PROVIDER present: ${status.VIDEO_CALL_PROVIDER}`,
    `VIDEO_CALL_PROVIDER value: ${status.VIDEO_CALL_PROVIDER_VALUE}`,
  ].join("\n");
}

export function getSupabaseMissingConfigMessage() {
  const status = getSafeEnvDebugStatus();
  return [
    "Supabase is not configured.",
    `Supabase URL missing: ${!status.SUPABASE_URL}`,
    `Supabase anon key missing: ${!status.SUPABASE_ANON_KEY}`,
    "Reminder: add keys to artifacts/mobile/.env for local dev and Expo/EAS env for cloud APK build.",
  ].join("\n");
}
