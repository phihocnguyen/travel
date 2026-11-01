import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  createTicket,
  listTickets,
  TicketValidationError,
} from "@/lib/tickets/store";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await listTickets(session.sub);

  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    const ticket = await createTicket(session.sub, body);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to create ticket", error);
    return NextResponse.json(
      { error: "Không thể lưu thiết kế. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
