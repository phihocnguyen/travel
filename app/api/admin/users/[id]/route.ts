import { getSession,isAdmin } from "@/lib/auth/session";
import { ensureDatabaseUser } from "@/lib/auth/user";
import { setUserStatus } from "@/lib/users/admin";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const session=await getSession();
  if(!session)return Response.json({error:"Unauthorized"},{status:401});
  if(!isAdmin(session))return Response.json({error:"Forbidden"},{status:403});
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Forbidden"},{status:403});
  const {id}=await params,body=await request.json().catch(()=>null);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||!["active","disabled"].includes(body?.status))return Response.json({error:"Yêu cầu không hợp lệ."},{status:400});
  const result=await setUserStatus(id,body.status,await ensureDatabaseUser(session));
  return Response.json(result,{status:"error" in result?result.status:200});
}
