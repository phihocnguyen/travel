import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import TicketPreview from "@/components/dashboard/TicketPreview";
import { getSession, isAdmin } from "@/lib/auth/session";
import { listPendingPosts, listPostsByAuthor } from "@/lib/posts/store";
import { listTickets } from "@/lib/tickets/store";
import { POST_STATUS_LABELS } from "@/lib/posts/types";
import type { TicketLayout } from "@/lib/tickets/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Tổng quan · Dong Thap Dashboard",
};

const LAYOUT_LABELS: Record<TicketLayout, string> = {
  left: "Ảnh trái",
  right: "Ảnh phải",
  full: "Toàn khung",
};

const POST_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function DashboardOverviewPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const [tickets, posts] = await Promise.all([
    listTickets(session.sub),
    listPostsByAuthor(session.sub),
  ]);

  const admin = isAdmin(session);
  const pending = admin ? await listPendingPosts() : [];
  const withImage = tickets.filter((ticket) => ticket.image.url).length;
  const approvedPosts = posts.filter((post) => post.status === "approved").length;
  const latest = tickets[0];
  const recentTickets = tickets.slice(0, 2);
  const recentPosts = posts.slice(0, 4);

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#14281e] text-[#f4ead5]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#e8b04b]/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 right-16 h-64 w-64 rounded-full border border-[#f4ead5]/10"
        />
        <div className="relative flex flex-col gap-8 p-7 md:flex-row md:items-end md:justify-between md:p-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#e8b04b]">
              {today} · Đồng Tháp
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-[#fdf8ec] md:text-5xl">
              Xin chào, {session.name.split(" ").slice(-1)[0]}.
              <br />
              <span className="text-[#f4ead5]/55">
                Hôm nay mình kể chuyện gì?
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#f4ead5]/60">
              Thiết kế vé kỷ niệm, viết câu chuyện chuyến đi và gửi duyệt để
              xuất bản trên blog Đồng Tháp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/tickets/new"
                className="rounded-xl bg-[#e8b04b] px-5 py-3 text-sm font-semibold text-[#14281e] transition hover:bg-[#f0c06b]"
              >
                Thiết kế vé mới
              </Link>
              <Link
                href="/dashboard/posts/new"
                className="rounded-xl border border-[#f4ead5]/25 px-5 py-3 text-sm font-semibold text-[#fdf8ec] transition hover:bg-white/10"
              >
                Viết bài mới
              </Link>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-4 md:gap-6">
            {[
              { label: "Vé đã lưu", value: tickets.length },
              { label: "Bài đã đăng", value: approvedPosts },
              { label: "Bài chờ duyệt", value: posts.filter((p) => p.status === "pending").length },
            ].map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl text-[#fdf8ec]">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#f4ead5]/45">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {admin && pending.length > 0 ? (
        <Link
          href="/dashboard/admin"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8b04b]/50 bg-[#fff8e8] px-5 py-4 transition hover:bg-[#fdf3da]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8b04b] text-sm font-bold text-[#14281e]">
              {pending.length}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#14281e]">
                {pending.length} bài viết đang chờ bạn duyệt
              </p>
              <p className="text-xs text-[#8a7449]">
                {pending
                  .slice(0, 2)
                  .map((post) => post.title)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-[#a4651c]">
            Mở hàng đợi →
          </span>
        </Link>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Thiết kế đã lưu",
            value: `${tickets.length}`,
            hint: `${withImage} vé có ảnh kỷ niệm`,
            href: "/dashboard/tickets",
          },
          {
            label: "Bài viết của bạn",
            value: `${posts.length}`,
            hint: `${approvedPosts} đã xuất bản · ${posts.length - approvedPosts} chờ duyệt`,
            href: "/dashboard/posts",
          },
          {
            label: "Cập nhật gần nhất",
            value: latest ? LAYOUT_LABELS[latest.layout] : "Chưa có",
            hint: latest ? latest.title : "Tạo tấm vé đầu tiên",
            href: latest
              ? `/dashboard/tickets/${latest.id}`
              : "/dashboard/tickets/new",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-[#e2d8c3] bg-[#fffdf7] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a4651c]">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-[#14281e]">
              {stat.value}
            </p>
            <p className="mt-1 truncate text-sm text-[#6b7a6f]">{stat.hint}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-[#e2d8c3] bg-[#fffdf7] p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[#14281e]">
                Vé gần đây
              </h2>
              <p className="text-xs text-[#9a8f7a]">
                Thiết kế mới nhất trong thư viện của bạn
              </p>
            </div>
            <Link
              href="/dashboard/tickets"
              className="text-sm font-medium text-[#2f7d4f] hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9cdb4] p-8 text-center">
              <p className="text-sm font-medium text-[#3c5145]">
                Chưa có thiết kế nào được lưu.
              </p>
              <Link
                href="/dashboard/tickets/new"
                className="mt-4 inline-flex rounded-xl bg-[#14281e] px-5 py-2.5 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
              >
                Tạo vé đầu tiên
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="group overflow-hidden rounded-2xl border border-[#e2d8c3] bg-white transition hover:shadow-md"
                >
                  <TicketPreview
                    design={ticket}
                    className="aspect-[103/58] w-full border-b border-[#eee5d2]"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-[#14281e]">
                        {ticket.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[#f4ead5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
                        {LAYOUT_LABELS[ticket.layout]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#6b7a6f]">
                      {ticket.from} → {ticket.to}
                    </p>
                    <p className="mt-2 text-[11px] text-[#9a8f7a]">
                      Cập nhật {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#e2d8c3] bg-[#fffdf7] p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[#14281e]">
                Bài viết
              </h2>
              <p className="text-xs text-[#9a8f7a]">
                Trạng thái duyệt của câu chuyện bạn gửi
              </p>
            </div>
            <Link
              href="/dashboard/posts"
              className="text-sm font-medium text-[#2f7d4f] hover:underline"
            >
              Quản lý
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9cdb4] p-8 text-center">
              <p className="text-sm font-medium text-[#3c5145]">
                Bạn chưa viết bài nào.
              </p>
              <Link
                href="/dashboard/posts/new"
                className="mt-4 inline-flex rounded-xl bg-[#14281e] px-5 py-2.5 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
              >
                Viết câu chuyện đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/posts/${post.id}`}
                    className="flex items-start gap-3 rounded-2xl p-2 transition hover:bg-[#f7f1e4]"
                  >
                    <span
                      className="mt-0.5 h-12 w-12 shrink-0 rounded-xl bg-[#e8dfc9] bg-cover bg-center"
                      style={
                        post.coverImageUrl
                          ? { backgroundImage: `url(${post.coverImageUrl})` }
                          : undefined
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#14281e]">
                        {post.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#9a8f7a]">
                        {post.category} · {formatDate(post.updatedAt)}
                      </span>
                      <span
                        className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${POST_STATUS_STYLES[post.status]}`}
                      >
                        {POST_STATUS_LABELS[post.status]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
