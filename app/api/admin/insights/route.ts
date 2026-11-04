import { getSession,isAdmin } from "@/lib/auth/session";
import { userInsights } from "@/lib/users/admin";
export async function GET(){
  const session=await getSession();
  if(!session)return Response.json({error:"Unauthorized"},{status:401});
  if(!isAdmin(session))return Response.json({error:"Forbidden"},{status:403});
  return Response.json(await userInsights(),{headers:{"Cache-Control":"private, no-store"}});
}
