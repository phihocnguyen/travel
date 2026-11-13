import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { databasePool, reportFailure } from "./db-utils.mjs";
import { imageStorageRoot } from "../lib/storage/disk.mjs";

// Stop all application writers before running with --delete. Default is a dry run.
const pool = databasePool();
try {
  const referenced = new Set();
  for (const table of ["ticket_images", "ticket_outputs", "blog_covers", "blog_images"]) {
    const result = await pool.query(`SELECT file_path FROM ${table} WHERE file_path IS NOT NULL`);
    for (const row of result.rows) referenced.add(row.file_path);
  }
  let count = 0;
  for (const group of ["ticket-images", "ticket-outputs", "blog-covers", "blog-images"]) {
    const directory = path.join(imageStorageRoot(), group);
    const files = await readdir(directory, { withFileTypes: true }).catch(error => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const file of files) {
      if (!file.isFile() || !/^[a-f0-9]{64}(\.[0-9a-f-]{36}\.tmp)?$/.test(file.name)) continue;
      const key = `${group}/${file.name}`;
      if (referenced.has(key)) continue;
      // Keep recent files, including files written before a pending DB commit.
      const filename = path.join(directory, file.name);
      if (Date.now() - (await stat(filename)).mtimeMs < 24 * 60 * 60 * 1000) continue;
      if (process.argv.includes("--delete")) await unlink(filename);
      count++;
    }
  }
  console.log(`${process.argv.includes("--delete") ? "Deleted" : "Would delete"} ${count} unreferenced images older than 24 hours.`);
} catch (error) {
  reportFailure("Image cleanup", error);
} finally {
  await pool.end();
}
