import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  BYPASS_USER,
  createSession,
  isAuthBypassEnabled,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";

type Credentials = {
  email?: unknown;
  password?: unknown;
};

function matches(input: string, expected: string): boolean {
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (isAuthBypassEnabled()) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      signSession(createSession(BYPASS_USER)),
      sessionCookieOptions(),
    );
    return response;
  }

  const expectedEmail = process.env.AUTH_DEMO_EMAIL;
  const expectedPassword = process.env.AUTH_DEMO_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      {
        error:
          "Email sign-in is not configured. Set AUTH_DEMO_EMAIL and AUTH_DEMO_PASSWORD, or continue with Google.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as Credentials | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  const emailOk = matches(email.toLowerCase(), expectedEmail.toLowerCase());
  const passwordOk = matches(password, expectedPassword);

  if (!emailOk || !passwordOk) {
    return NextResponse.json(
      { error: "Those credentials do not match our records." },
      { status: 401 },
    );
  }

  const session = createSession({
    sub: `demo:${expectedEmail.toLowerCase()}`,
    email: expectedEmail,
    name: expectedEmail.split("@")[0],
    provider: "credentials",
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    signSession(session),
    sessionCookieOptions(),
  );

  return response;
}
