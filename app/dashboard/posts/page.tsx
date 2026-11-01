import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeletePostButton } from "@/components/dashboard/DeletePostButton";
import { getSession, isAdmin } from "@/lib/auth/session";
import { listPendingPosts, listPostsByAuthor } from "@/lib/posts/store";
import {
  POST_STATUS_LABELS,
  type BlogPost,
} from "@/lib/posts/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Bài viết · Dong Thap Dashboard",
};

const STATUS_STYLES: Record<BlogPost["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function DashboardPostsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/posts");
  }

  const posts = await listPostsByAuthor(session.sub);
  const pendingCount = isAdmin(session) ? (await listPendingPosts()).length : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a4651c]">
            Blog
          </p>
          <h1 className="mt-1 font-display text-3xl text-[#14281e]">
            Bài viết của tôi
          </h1>
          <p className="mt-1 text-sm text-[#6b7a6f]">
            {posts.length > 0
              ? `${posts.length} bài viết. Bài mới hoặc chỉnh sửa sẽ cần quản trị viên duyệt lại.`
              : "Chia sẻ câu chuyện chuyến đi của bạn với cộng đồng."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin(session) ? (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9cdb4] bg-white px-4 py-3 text-sm font-semibold text-[#3c5145] transition hover:bg-[#f7f1e4]"
            >
              Duyệt bài
              {pendingCount > 0 ? (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#14281e] px-5 py-3 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
          >
            + Viết bài
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9cdb4] bg-white p-12 text-center">
          <p className="font-display text-2xl text-[#14281e]">
            Chưa có bài viết nào
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6b7a6f]">
            Viết về điểm đến, món ăn hay kinh nghiệm du lịch Đồng Tháp. Bài
            viết sẽ được gửi tới quản trị viên để duyệt trước khi xuất bản.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="mt-6 inline-flex rounded-xl bg-[#14281e] px-6 py-3 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
          >
            Viết bài đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
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
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
                        {post.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[post.status]}`}
                      >
                        {POST_STATUS_LABELS[post.status]}
                      </span>
                    </div>
                    <h2 className="mt-2 line-clamp-1 font-display text-xl text-[#14281e]">
                      {post.title}
                    </h2>
                  </div>

                  <p className="text-xs text-[#9a8f7a]">
                    Cập nhật {formatDate(post.updatedAt)}
                  </p>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b7a6f]">
                  {post.excerpt || post.content}
                </p>

                {post.status === "rejected" && post.reviewNote ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    Lý do: {post.reviewNote}
                  </p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/posts/${post.id}`}
                      className="rounded-lg bg-[#f4ead5] px-3 py-2 text-sm font-semibold text-[#6b5a3d] transition hover:bg-[#ecdfc4]"
                    >
                      Chỉnh sửa
                    </Link>
                    {post.status === "approved" ? (
                      <Link
                        href={`/blog/${post.id}`}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Xem công khai
                      </Link>
                    ) : null}
                  </div>
                  <DeletePostButton postId={post.id} title={post.title} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
