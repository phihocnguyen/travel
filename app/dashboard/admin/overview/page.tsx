import { redirect } from "next/navigation";
import { getSession,isAdmin } from "@/lib/auth/session";
import { listAdminTickets } from "@/lib/tickets/store";
import { listAllPosts } from "@/lib/posts/store";
import { getDatabase } from "@/lib/db";
import AdminOverview from "@/components/dashboard/AdminOverview";
import { userInsights } from "@/lib/users/admin";

export const instant=false;
export const metadata={title:"Tổng quan quản trị · Vị Xoài Dẫn Lối"};
export default async function AdminOverviewPage(){
  const session=await getSession();
  if(!session)redirect("/login?next=/dashboard/admin/overview");
  if(!isAdmin(session))redirect("/dashboard");
  const [summary,tickets,posts,insights]=await Promise.all([
    getDatabase().query("SELECT coalesce(sum(tickets_created),0) AS created,coalesce(sum(tickets_printed),0) AS printed,coalesce(sum(tickets_collected),0) AS collected FROM campaign_ticket_stats"),
    listAdminTickets(),listAllPosts(),userInsights(),
  ]);
  const values=summary.rows[0];
  return <AdminOverview tickets={tickets} posts={posts} insights={insights} stats={[
    {label:"Vé đã tạo",value:Number(values.created),href:"/dashboard/admin/tickets"},
    {label:"Vé đã in",value:Number(values.printed),href:"/dashboard/admin/tickets"},
    {label:"Vé đã trao",value:Number(values.collected),href:"/dashboard/admin/tickets"},
    {label:"Bài viết chờ duyệt",value:posts.filter(post=>post.status==="pending").length,href:"/dashboard/admin"},
  ]}/>;
}
