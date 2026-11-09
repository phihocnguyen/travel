import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listTickets } from "@/lib/tickets/store";
import TicketDownload from "@/components/dashboard/TicketDownload";

export const instant = false;
export const metadata = {title: "Vé của tôi · Vị Xoài Dẫn Lối"};
export default async function MyTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/tickets");
  const ticket = (await listTickets(session.sub))[0];
  return <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4"><header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Vé của tôi</h1>
    <p className="mt-1 text-xs text-zinc-500">Một tấm vé, một mã riêng. Tên và lời nhắn được lưu cùng tài khoản.</p></header>
    {ticket ? <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="min-h-0 flex-1"><TicketDownload ticket={ticket}/></div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3"><p className="max-w-md text-xs text-zinc-500">{ticket.printLocked ? "Thiết kế đã khóa để khớp với bản in." : "Thiết kế đã lưu. Bạn có thể chỉnh sửa trước khi BTC in vé."}</p>
      {!ticket.printLocked && <Link className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white" href={`/dashboard/tickets/${ticket.id}`}>Chỉnh sửa vé</Link>}</footer>
    </section> : <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 p-6 text-center"><p className="text-sm text-zinc-500">Bạn chưa tạo vé. Mã VXDL được cấp khi lưu lần đầu.</p><Link href="/dashboard/tickets/new" className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white">Thiết kế vé của tôi ↗</Link></section>}
  </div>;
}
