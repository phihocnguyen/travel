import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth/session";
import {
  createPost,
  listAllPosts,
  listApprovedPosts,
  listPendingPosts,
  listPostsByAuthor,
  PostValidationError,
} from "@/lib/posts/store";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope") ?? "approved";

  if (scope === "approved") {
    return NextResponse.json({ posts: await listApprovedPosts() });
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (scope === "mine") {
    return NextResponse.json({ posts: await listPostsByAuthor(session.sub) });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (scope === "pending") {
    return NextResponse.json({ posts: await listPendingPosts() });
  }

  return NextResponse.json({ posts: await listAllPosts() });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    const post = await createPost(
      { sub: session.sub, name: session.name, email: session.email },
      body,
    );

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to create post", error);
    return NextResponse.json(
      { error: "Không thể lưu bài viết. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
