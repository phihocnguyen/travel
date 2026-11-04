import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { databasePool, reportFailure } from "./db-utils.mjs";

const pool = databasePool();
let client;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  // Serialize migration runners, including through Neon's transaction pooler.
  await client.query("SELECT pg_advisory_xact_lock(726031941)");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = new URL("../db/migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => /^\d+.*\.sql$/.test(file)).sort();
  for (const name of files) {
    const sql = await readFile(new URL(name, directory), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const previous = await client.query("SELECT checksum FROM schema_migrations WHERE name = $1", [name]);
    if (previous.rows.length) {
      if (previous.rows[0].checksum !== checksum) throw Object.assign(new Error("Applied migration changed"), { code: "MIGRATION_CHECKSUM_MISMATCH" });
      console.log(`Already applied: ${name}`);
      continue;
    }
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)", [name, checksum]);
    console.log(`Applied: ${name}`);
  }
  await client.query("COMMIT");
  console.log("Database migrations complete.");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  reportFailure("Database migration", error);
} finally {
  client?.release();
  await pool.end();
}
