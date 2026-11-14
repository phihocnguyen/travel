import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canManageTickets } from "@/lib/auth/user";
import { listAdminTickets } from "@/lib/tickets/store";
import AdminTickets from "@/components/dashboard/AdminTickets";
export const instant=false;
export const metadata={title:"Quản lý vé · Vị Xoài Dẫn Lối"};
export default async function AdminTicketsPage(){
  const session=await getSession();if(!session)redirect("/admin/login");
  if(!await canManageTickets(session))redirect("/dashboard");
  return <AdminTickets initialTickets={await listAdminTickets()}/>;
}
