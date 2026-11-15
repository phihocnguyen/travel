import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canManageTickets } from "@/lib/auth/user";
import TicketBackPrintSheet from "@/components/dashboard/TicketBackPrintSheet";

export const instant = false;

export default async function PrintTicketBackPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/print/tickets/back");
  if (!await canManageTickets(session)) redirect("/dashboard");
  return <TicketBackPrintSheet />;
}
