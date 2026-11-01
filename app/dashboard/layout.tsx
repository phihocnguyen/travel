import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession, isAdmin } from "@/lib/auth/session";
import { listPendingPosts } from "@/lib/posts/store";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const admin = isAdmin(session);
  const pendingCount = admin ? (await listPendingPosts()).length : 0;

  return (
    <DashboardShell
      user={{
        name: session.name,
        email: session.email,
        picture: session.picture,
        provider: session.provider,
      }}
      isAdmin={admin}
      pendingCount={pendingCount}
    >
      {children}
    </DashboardShell>
  );
}
