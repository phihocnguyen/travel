import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "dt_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionProvider = "google" | "credentials";

export type Session = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  provider: SessionProvider;
  exp: number;
};

/**
 * Temporary local bypass: when AUTH_BYPASS is truthy, any sign-in flow opens
 * a demo session without contacting Google or checking credentials.
 */
export function isAuthBypassEnabled(): boolean {
  const value = (process.env.AUTH_BYPASS ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function isAdmin(session: Session | null): boolean {
  if (!session) return false;
  if (session.sub === BYPASS_USER.sub) return true;

  const configured = (process.env.ADMIN_EMAILS ?? process.env.AUTH_DEMO_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configured.includes(session.email.toLowerCase());
}

export const BYPASS_USER = {
  sub: "bypass:local",
  name: "Local Explorer",
  email: "explorer@localhost",
  provider: "credentials" as const,
};

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dong-thap-local-development-secret";
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createSession(
  user: Omit<Session, "exp">,
): Session {
  return {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
}

export function signSession(session: Session): string {
  const body = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body), "utf8");
  const actual = Buffer.from(signature, "utf8");
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Session;

    if (
      typeof session.exp !== "number" ||
      session.exp * 1000 < Date.now() ||
      typeof session.sub !== "string" ||
      typeof session.email !== "string"
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
