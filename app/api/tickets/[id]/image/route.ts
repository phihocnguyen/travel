import { getSession } from "@/lib/auth/session";
import {
  readTicketImage,
  TicketValidationError,
} from "@/lib/tickets/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  try {
    const image = await readTicketImage(session.sub, id);

    if (!image) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return new Response("Bad request", { status: 400 });
    }

    return new Response("Internal error", { status: 500 });
  }
}
