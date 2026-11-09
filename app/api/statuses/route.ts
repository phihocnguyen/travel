import { getSession } from "@/lib/auth/session";
import { createPost, PostValidationError } from "@/lib/posts/store";
import { statusInput } from "@/lib/posts/status";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  let input;
  try { input = statusInput(body?.content); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  try {
    const post = await createPost(session, input);
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof PostValidationError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Status creation failed");
    return Response.json({ error: "Chưa thể đăng status. Bạn hãy thử lại." }, { status: 503 });
  }
}
