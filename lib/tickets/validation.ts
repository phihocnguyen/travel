import { TICKET_LAYOUTS, DEFAULT_TICKET_IMAGE_SCALE, DEFAULT_TICKET_TEXT_TRANSFORM, DEFAULT_TICKET_TITLE_TRANSFORM, type TicketTheme, type TicketSticker, type TicketLayout, type TicketInput, type TicketTitleTransform, type TicketTextTransform } from "./types";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export class TicketValidationError extends Error {}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function text(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function number(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
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

function normalizeTheme(value: unknown): TicketTheme {
  const theme = (value ?? {}) as Partial<TicketTheme>;
  return {
    background: color(theme.background, "#f4ecd8"),
    ink: color(theme.ink, "#1d2a22"),
    accent: color(theme.accent, "#28723e"),
  };
}

function normalizeStickers(value: unknown): TicketSticker[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 40).map((entry, index) => {
    const raw = (entry ?? {}) as Partial<TicketSticker>;
    const emoji =
      typeof raw.emoji === "string"
        ? Array.from(raw.emoji).slice(0, 4).join("")
        : "🌾";
    const id =
      typeof raw.id === "string" && /^[\w-]{1,64}$/.test(raw.id)
        ? raw.id
        : `sticker-${index}`;

    return {
      id,
      emoji: emoji || "🌾",
      x: number(raw.x, 50, 0, 100),
      y: number(raw.y, 50, 0, 100),
      size: number(raw.size, 10, 4, 30),
      rotation: number(raw.rotation, 0, -180, 180),
    };
  });
}

function normalizeLayout(value: unknown): TicketLayout {
  return TICKET_LAYOUTS.includes(value as TicketLayout)
    ? (value as TicketLayout)
    : "left";
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
  const image = (raw.image ?? {}) as Record<string, unknown>;
  const titleTransform = (raw.titleTransform ?? {}) as Record<string, unknown>;
  const textTransform = (raw.textTransform ?? {}) as Record<string, unknown>;

  return {
    title: text(raw.title, "Vé du lịch Đồng Tháp", 90),
    from: text(raw.from, "Đồng Tháp", 40),
    to: text(raw.to, "Người bạn", 40),
    message: text(
      raw.message,
      "Chúc bạn một chuyến đi thật đẹp và nhiều kỷ niệm đáng nhớ.",
      800,
    ),
    layout: normalizeLayout(raw.layout),
    theme: normalizeTheme(raw.theme),
    stickers: normalizeStickers(raw.stickers),
    titleTransform: {
      scale: number(
        titleTransform.scale,
        DEFAULT_TICKET_TITLE_TRANSFORM.scale,
        0.55,
        1.5,
      ),
      x: number(titleTransform.x, 0, -24, 24),
      y: number(titleTransform.y, 0, -10, 10),
    } satisfies TicketTitleTransform,
    textTransform: {
      scale: number(textTransform.scale, DEFAULT_TICKET_TEXT_TRANSFORM.scale, 0.55, 1.2),
      x: number(textTransform.x, DEFAULT_TICKET_TEXT_TRANSFORM.x, -24, 24),
      y: number(textTransform.y, DEFAULT_TICKET_TEXT_TRANSFORM.y, -10, 10),
    } satisfies TicketTextTransform,
    image: {
      scale: number(image.scale, DEFAULT_TICKET_IMAGE_SCALE, 0.2, 2.5),
      x: number(image.x, 0, -250, 250),
      y: number(image.y, 0, -250, 250),
    },
  };
}
