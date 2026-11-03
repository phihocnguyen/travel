import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteTicketButton } from "@/components/dashboard/DeleteTicketButton";
import TicketPreview from "@/components/dashboard/TicketPreview";
import { getSession } from "@/lib/auth/session";
import { listTickets } from "@/lib/tickets/store";
import type { TicketLayout } from "@/lib/tickets/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Bộ sưu tập vé · Dong Thap Dashboard",
};

const LAYOUT_LABELS: Record<TicketLayout, string> = {
  left: "Ảnh trái",
  right: "Ảnh phải",
  full: "Toàn khung",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function TicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/tickets");
  }

  const tickets = await listTickets(session.sub);
  const withImage = tickets.filter((ticket) => ticket.image.url).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#93381f]">
            Thư viện
          </p>
          <h1 className="mt-1 font-display text-3xl text-[#15602c] md:text-4xl">
            Bộ sưu tập vé
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#45614a]">
            {tickets.length > 0
              ? `${tickets.length} thiết kế · ${withImage} vé có ảnh. Chọn một vé để chỉnh sửa.`
              : "Những tấm vé kỷ niệm cho hành trình của bạn sẽ được lưu ở đây."}
          </p>
        </div>

        <Link
          href="/dashboard/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#15602c] px-5 py-3 text-sm font-semibold text-[#fefbdf] transition hover:bg-[#207b58]"
        >
          + Vé mới
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-[#d8dfc1] bg-[#fffdf0]">
          <div className="grid gap-6 p-8 md:grid-cols-[1.1fr_1fr] md:items-center md:p-10">
            <div>
              <p className="font-display text-3xl leading-tight text-[#15602c]">
                Tấm vé đầu tiên đang chờ bạn.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#45614a]">
                Chọn mẫu voucher Đồng Tháp, thêm ảnh kỷ niệm, kéo – phóng to
                ảnh, dán sticker và viết lời nhắn. Mọi thứ được lưu lại để bạn
                quay về chỉnh sửa bất cứ lúc nào.
              </p>
              <Link
                href="/dashboard/tickets/new"
                className="mt-6 inline-flex rounded-xl bg-[#15602c] px-6 py-3 text-sm font-semibold text-[#fefbdf] transition hover:bg-[#207b58]"
              >
                Thiết kế vé đầu tiên
              </Link>
            </div>

            <div className="rounded-2xl border border-[#d8dfc1] bg-[#fefbdf] p-4">
              <div className="aspect-[103/58] w-full rounded-xl bg-[#15602c] p-5">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#feb212]">
                  Dong Thap · The Waterways
                </p>
                <p className="mt-3 font-display text-2xl leading-tight text-[#fffdf0]">
                  Vé kỷ niệm
                  <br />
                  mùa nước nổi
                </p>
                <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#fefbdf]/50">
                  Đồng Tháp → Người bạn
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="group overflow-hidden rounded-3xl border border-[#d8dfc1] bg-[#fffdf0] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={`/dashboard/tickets/${ticket.id}`}>
                <TicketPreview
                  design={ticket}
                  className="aspect-[103/58] w-full border-b border-[#eee5d2] transition group-hover:opacity-95"
                />
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-[#15602c]">
                      {ticket.title}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-[#45614a]">
                      {ticket.from} → {ticket.to}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#fefbdf] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93381f]">
                    {LAYOUT_LABELS[ticket.layout]}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-[#45614a]">
                  {ticket.message}
                </p>

                <p className="mt-3 text-[11px] text-[#9a8f7a]">
                  Cập nhật {formatDate(ticket.updatedAt)}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#eee5d2] pt-3">
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="rounded-lg bg-[#fefbdf] px-3 py-2 text-sm font-semibold text-[#6b5a3d] transition hover:bg-[#ecdfc4]"
                  >
                    Chỉnh sửa
                  </Link>
                  <DeleteTicketButton
                    ticketId={ticket.id}
                    title={ticket.title}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
