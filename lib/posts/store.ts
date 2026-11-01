import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  POST_CATEGORIES,
  type BlogPost,
  type PostAuthor,
  type PostCategory,
  type PostInput,
  type PostStatus,
} from "./types";

const DATA_ROOT =
  process.env.POSTS_DATA_DIR ??
  path.join(process.cwd(), ".data", "posts");

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_COVER_BYTES = 8 * 1024 * 1024;

export class PostValidationError extends Error {}

function postFile(id: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new PostValidationError("Mã bài viết không hợp lệ.");
  }
  return path.join(DATA_ROOT, `${id}.json`);
}

function coverFile(id: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new PostValidationError("Mã bài viết không hợp lệ.");
  }
  return path.join(DATA_ROOT, `${id}.jpg`);
}

function coverUrl(id: string, updatedAt: string): string {
  return `/api/posts/${id}/cover?v=${encodeURIComponent(updatedAt)}`;
}

function text(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function category(value: unknown): PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory)
    ? (value as PostCategory)
    : POST_CATEGORIES[0];
}

function parseDataUrl(dataUrl: unknown): Buffer {
  if (typeof dataUrl !== "string") {
    throw new PostValidationError("Ảnh bìa không hợp lệ.");
  }

  const match = /^data:image\/jpeg;base64,([a-z0-9+/=]+)$/i.exec(dataUrl);

  if (!match) {
    throw new PostValidationError("Ảnh bìa phải là JPEG sau khi xử lý.");
  }

  const buffer = Buffer.from(match[1], "base64");

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_COVER_BYTES) {
    throw new PostValidationError("Ảnh bìa vượt quá dung lượng cho phép.");
  }

  return buffer;
}

function normalizeInput(value: unknown): Omit<PostInput, "coverImageDataUrl" | "removeCover"> {
  const raw = (value ?? {}) as Record<string, unknown>;

  return {
    title: text(raw.title, "Bài viết mới", 120),
    category: category(raw.category),
    excerpt: text(raw.excerpt, "", 320),
    content: text(raw.content, "", 20000),
  };
}

async function persist(post: BlogPost): Promise<void> {
  await mkdir(DATA_ROOT, { recursive: true });
  await writeFile(postFile(post.id), JSON.stringify(post, null, 2), "utf8");
}

async function writeCover(id: string, dataUrl: unknown): Promise<void> {
  const buffer = parseDataUrl(dataUrl);
  await mkdir(DATA_ROOT, { recursive: true });
  await writeFile(coverFile(id), buffer);
}

async function removeCover(id: string): Promise<void> {
  await rm(coverFile(id), { force: true });
}

async function readAll(): Promise<BlogPost[]> {
  let entries;

  try {
    entries = await readdir(DATA_ROOT, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const posts = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        try {
          const raw = await readFile(path.join(DATA_ROOT, entry.name), "utf8");
          const post = JSON.parse(raw) as BlogPost;
          return typeof post.id === "string" ? post : null;
        } catch {
          return null;
        }
      }),
  );

  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllPosts(): Promise<BlogPost[]> {
  return readAll();
}

export async function listPostsByAuthor(sub: string): Promise<BlogPost[]> {
  return (await readAll()).filter((post) => post.author.sub === sub);
}

export async function listApprovedPosts(): Promise<BlogPost[]> {
  return (await readAll()).filter((post) => post.status === "approved");
}

export async function listPendingPosts(): Promise<BlogPost[]> {
  return (await readAll()).filter((post) => post.status === "pending");
}

export async function getPost(id: string): Promise<BlogPost | null> {
  try {
    const raw = await readFile(postFile(id), "utf8");
    return JSON.parse(raw) as BlogPost;
  } catch {
    return null;
  }
}

export async function createPost(
  author: PostAuthor,
  value: unknown,
): Promise<BlogPost> {
  const normalized = normalizeInput(value);
  const raw = (value ?? {}) as PostInput;
  const id = randomUUID();
  const now = new Date().toISOString();
  const hasCover = typeof raw.coverImageDataUrl === "string";

  if (hasCover) {
    await writeCover(id, raw.coverImageDataUrl);
  }

  const post: BlogPost = {
    ...normalized,
    id,
    coverImageUrl: hasCover ? coverUrl(id, now) : null,
    status: "pending",
    author,
    createdAt: now,
    updatedAt: now,
    reviewedAt: null,
    reviewNote: null,
  };

  await persist(post);

  return post;
}

export async function updatePost(
  authorSub: string,
  id: string,
  value: unknown,
): Promise<BlogPost | null> {
  const existing = await getPost(id);

  if (!existing || existing.author.sub !== authorSub) return null;

  const normalized = normalizeInput(value);
  const raw = (value ?? {}) as PostInput;
  const now = new Date().toISOString();

  let cover = existing.coverImageUrl;

  if (typeof raw.coverImageDataUrl === "string") {
    await writeCover(id, raw.coverImageDataUrl);
    cover = coverUrl(id, now);
  } else if (raw.removeCover === true) {
    await removeCover(id);
    cover = null;
  }

  const post: BlogPost = {
    ...existing,
    ...normalized,
    id,
    coverImageUrl: cover,
    status: "pending",
    updatedAt: now,
    reviewedAt: null,
    reviewNote: null,
  };

  await persist(post);

  return post;
}

export async function deletePost(
  authorSub: string,
  id: string,
): Promise<boolean> {
  const existing = await getPost(id);

  if (!existing || existing.author.sub !== authorSub) return false;

  await rm(postFile(id), { force: true });
  await removeCover(id);

  return true;
}

export async function reviewPost(
  id: string,
  status: Extract<PostStatus, "approved" | "rejected">,
  note: string | null,
): Promise<BlogPost | null> {
  const existing = await getPost(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const post: BlogPost = {
    ...existing,
    status,
    updatedAt: now,
    reviewedAt: now,
    reviewNote: note,
  };

  await persist(post);

  return post;
}

export async function readCover(id: string): Promise<Buffer | null> {
  try {
    return await readFile(coverFile(id));
  } catch {
    return null;
  }
}
