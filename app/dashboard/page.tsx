import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth/session';
import { listTickets } from '@/lib/tickets/store';
import { listPostSummariesByAuthor } from '@/lib/posts/store';
import UserOverview from '@/components/dashboard/UserOverview';

export const instant = false;
export const metadata = { title: 'Tổng quan · Vị Xoài Dẫn Lối' };

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');
  if (isAdmin(session)) redirect('/dashboard/admin/overview');
  const [tickets, posts] = await Promise.all([listTickets(session.sub), listPostSummariesByAuthor(session.sub)]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <UserOverview name={session.name} ticket={tickets[0]} posts={posts} today={today} />;
}
