import { databasePool, reportFailure } from "./db-utils.mjs";
import { migrateImages } from "./image-migration.mjs";

const pool = databasePool();
let client;
try {
  client = await pool.connect();
  await client.query("SELECT pg_advisory_lock(726031944)");
  await migrateImages(client);
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  reportFailure("Image disk migration", error);
} finally {
  if (client) await client.query("SELECT pg_advisory_unlock(726031944)").catch(() => {});
  client?.release();
  await pool.end();
}
