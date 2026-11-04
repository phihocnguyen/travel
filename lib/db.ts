import "server-only";

import { Pool } from "pg";

const globalDatabase = globalThis as typeof globalThis & { postgresPool?: Pool };

/** Lazily connect so importing a server module does not require a live DB at build time. */
export function getDatabase(): Pool {
  if (globalDatabase.postgresPool) return globalDatabase.postgresPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const pool = new Pool({
    connectionString,
    enableChannelBinding: true,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", () => {
    // Never log connection strings or credentials from driver errors.
    console.error("PostgreSQL: an idle connection failed.");
  });
  globalDatabase.postgresPool = pool;
  return pool;
}
