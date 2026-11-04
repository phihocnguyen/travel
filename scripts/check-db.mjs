import { createRequire } from "node:module";
import pg from "pg";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured. Set it in .env.local.");
  process.exitCode = 1;
} else {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    enableChannelBinding: true,
    max: 1,
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
  });
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query("SELECT current_database() AS database, current_user AS username");
      // A pooled endpoint terminates TLS at its proxy, so pg_stat_ssl does not
      // describe the client-to-Neon connection. Check the actual client socket.
      const tls = client.connection.stream.encrypted === true;
      if (!tls) throw Object.assign(new Error("TLS required"), { code: "TLS_REQUIRED" });
      console.log("PostgreSQL connection verified:", { ...rows[0], tls });
    } finally {
      client.release();
    }
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "CONNECTION_FAILED";
    console.error(`PostgreSQL connection check failed (${code}).`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
