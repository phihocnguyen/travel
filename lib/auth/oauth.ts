export const OAUTH_STATE_COOKIE = "dt_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "dt_oauth_verifier";
export const OAUTH_NEXT_COOKIE = "dt_oauth_next";

export const OAUTH_COOKIE_MAX_AGE = 60 * 10;

export const GOOGLE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";

/**
 * Only allow same-origin relative destinations so the callback cannot be used
 * as an open redirect.
 */
export const DEFAULT_LANDING_PATH = "/dashboard";

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_LANDING_PATH;
  if (!value.startsWith("/")) return DEFAULT_LANDING_PATH;
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_LANDING_PATH;
  }
  return value;
}

export function googleRedirectUri(requestUrl: string): string {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (configured) return configured;
  return new URL("/api/auth/google/callback", requestUrl).toString();
}
