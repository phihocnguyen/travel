import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts/store";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post || post.status !== "approved") {
    return { title: "Không tìm thấy bài viết" };
  }

  return {
    title: `${post.title} · Dong Thap`,
    description: post.excerpt || post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl }]
        : undefined,
    },
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post || post.status !== "approved") {
    notFound();
  }

  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="min-h-dvh bg-[#f6f1e6] text-[#14281e]">
      <header className="border-b border-[#e2d8c3] bg-[#fffdf7]/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/blog" className="leading-none">
            <span className="block font-display text-xl tracking-[0.08em]">
              Dong Thap
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.32em] text-[#6b7a6f]">
              The Waterways
            </span>
          </Link>
          <Link
            href="/blog"
            className="text-sm text-[#6b7a6f] transition hover:text-[#14281e]"
          >
            ← Tất cả câu chuyện
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12">
        <span className="rounded-full bg-[#f4ead5] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
          {post.category}
        </span>
        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-[#6b7a6f]">
          {post.author.name} · {formatDate(post.updatedAt)}
        </p>

        <div
          className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-cover bg-center"
          style={
            post.coverImageUrl
              ? { backgroundImage: `url(${post.coverImageUrl})` }
              : {
                  background:
                    "linear-gradient(135deg, #2f7d4f 0%, #14281e 100%)",
                }
          }
        />

        {post.excerpt ? (
          <p className="mt-8 border-l-2 border-[#a4651c] pl-4 font-display text-xl leading-relaxed text-[#3c5145]">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-8 space-y-5 text-[15px] leading-8 text-[#3c5145]">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#e2d8c3] pt-6">
          <p className="text-sm text-[#6b7a6f]">
            Đã duyệt bởi quản trị viên Dong Thap.
          </p>
          <Link
            href="/dashboard/posts/new"
            className="rounded-xl bg-[#14281e] px-5 py-2.5 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a]"
          >
            Chia sẻ câu chuyện của bạn
          </Link>
        </div>
      </article>
    </main>
  );
}
