import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  googleRedirectUri,
  safeNextPath,
} from "@/lib/auth/oauth";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function failure(request: NextRequest, code: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(code)}`, request.url),
  );
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const providerError = params.get("error");
  if (providerError) {
    return clearOAuthCookies(failure(request, "google-denied"));
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  const next = safeNextPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    return clearOAuthCookies(failure(request, "invalid-state"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return clearOAuthCookies(failure(request, "google-not-configured"));
  }

  let profile: GoogleProfile;

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: googleRedirectUri(request.url),
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return clearOAuthCookies(failure(request, "token-exchange-failed"));
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
    };

    if (!tokens.access_token) {
      return clearOAuthCookies(failure(request, "token-exchange-failed"));
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return clearOAuthCookies(failure(request, "profile-fetch-failed"));
    }

    profile = (await profileResponse.json()) as GoogleProfile;
  } catch {
    return clearOAuthCookies(failure(request, "google-unreachable"));
  }

  if (!profile.sub || !profile.email) {
    return clearOAuthCookies(failure(request, "profile-incomplete"));
  }

  const session = createSession({
    sub: profile.sub,
    email: profile.email,
    name: profile.name?.trim() || profile.email.split("@")[0],
    picture: profile.picture,
    provider: "google",
  });

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(
    SESSION_COOKIE,
    signSession(session),
    sessionCookieOptions(),
  );

  return clearOAuthCookies(response);
}
