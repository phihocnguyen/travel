import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getDatabase } from "@/lib/db";

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
  sid?: string;
  role?: "admin" | "user";
};

export function isAdmin(session: Session | null): boolean {
  if (!session) return false;
  if(session.role==="admin")return true;

  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configured.includes(session.email.toLowerCase());
}

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
    sid: randomUUID(),
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
  await connection();
  const store = await cookies();
  const token=store.get(SESSION_COOKIE)?.value;
  const session=verifySession(token);
  if(!session||session.provider!=="google")return null;
  const result=await getDatabase().query(`SELECT u.status, EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_id='admin') AS admin, EXISTS(SELECT 1 FROM user_sessions s
    WHERE s.token_hash=$2 AND s.ended_at IS NOT NULL) AS revoked FROM users u WHERE u.auth_subject=$1`,
    [session.sub,createHash("sha256").update(token!).digest("hex")]);
  if(result.rows[0]?.status==='disabled'||result.rows[0]?.revoked)return null;
  return {...session,role:result.rows[0]?.admin?"admin":"user"};
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
