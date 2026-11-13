import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const GROUPS = new Set(["ticket-images", "ticket-outputs", "blog-covers", "blog-images"]);
const KEY = /^(ticket-images|ticket-outputs|blog-covers|blog-images)\/[a-f0-9]{64}$/;

export function imageStorageRoot() {
  // Runtime volume contents must never be traced into the Next.js build output.
  return path.resolve(/* turbopackIgnore: true */ process.env.IMAGE_STORAGE_DIR || path.join(process.cwd(), ".data", "uploads"));
}

function imagePath(key) {
  if (typeof key !== "string" || !KEY.test(key)) throw new Error("Invalid image storage key");
  return path.join(/* turbopackIgnore: true */ imageStorageRoot(), ...key.split("/"));
}

/** Immutable, content-addressed files keep concurrent edits and DB rollbacks safe. */
export async function writeImage(group, data) {
  if (!GROUPS.has(group) || !Buffer.isBuffer(data) || data.length === 0) {
    throw new Error("Invalid image storage input");
  }
  const key = `${group}/${createHash("sha256").update(data).digest("hex")}`;
  const destination = imagePath(key);
  await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(data);
      await file.sync();
    } finally {
      await file.close();
    }
    try {
      // Publish only complete files. A hard link never replaces another writer's file.
      await link(temporary, destination);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (!(await readFile(destination)).equals(data)) throw new Error("Image disk integrity check failed");
    }
    if (process.platform !== "win32") {
      const directory = await open(path.dirname(destination), "r");
      try { await directory.sync(); } finally { await directory.close(); }
    }
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; });
  }
  return key;
}

export async function readImage(key) {
  try {
    return await readFile(imagePath(key));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/** Legacy bytes remain readable until the migration has safely exported them. */
export async function readStoredImage(row) {
  if (!row) return null;
  return row.file_path ? readImage(row.file_path) : row.image_data ?? null;
}
