import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  BYPASS_USER,
  createSession,
  isAuthBypassEnabled,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import {
  GOOGLE_AUTH_ENDPOINT,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  googleRedirectUri,
  safeNextPath,
} from "@/lib/auth/oauth";

const isProduction = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  if (isAuthBypassEnabled()) {
    const next = safeNextPath(
      new URL(request.url).searchParams.get("next"),
    );
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(
      SESSION_COOKIE,
      signSession(createSession(BYPASS_USER)),
      sessionCookieOptions(),
    );
    return response;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=google-not-configured", request.url),
    );
  }

  const url = new URL(request.url);
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const next = safeNextPath(url.searchParams.get("next"));

  const authorizeUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", googleRedirectUri(request.url));
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl);

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };

  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookieOptions);
  response.cookies.set(OAUTH_NEXT_COOKIE, next, cookieOptions);

  return response;
}
