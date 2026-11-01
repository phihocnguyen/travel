import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  deleteTicket,
  getTicket,
  TicketValidationError,
  updateTicket,
} from "@/lib/tickets/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const ticket = await getTicket(session.sub, id);

    if (!ticket) {
      return NextResponse.json(
        { error: "Không tìm thấy thiết kế." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Không thể đọc thiết kế." },
      { status: 500 },
    );
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
    const ticket = await updateTicket(session.sub, id, body);

    if (!ticket) {
      return NextResponse.json(
        { error: "Không tìm thấy thiết kế." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update ticket", error);
    return NextResponse.json(
      { error: "Không thể cập nhật thiết kế. Vui lòng thử lại." },
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
    await deleteTicket(session.sub, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Không thể xoá thiết kế." },
      { status: 500 },
    );
  }
}
