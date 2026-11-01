import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  TICKET_LAYOUTS,
  type TicketDesign,
  type TicketInput,
  type TicketLayout,
  type TicketSticker,
  type TicketTheme,
} from "./types";

const DATA_ROOT =
  process.env.TICKETS_DATA_DIR ??
  path.join(process.cwd(), ".data", "tickets");

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export class TicketValidationError extends Error {}

function userKey(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 20);
}

function userDir(userId: string): string {
  return path.join(DATA_ROOT, userKey(userId));
}

function ticketFile(userId: string, id: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new TicketValidationError("Mã thiết kế không hợp lệ.");
  }
  return path.join(userDir(userId), `${id}.json`);
}

function imageFile(userId: string, id: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new TicketValidationError("Mã thiết kế không hợp lệ.");
  }
  return path.join(userDir(userId), `${id}.jpg`);
}

function imageUrl(id: string, updatedAt: string): string {
  return `/api/tickets/${id}/image?v=${encodeURIComponent(updatedAt)}`;
}

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

function parseDataUrl(dataUrl: unknown): Buffer {
  if (typeof dataUrl !== "string") {
    throw new TicketValidationError("Ảnh tải lên không hợp lệ.");
  }

  const match = /^data:image\/jpeg;base64,([a-z0-9+/=]+)$/i.exec(dataUrl);

  if (!match) {
    throw new TicketValidationError(
      "Ảnh phải ở định dạng JPEG sau khi xử lý.",
    );
  }

  const buffer = Buffer.from(match[1], "base64");

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new TicketValidationError("Ảnh vượt quá dung lượng cho phép (8MB).");
  }

  return buffer;
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
    : "classic";
}

type NormalizedTicket = Omit<TicketInput, "imageDataUrl" | "removeImage">;

function normalizeInput(value: unknown): NormalizedTicket {
  const raw = (value ?? {}) as Record<string, unknown>;
  const image = (raw.image ?? {}) as Record<string, unknown>;

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
    image: {
      scale: number(image.scale, 1, 1, 4),
      x: number(image.x, 0, -100, 100),
      y: number(image.y, 0, -100, 100),
    },
  };
}

async function persist(userId: string, design: TicketDesign): Promise<void> {
  await mkdir(userDir(userId), { recursive: true });
  await writeFile(
    ticketFile(userId, design.id),
    JSON.stringify(design, null, 2),
    "utf8",
  );
}

async function writeImage(
  userId: string,
  id: string,
  dataUrl: unknown,
): Promise<void> {
  const buffer = parseDataUrl(dataUrl);
  await mkdir(userDir(userId), { recursive: true });
  await writeFile(imageFile(userId, id), buffer);
}

async function removeImage(userId: string, id: string): Promise<void> {
  await rm(imageFile(userId, id), { force: true });
}

export async function listTickets(userId: string): Promise<TicketDesign[]> {
  const dir = userDir(userId);
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const tickets = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        try {
          const raw = await readFile(path.join(dir, entry.name), "utf8");
          const ticket = JSON.parse(raw) as TicketDesign;
          return typeof ticket.id === "string" ? ticket : null;
        } catch {
          return null;
        }
      }),
  );

  return tickets
    .filter((ticket): ticket is TicketDesign => ticket !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTicket(
  userId: string,
  id: string,
): Promise<TicketDesign | null> {
  try {
    const raw = await readFile(ticketFile(userId, id), "utf8");
    return JSON.parse(raw) as TicketDesign;
  } catch {
    return null;
  }
}

export async function createTicket(
  userId: string,
  value: unknown,
): Promise<TicketDesign> {
  const normalized = normalizeInput(value);
  const id = randomUUID();
  const now = new Date().toISOString();
  const hasImage = typeof (value as TicketInput)?.imageDataUrl === "string";

  if (hasImage) {
    await writeImage(userId, id, (value as TicketInput).imageDataUrl);
  }

  const design: TicketDesign = {
    ...normalized,
    id,
    image: {
      ...normalized.image,
      url: hasImage ? imageUrl(id, now) : null,
    },
    createdAt: now,
    updatedAt: now,
  };

  await persist(userId, design);

  return design;
}

export async function updateTicket(
  userId: string,
  id: string,
  value: unknown,
): Promise<TicketDesign | null> {
  const existing = await getTicket(userId, id);
  if (!existing) return null;

  const normalized = normalizeInput(value);
  const raw = (value ?? {}) as TicketInput;
  const now = new Date().toISOString();

  let url = existing.image.url;

  if (typeof raw.imageDataUrl === "string") {
    await writeImage(userId, id, raw.imageDataUrl);
    url = imageUrl(id, now);
  } else if (raw.removeImage === true) {
    await removeImage(userId, id);
    url = null;
  }

  const design: TicketDesign = {
    ...existing,
    ...normalized,
    id,
    image: {
      ...normalized.image,
      url,
    },
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await persist(userId, design);

  return design;
}

export async function deleteTicket(
  userId: string,
  id: string,
): Promise<boolean> {
  if (!ID_PATTERN.test(id)) {
    throw new TicketValidationError("Mã thiết kế không hợp lệ.");
  }

  await rm(ticketFile(userId, id), { force: true });
  await removeImage(userId, id);

  return true;
}

export async function readTicketImage(
  userId: string,
  id: string,
): Promise<Buffer | null> {
  try {
    return await readFile(imageFile(userId, id));
  } catch {
    return null;
  }
}
