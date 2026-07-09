export interface SafeBackendEnvDebugStatus {
  AGORA_APP_ID: boolean;
  AGORA_APP_CERTIFICATE: boolean;
  SUPABASE_URL: boolean;
  SUPABASE_SERVICE_ROLE_KEY: boolean;
  STRIPE_SECRET_KEY: boolean;
  STRIPE_WEBHOOK_SECRET: boolean;
  PORT: boolean;
}

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getSafeBackendEnvDebugStatus(): SafeBackendEnvDebugStatus {
  return {
    AGORA_APP_ID: isPresent(process.env.AGORA_APP_ID),
    AGORA_APP_CERTIFICATE: isPresent(process.env.AGORA_APP_CERTIFICATE),
    SUPABASE_URL: isPresent(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: isPresent(process.env.SUPABASE_SERVICE_ROLE_KEY),
    STRIPE_SECRET_KEY: isPresent(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: isPresent(process.env.STRIPE_WEBHOOK_SECRET),
    PORT: isPresent(process.env.PORT),
  };
}

export function formatSafeBackendEnvDebugStatus() {
  const status = getSafeBackendEnvDebugStatus();
  return [
    `AGORA_APP_ID present: ${status.AGORA_APP_ID}`,
    `AGORA_APP_CERTIFICATE present: ${status.AGORA_APP_CERTIFICATE}`,
    `SUPABASE_URL present: ${status.SUPABASE_URL}`,
    `SUPABASE_SERVICE_ROLE_KEY present: ${status.SUPABASE_SERVICE_ROLE_KEY}`,
    `STRIPE_SECRET_KEY present: ${status.STRIPE_SECRET_KEY}`,
    `STRIPE_WEBHOOK_SECRET present: ${status.STRIPE_WEBHOOK_SECRET}`,
    `PORT present: ${status.PORT}`,
  ].join("\n");
}
