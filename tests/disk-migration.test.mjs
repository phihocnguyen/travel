import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { IMAGE_TABLES, migrateImages } from "../scripts/image-migration.mjs";
import { readImage } from "../lib/storage/disk.mjs";

test("SQL migration preserves old images and exports them safely", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "travel-image-migration-"));
  const original = process.env.IMAGE_STORAGE_DIR;
  const db = new PGlite();
  const bytes = Buffer.from("existing image");
  try {
    process.env.IMAGE_STORAGE_DIR = path.join(root, "uploads");
    // Minimal original tables isolate the actual additive migration under test.
    for (const [table, column] of IMAGE_TABLES) {
      await db.exec(`CREATE TABLE ${table} (${column} integer PRIMARY KEY,
        image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 16777216))`);
      await db.query(`INSERT INTO ${table} VALUES (1,$1)`, [bytes]);
    }
    await db.exec(await readFile(new URL("../db/migrations/011_disk_images.sql", import.meta.url), "utf8"));

    await t.test("additive SQL leaves legacy bytes intact", async () => {
      for (const [table] of IMAGE_TABLES) {
        const row = (await db.query(`SELECT * FROM ${table}`)).rows[0];
        assert.equal(row.file_path, null);
        assert.deepEqual(Buffer.from(row.image_data), bytes);
      }
    });
    await t.test("failed disk writes roll back without clearing legacy bytes", async () => {
      const blocked = path.join(root, "blocked");
      await writeFile(blocked, "not a directory");
      process.env.IMAGE_STORAGE_DIR = blocked;
      await assert.rejects(migrateImages(db, () => {}));
      const row = (await db.query("SELECT * FROM ticket_images")).rows[0];
      assert.equal(row.file_path, null);
      assert.deepEqual(Buffer.from(row.image_data), bytes);
      process.env.IMAGE_STORAGE_DIR = path.join(root, "uploads");
    });
    await t.test("an interruption preserves completed rows and rolls back the current row", async () => {
      const interrupted = {
        query(sql, values) {
          if (sql.includes("FROM blog_covers")) throw new Error("Interrupted export");
          return db.query(sql, values);
        },
      };
      await assert.rejects(migrateImages(interrupted, () => {}), /Interrupted export/);
      const done = (await db.query("SELECT * FROM ticket_images")).rows[0];
      const pending = (await db.query("SELECT * FROM blog_covers")).rows[0];
      assert.equal(done.image_data, null);
      assert.deepEqual(await readImage(done.file_path), bytes);
      assert.deepEqual(Buffer.from(pending.image_data), bytes);
      assert.equal(pending.file_path, null);
    });
    await t.test("resume exports all four tables and keeps only disk references", async () => {
      await migrateImages(db, () => {});
      for (const [table, , group] of IMAGE_TABLES) {
        const row = (await db.query(`SELECT * FROM ${table}`)).rows[0];
        assert.equal(row.image_data, null);
        assert.ok(row.file_path.startsWith(`${group}/`));
        assert.deepEqual(await readImage(row.file_path), bytes);
      }
    });
    await t.test("reruns are safe and SQL rejects ambiguous or unsafe storage", async () => {
      await migrateImages(db, () => {});
      for (const [table, column, group] of IMAGE_TABLES) {
        await assert.rejects(db.query(`INSERT INTO ${table} (${column}) VALUES (2)`), /image_storage_location/);
        await assert.rejects(db.query(`INSERT INTO ${table} (${column},image_data,file_path) VALUES (2,$1,$2)`, [bytes, `${group}/${"0".repeat(64)}`]), /image_storage_location/);
        await assert.rejects(db.query(`INSERT INTO ${table} (${column},file_path) VALUES (2,'../../secret')`), /image_storage_key/);
        await db.query(`INSERT INTO ${table} (${column},file_path) VALUES (2,$1)`, [`${group}/${"0".repeat(64)}`]);
      }
    });
  } finally {
    await db.close();
    if (original === undefined) delete process.env.IMAGE_STORAGE_DIR;
    else process.env.IMAGE_STORAGE_DIR = original;
    await rm(root, { recursive: true, force: true });
  }
});
