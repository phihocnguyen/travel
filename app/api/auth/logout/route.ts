import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";
import { sessionHash } from "@/lib/auth/activity";

export async function POST() {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(token)await getDatabase().query("UPDATE user_sessions SET ended_at=now() WHERE token_hash=$1",[sessionHash(token)]);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
