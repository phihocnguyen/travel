import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readImage, readStoredImage, writeImage } from "../lib/storage/disk.mjs";

test("image disk storage", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "travel-images-"));
  const original = process.env.IMAGE_STORAGE_DIR;
  process.env.IMAGE_STORAGE_DIR = path.join(root, "uploads");
  try {
    const bytes = Buffer.from("original image bytes");
    const key = await writeImage("ticket-images", bytes);
    await t.test("round trip and stable content addressing", async () => {
      assert.deepEqual(await readImage(key), bytes);
      assert.equal(await writeImage("ticket-images", bytes), key);
      assert.equal(await readStoredImage(null), null);
      assert.deepEqual(await readStoredImage({ file_path: key }), bytes);
      assert.deepEqual(await readStoredImage({ image_data: bytes }), bytes);
    });
    await t.test("edits do not overwrite an earlier transaction's file", async () => {
      const next = await writeImage("ticket-images", Buffer.from("new image"));
      assert.notEqual(next, key);
      assert.deepEqual(await readImage(key), bytes);
    });
    await t.test("an existing corrupted file is never silently accepted", async () => {
      const key = await writeImage("blog-covers", bytes);
      await writeFile(path.join(root, "uploads", ...key.split("/")), "corrupt");
      await assert.rejects(writeImage("blog-covers", bytes), /integrity check failed/);
    });
    await t.test("concurrent writes are complete and leave no temporary files", async () => {
      const keys = await Promise.all(Array.from({ length: 12 }, () => writeImage("blog-images", bytes)));
      assert.equal(new Set(keys).size, 1);
      assert.deepEqual(await readImage(keys[0]), bytes);
      assert.equal((await readdir(path.join(root, "uploads", "blog-images"))).length, 1);
    });
    await t.test("rejects traversal, absolute paths and unsupported groups", async () => {
      await writeFile(path.join(root, "private.txt"), "secret");
      for (const bad of ["../private.txt", "/etc/passwd", "ticket-images/../../private.txt", "ticket-images\\..\\private.txt"]) {
        await assert.rejects(readImage(bad), /Invalid image storage key/);
      }
      await assert.rejects(writeImage("../../public", bytes), /Invalid image storage input/);
      await assert.rejects(writeImage("blog-images", Buffer.alloc(0)), /Invalid image storage input/);
      assert.equal(await readFile(path.join(root, "private.txt"), "utf8"), "secret");
    });
    await t.test("missing files return null without falling back to stale DB data", async () => {
      const missing = `blog-covers/${"0".repeat(64)}`;
      assert.equal(await readImage(missing), null);
      assert.equal(await readStoredImage({ file_path: missing, image_data: bytes }), null);
    });
    await t.test("disk errors prevent a successful write", async () => {
      const blocked = path.join(root, "not-a-directory");
      await writeFile(blocked, "blocked");
      process.env.IMAGE_STORAGE_DIR = blocked;
      await assert.rejects(writeImage("blog-images", bytes));
    });
  } finally {
    if (original === undefined) delete process.env.IMAGE_STORAGE_DIR;
    else process.env.IMAGE_STORAGE_DIR = original;
    await rm(root, { recursive: true, force: true });
  }
});
