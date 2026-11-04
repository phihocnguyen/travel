import { getSession } from "@/lib/auth/session";
import { canManageTickets } from "@/lib/auth/user";
import { getDatabase } from "@/lib/db";
import { colorPrintPng } from "@/lib/tickets/print-image";

export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
  const session=await getSession();
  if(!session) return new Response("Unauthorized",{status:401});
  if(!await canManageTickets(session)) return new Response("Forbidden",{status:403});
  const {id}=await context.params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found",{status:404});
  const row=(await getDatabase().query("SELECT o.image_data,t.ticket_code FROM ticket_outputs o JOIN tickets t ON t.id=o.ticket_id WHERE t.id=$1",[id])).rows[0];
  if(!row) return new Response("Not found",{status:404});
  try {
    // Enforce print resolution and sRGB output for previously generated files.
    const image=await colorPrintPng(row.image_data);
    return new Response(new Uint8Array(image),{headers:{"Content-Type":"image/png","Cache-Control":"private, no-store","Content-Disposition":`inline; filename="${row.ticket_code}.png"`}});
  } catch {
    return new Response("File in cũ không đủ chất lượng. Hãy hủy lệnh chưa hoàn tất và chuẩn bị lại file 4120 × 2320 px.",{status:409});
  }
}
