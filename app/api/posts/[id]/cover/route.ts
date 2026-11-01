import { getSession, isAdmin } from "@/lib/auth/session";
import { getPost, readCover } from "@/lib/posts/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const post = await getPost(id);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  if (post.status !== "approved") {
    const session = await getSession();
    const allowed =
      session && (post.author.sub === session.sub || isAdmin(session));

    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const image = await readCover(id);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
