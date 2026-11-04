import { redirect } from "next/navigation";
import { getSession,isAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/users/admin";
import AdminUsers from "@/components/dashboard/AdminUsers";

export const instant=false;
export const metadata={title:"Quản lý người dùng · Vị Xoài Dẫn Lối"};
export default async function AdminUsersPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const session=await getSession();
  if(!session)redirect("/login?next=/dashboard/admin/users");
  if(!isAdmin(session))redirect("/dashboard");
  const raw=await searchParams,params=new URLSearchParams();
  for(const [key,value] of Object.entries(raw))if(typeof value==="string")params.set(key,value);
  return <AdminUsers initial={await listUsers(params)} initialQuery={params.get("q")??""} initialStatus={params.get("status")??""} initialPeriod={params.get("period")??""}/>;
}
