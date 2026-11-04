import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession,isAdmin } from "@/lib/auth/session";
import { listTickets } from "@/lib/tickets/store";
import { listPostsByAuthor } from "@/lib/posts/store";
import TicketPreview from "@/components/dashboard/TicketPreview";
import { POST_STATUS_LABELS } from "@/lib/posts/types";
export const instant=false;
export const metadata={title:"Tổng quan · Vị Xoài Dẫn Lối"};
export default async function DashboardOverviewPage(){
  const session=await getSession();if(!session)redirect("/login?next=/dashboard");
  if(isAdmin(session))redirect("/dashboard/admin/overview");
  const [tickets,posts]=await Promise.all([listTickets(session.sub),listPostsByAuthor(session.sub)]);
  const ticket=tickets[0],link="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50";
  return <div className="flex h-full min-h-0 flex-col gap-4">
    <header className="shrink-0"><h1 className="text-xl font-semibold tracking-tight">Tổng quan</h1><p className="mt-1 text-xs text-zinc-500">Chào {session.name}. Vé và bài viết của bạn ở đây.</p></header>
    <div className="grid shrink-0 grid-cols-3 divide-x divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {[["Mã vé",ticket?.code??"Chưa tạo"],["Bài viết",String(posts.length)],["Đã xuất bản",String(posts.filter(post=>post.status==="approved").length)]].map(([label,value])=><div key={label} className="px-3 py-3 sm:px-5"><p className="text-[11px] text-zinc-500">{label}</p><p className="mt-1 font-mono text-base font-semibold">{value}</p></div>)}
    </div>
    <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[1.2fr_1fr]">
      <section className="flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white"><header className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3"><h2 className="text-sm font-medium">Vé của tôi</h2><Link href="/dashboard/tickets" className="text-xs text-zinc-500 hover:text-zinc-900">Mở vé ↗</Link></header>
        {ticket?<><div className="flex min-h-0 flex-1 items-center justify-center p-4 [container-type:size]"><TicketPreview design={ticket} className="aspect-[103/58] w-[min(90cqw,calc(80cqh*103/58))] rounded-md"/></div><div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-100 p-3"><span className="text-xs text-zinc-500">{ticket.printLocked?"Thiết kế đã khóa để in":"Có thể tiếp tục chỉnh sửa"}</span><Link className={link} href={ticket.printLocked?"/dashboard/tickets":`/dashboard/tickets/${ticket.id}`}>{ticket.printLocked?"Xem vé":"Chỉnh sửa"}</Link></div></>:<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-5 text-center"><p className="text-sm text-zinc-500">Bạn chưa có Vé hẹn chu du.</p><Link href="/dashboard/tickets/new" className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white">Thiết kế vé</Link></div>}
      </section>
      <section className="hidden min-h-0 flex-col rounded-lg border border-zinc-200 bg-white md:flex"><header className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3"><h2 className="text-sm font-medium">Bài viết gần đây</h2><Link href="/dashboard/posts" className="text-xs text-zinc-500 hover:text-zinc-900">Tất cả ↗</Link></header><div className="min-h-0 flex-1 overflow-y-auto">{posts.slice(0,5).map(post=><Link key={post.id} href={`/dashboard/posts/${post.id}`} className="block border-b border-zinc-100 px-4 py-3 hover:bg-zinc-50"><p className="truncate text-sm font-medium">{post.title}</p><p className="mt-1 text-[11px] text-zinc-500">{POST_STATUS_LABELS[post.status]} · {new Date(post.updatedAt).toLocaleDateString("vi-VN")}</p></Link>)}{!posts.length&&<div className="p-5 text-sm text-zinc-500">Chưa có bài viết. Chia sẻ một câu chuyện từ chuyến đi của bạn.</div>}</div><footer className="shrink-0 border-t border-zinc-100 p-3"><Link href="/dashboard/posts/new" className={link}>Viết câu chuyện</Link></footer></section>
    </div>
    <nav className="flex shrink-0 gap-4 text-xs text-zinc-500"><Link href="/map" className="hover:text-zinc-900">Khám phá bản đồ ↗</Link><Link href="/blog" className="hover:text-zinc-900">Đọc câu chuyện ↗</Link><Link href="/dashboard/posts" className="md:hidden">Bài viết của tôi ↗</Link></nav>
  </div>;
}
