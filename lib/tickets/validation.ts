import { type TicketInput, type TicketTitleTransform, type TicketTextTransform, TICKET_STICKER_ASSETS, STICKER_CHOICES, type TicketSticker } from "./types";
import { FIXED_TICKET, TICKET_MESSAGES } from "./template";
import { TICKET_NAME_FONTS } from "./name-style";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export class TicketValidationError extends Error {}

const MAX_STICKERS = 8;
const TICKET_ASPECT_RATIO = 1417 / 827;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeStickers(value: unknown): TicketSticker[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_STICKERS).flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const raw = item as Record<string, unknown>;
    const asset = TICKET_STICKER_ASSETS.find((choice) => choice.id === raw.asset)?.id;
    const emoji = STICKER_CHOICES.find((choice) => choice === raw.emoji);
    if (!asset && !emoji) return [];
    const number = (key: string, fallback: number) => {
      const parsed = Number(raw[key]);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const size = clamp(number("size", 18), 6, 30);
    const rotation = clamp(number("rotation", 0), -30, 30);
    const rotatedFactor = Math.abs(Math.cos(rotation * Math.PI / 180)) + Math.abs(Math.sin(rotation * Math.PI / 180));
    const xMargin = size * rotatedFactor / 2;
    const x = clamp(number("x", 20), xMargin, 100 - xMargin);
    const yMargin = size * TICKET_ASPECT_RATIO * rotatedFactor / 2;
    const y = clamp(number("y", 70), yMargin, 100 - yMargin);
    const id = typeof raw.id === "string" && raw.id.length <= 80 ? raw.id : `sticker-${index}`;
    return [{ id, ...(asset ? { asset } : { emoji }), x, y, size, rotation }];
  });
}

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
  return { ...FIXED_TICKET, theme: { ...FIXED_TICKET.theme, ink, nameFont }, stickers: normalizeStickers(raw.stickers), to: recipient, message: selectedMessage.text };
}
