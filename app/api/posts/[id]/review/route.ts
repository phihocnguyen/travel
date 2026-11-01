import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth/session";
import { PostValidationError, reviewPost } from "@/lib/posts/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { action?: string; note?: string }
    | null;

  const action = body?.action;
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, 500) || null : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Hành động duyệt không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const post = await reviewPost(
      id,
      action === "approve" ? "approved" : "rejected",
      note,
    );

    if (!post) {
      return NextResponse.json(
        { error: "Không tìm thấy bài viết." },
        { status: 404 },
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái bài viết." },
      { status: 500 },
    );
  }
}
