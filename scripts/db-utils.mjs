import { createRequire } from "node:module";
import pg from "pg";

const require = createRequire(import.meta.url);
export function databasePool() {
  require("@next/env").loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(process.env.DATABASE_URL);
  // Keep certificate verification explicit across pg driver upgrades.
  if (url.searchParams.get("sslmode") === "require") url.searchParams.set("sslmode", "verify-full");
  return new pg.Pool({ connectionString: url.toString(), enableChannelBinding: true, max: 2, connectionTimeoutMillis: 10000, statement_timeout: 30000 });
}

export function reportFailure(context, error) {
  // Driver errors may contain user data; only expose a diagnostic code.
  console.error(`${context} failed (${typeof error?.code === "string" ? error.code : "UNKNOWN"}).`);
  process.exitCode = 1;
}
