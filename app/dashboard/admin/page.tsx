import { redirect } from "next/navigation";
import { getSession,isAdmin } from "@/lib/auth/session";
import { listAllPosts } from "@/lib/posts/store";
import AdminPostsTable from "@/components/dashboard/AdminPostsTable";
export const instant=false;
export const metadata={title:"Quản lý bài viết · Vị Xoài Dẫn Lối"};
export default async function AdminReviewPage(){
  const session=await getSession();if(!session)redirect("/admin/login");
  if(!isAdmin(session))redirect("/dashboard");
  return <AdminPostsTable posts={await listAllPosts()}/>;
}
