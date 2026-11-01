import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PostEditor from "@/components/dashboard/PostEditor";
import { getSession, isAdmin } from "@/lib/auth/session";
import { getPost } from "@/lib/posts/store";

export const instant = false;

export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết · Dong Thap Dashboard",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: PageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/posts");
  }

  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  if (post.author.sub !== session.sub && !isAdmin(session)) {
    notFound();
  }

  return <PostEditor post={post} />;
}
