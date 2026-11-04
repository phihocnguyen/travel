import { getSession } from "@/lib/auth/session";
import { canManageTickets, ensureDatabaseUser } from "@/lib/auth/user";
import { operateTicket } from "@/lib/tickets/admin";
import { TicketValidationError } from "@/lib/tickets/validation";

export async function POST(request:Request, context:{params:Promise<{id:string}>}) {
  const session=await getSession();
  if(!session) return Response.json({error:"Unauthorized"},{status:401});
  if(!await canManageTickets(session)) return Response.json({error:"Forbidden"},{status:403});
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({error:"Mã vé không hợp lệ."},{status:400});
  const body=await request.json().catch(()=>null);
  if(!body || typeof body!=="object") return Response.json({error:"Dữ liệu không hợp lệ."},{status:400});
  try {return Response.json(await operateTicket(id,await ensureDatabaseUser(session),body));}
  catch(error) {
    if(error instanceof TicketValidationError) return Response.json({error:error.message},{status:409});
    return Response.json({error:"Không thể xử lý vé. Hãy thử lại."},{status:500});
  }
}
