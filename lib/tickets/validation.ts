import { type TicketInput, type TicketTitleTransform, type TicketTextTransform } from "./types";
import { FIXED_TICKET, TICKET_MESSAGES } from "./template";
import { TICKET_NAME_FONTS } from "./name-style";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export class TicketValidationError extends Error {}

function text(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

export function parseDataUrl(dataUrl: unknown): {
  buffer: Buffer;
  extension: "jpg" | "png";
  contentType: "image/jpeg" | "image/png";
} {
  if (typeof dataUrl !== "string") {
    throw new TicketValidationError("Ảnh tải lên không hợp lệ.");
  }
  if (dataUrl.length > 12 * 1024 * 1024) throw new TicketValidationError("Ảnh vượt quá dung lượng cho phép.");

  const match = /^data:image\/(jpeg|png);base64,([a-z0-9+/=]+)$/i.exec(dataUrl);

  if (!match) {
    throw new TicketValidationError(
      "Ảnh phải ở định dạng JPEG sau khi xử lý.",
    );
  }

  const isPng = match[1].toLowerCase() === "png";
  const buffer = Buffer.from(match[2], "base64");

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new TicketValidationError("Ảnh vượt quá dung lượng cho phép (8MB).");
  }

  return {
    buffer,
    extension: isPng ? "png" : "jpg",
    contentType: isPng ? "image/png" : "image/jpeg",
  };
}

type NormalizedTicket = Omit<
  TicketInput,
  "imageDataUrl" | "removeImage" | "titleTransform" | "textTransform"
> & {
  titleTransform: TicketTitleTransform;
  textTransform: TicketTextTransform;
};

export function normalizeInput(value: unknown): NormalizedTicket {
  const raw = (value ?? {}) as Record<string, unknown>;
  const recipient = text(raw.to, "", 40);
  if (!recipient) throw new TicketValidationError("Vui lòng nhập tên trên vé.");
  const selectedMessage = TICKET_MESSAGES.find(item => item.text === raw.message);
  if (!selectedMessage) throw new TicketValidationError("Vui lòng chọn một mẫu lời nhắn.");
  const theme = raw.theme && typeof raw.theme === "object" ? raw.theme as Record<string, unknown> : {};
  const ink = typeof theme.ink === "string" && /^#[0-9a-f]{6}$/i.test(theme.ink) ? theme.ink : FIXED_TICKET.theme.ink;
  const nameFont = TICKET_NAME_FONTS.find(font => font.id === theme.nameFont)?.id ?? "serif";
  return { ...FIXED_TICKET, theme: { ...FIXED_TICKET.theme, ink, nameFont }, to: recipient, message: selectedMessage.text };
}
