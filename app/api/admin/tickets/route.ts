import { getSession } from "@/lib/auth/session";
import { canManageTickets } from "@/lib/auth/user";
import { listAdminTickets } from "@/lib/tickets/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({error:"Unauthorized"},{status:401});
  if (!await canManageTickets(session)) return Response.json({error:"Forbidden"},{status:403});
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (code && !/^VXDL\d{3}$/.test(code)) return Response.json({error:"Mã vé có dạng VXDL000–VXDL999."},{status:400});
  return Response.json({tickets:await listAdminTickets(code)},{headers:{"Cache-Control":"private, no-store"}});
}
