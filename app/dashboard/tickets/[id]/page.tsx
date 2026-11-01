import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import TicketEditor from "@/components/dashboard/TicketEditor";
import { getSession } from "@/lib/auth/session";
import { getTicket } from "@/lib/tickets/store";

export const instant = false;

export const metadata: Metadata = {
  title: "Chỉnh sửa vé · Dong Thap Dashboard",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTicketPage({ params }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/tickets");
  }

  const { id } = await params;
  const ticket = await getTicket(session.sub, id);

  if (!ticket) {
    notFound();
  }

  return <TicketEditor ticket={ticket} />;
}
