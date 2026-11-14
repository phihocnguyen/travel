import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
export const instant = false;
export default async function AdminLayout({children}:{children:ReactNode}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");
  return children;
}
