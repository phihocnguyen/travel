import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return Response.json(
    { user: session ? { name: session.name, picture: session.picture } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
