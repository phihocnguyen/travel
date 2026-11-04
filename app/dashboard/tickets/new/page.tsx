import type { Metadata } from "next";
import TicketEditor from "@/components/dashboard/TicketEditor";
import { getSession } from "@/lib/auth/session";
import { listTickets } from "@/lib/tickets/store";
import { redirect } from "next/navigation";

export const instant = false;

export const metadata: Metadata = {
  title: "Tạo vé mới · Dong Thap Dashboard",
};

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/tickets/new");
  const existing = (await listTickets(session.sub))[0];
  if (existing) redirect(`/dashboard/tickets/${existing.id}`);
  return <TicketEditor />;
}
