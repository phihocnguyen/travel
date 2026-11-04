import { redirect,notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canManageTickets } from "@/lib/auth/user";
import { getAdminTicket } from "@/lib/tickets/store";
import TicketPrintSheet from "@/components/dashboard/TicketPrintSheet";
export const instant=false;
export default async function PrintTicketPage({params}:{params:Promise<{id:string}>}){
  const session=await getSession();if(!session)redirect("/login?next=/dashboard/admin/tickets");
  if(!await canManageTickets(session))redirect("/dashboard");
  const {id}=await params;const ticket=await getAdminTicket(id);if(!ticket)notFound();
  return <TicketPrintSheet id={ticket.id} code={ticket.code!}/>;
}
