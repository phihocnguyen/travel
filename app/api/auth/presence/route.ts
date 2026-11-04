import { cookies } from "next/headers";
import { getSession,SESSION_COOKIE } from "@/lib/auth/session";
import { recordPresence } from "@/lib/auth/activity";

export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return new Response(null,{status:403});
  const session=await getSession(),token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(!session||!token)return new Response(null,{status:401});
  return new Response(null,{status:await recordPresence(session,token)?204:401,headers:{"Cache-Control":"no-store"}});
}
