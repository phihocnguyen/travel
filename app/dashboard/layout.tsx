import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardFrameLoading } from '@/components/dashboard/DashboardLoading';
import { getSession, isAdmin } from '@/lib/auth/session';
import { countPendingPosts } from '@/lib/posts/store';

async function PendingPostBadge() {
  const count = await countPendingPosts();
  return count > 0 ? <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px]">{count}</span> : null;
}

async function AuthenticatedDashboard({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');
  const admin = isAdmin(session);
  return <DashboardShell
    user={{ name: session.name, email: session.email, picture: session.picture, provider: session.provider }}
    isAdmin={admin}
    pendingBadge={admin ? <Suspense fallback={null}><PendingPostBadge /></Suspense> : null}
  >{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DashboardFrameLoading />}><AuthenticatedDashboard>{children}</AuthenticatedDashboard></Suspense>;
}
