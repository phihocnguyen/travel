import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedPosts } from "@/lib/posts/store";

export const instant = false;

export const metadata: Metadata = {
  title: "Câu chuyện · Dong Thap · The Waterways",
  description:
    "Câu chuyện du lịch, ẩm thực và cẩm nang khám phá Đồng Tháp.",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await listApprovedPosts();

  return (
    <main className="min-h-dvh bg-[#f6f1e6] text-[#14281e]">
      <header className="border-b border-[#e2d8c3] bg-[#fffdf7]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="leading-none">
            <span className="block font-display text-xl tracking-[0.08em]">
              Dong Thap
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.32em] text-[#6b7a6f]">
              The Waterways
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard/posts/new"
              className="rounded-xl bg-[#14281e] px-4 py-2 font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
            >
              Viết bài
            </Link>
            <Link
              href="/dashboard"
              className="text-[#6b7a6f] transition hover:text-[#14281e]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#a4651c]">
          Câu chuyện
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">
          Những chuyến đi trên đất sen hồng.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6b7a6f]">
          Bài viết được cộng đồng gửi lên và duyệt bởi quản trị viên: điểm đến,
          món ăn, mùa nước nổi và những con người dọc sông Tiền, sông Hậu.
        </p>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#d9cdb4] bg-white p-12 text-center text-sm text-[#6b7a6f]">
            Chưa có bài viết nào được duyệt. Hãy là người đầu tiên chia sẻ câu
            chuyện của bạn.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group overflow-hidden rounded-3xl border border-[#e2d8c3] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full bg-cover bg-center transition group-hover:opacity-95"
                  style={
                    post.coverImageUrl
                      ? { backgroundImage: `url(${post.coverImageUrl})` }
                      : {
                          background:
                            "linear-gradient(135deg, #2f7d4f 0%, #14281e 100%)",
                        }
                  }
                />
                <div className="p-5">
                  <span className="rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
                    {post.category}
                  </span>
                  <h2 className="mt-3 font-display text-2xl leading-tight text-[#14281e]">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6b7a6f]">
                    {post.excerpt || post.content}
                  </p>
                  <p className="mt-4 text-xs text-[#9a8f7a]">
                    {post.author.name} · {formatDate(post.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
