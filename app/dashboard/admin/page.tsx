import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReviewActions } from "@/components/dashboard/ReviewActions";
import { getSession, isAdmin } from "@/lib/auth/session";
import { listAllPosts } from "@/lib/posts/store";
import { POST_STATUS_LABELS, type BlogPost } from "@/lib/posts/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Duyệt bài · Dong Thap Dashboard",
};

const STATUS_STYLES: Record<BlogPost["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminReviewPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/admin");
  }

  if (!isAdmin(session)) {
    redirect("/dashboard");
  }

  const posts = await listAllPosts();
  const pending = posts.filter((post) => post.status === "pending");
  const reviewed = posts.filter((post) => post.status !== "pending").slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a4651c]">
          Quản trị
        </p>
        <h1 className="mt-1 font-display text-3xl text-[#14281e]">
          Duyệt bài viết
        </h1>
        <p className="mt-1 text-sm text-[#6b7a6f]">
          {pending.length > 0
            ? `${pending.length} bài viết đang chờ duyệt.`
            : "Không có bài viết nào đang chờ duyệt."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b7a6f]">
          Chờ duyệt
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d9cdb4] bg-white p-10 text-center text-sm text-[#6b7a6f]">
            Hàng đợi trống. Bài viết mới sẽ xuất hiện ở đây.
          </div>
        ) : (
          pending.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-3xl border border-[#e2d8c3] bg-white shadow-sm md:flex"
            >
              <div
                className="aspect-[16/9] w-full bg-cover bg-center md:aspect-auto md:w-64 md:shrink-0"
                style={
                  post.coverImageUrl
                    ? { backgroundImage: `url(${post.coverImageUrl})` }
                    : {
                        background:
                          "linear-gradient(135deg, #2f7d4f 0%, #14281e 100%)",
                      }
                }
              />

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
                    {post.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[post.status]}`}
                  >
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                  <span className="text-xs text-[#9a8f7a]">
                    {post.author.name} · {post.author.email}
                  </span>
                </div>

                <h3 className="mt-2 font-display text-xl text-[#14281e]">
                  {post.title}
                </h3>
                <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[#6b7a6f]">
                  {post.content}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5d2] pt-4">
                  <p className="text-xs text-[#9a8f7a]">
                    Gửi lúc {formatDate(post.createdAt)}
                  </p>
                  <ReviewActions postId={post.id} />
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b7a6f]">
            Đã xử lý gần đây
          </h2>

          <div className="divide-y divide-[#eee5d2] overflow-hidden rounded-3xl border border-[#e2d8c3] bg-white">
            {reviewed.map((post) => (
              <div
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#14281e]">
                    {post.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#9a8f7a]">
                    {post.author.email} · {formatDate(post.updatedAt)}
                    {post.reviewNote ? ` · ${post.reviewNote}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[post.status]}`}
                >
                  {POST_STATUS_LABELS[post.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
