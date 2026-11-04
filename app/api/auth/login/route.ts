import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth/credentials";
import { registerLogin } from "@/lib/auth/activity";
import { createSession, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, {status:403});
  let body;
  try { body = await request.json(); } catch { return Response.json({error:"Yêu cầu không hợp lệ."},{status:400}); }
  const {username,password} = body ?? {};
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password || username.length>100 || password.length>256)
    return Response.json({error:"Vui lòng nhập tài khoản và mật khẩu."},{status:400});
  try {
    const user = await authenticateAdmin(username.trim().toLowerCase(), password);
    if (!user) return Response.json({error:"Sai tài khoản, mật khẩu hoặc tài khoản đang tạm khóa."},{status:401});
    const session = createSession(user), token = signSession(session);
    if (!await registerLogin(session, token)) return Response.json({error:"Tài khoản đã bị khóa."},{status:401});
    const response = NextResponse.json({redirect:"/dashboard/admin/overview"});
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    response.headers.set("Cache-Control","no-store");
    return response;
  } catch { return Response.json({error:"Chưa thể đăng nhập. Vui lòng thử lại."},{status:503}); }
}
