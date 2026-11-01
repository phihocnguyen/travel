import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth/session";
import {
  deletePost,
  getPost,
  PostValidationError,
  updatePost,
} from "@/lib/posts/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const post = await getPost(id);

    if (!post) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 },
      );
    }

    if (post.status === "approved") {
      return NextResponse.json({ post });
    }

    const session = await getSession();
    const allowed =
      session && (post.author.sub === session.sub || isAdmin(session));

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Không thể đọc bài viết." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  try {
    const post = await updatePost(session.sub, id, body);

    if (!post) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết hoặc bạn không có quyền sửa." },
        { status: 404 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update post", error);
    return NextResponse.json(
      { error: "Không thể cập nhật bài viết. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deletePost(session.sub, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết hoặc bạn không có quyền xoá." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Không thể xoá bài viết." }, { status: 500 });
  }
}
