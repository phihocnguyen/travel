import { randomBytes, scryptSync } from "node:crypto";
import { databasePool, reportFailure } from "./db-utils.mjs";
const pool = databasePool();
let client;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(726031943)");
  const existing = await client.query("SELECT 1 FROM auth_accounts WHERE provider='credentials' AND provider_subject='admin'");
  if (!existing.rowCount) {
    const salt = randomBytes(16).toString("hex");
    const hash = `scrypt:${salt}:${scryptSync(process.env.ADMIN_INITIAL_PASSWORD || "admin", salt, 64).toString("hex")}`;
    const user = await client.query("INSERT INTO users(auth_subject,display_name) VALUES('credentials:admin','Admin') RETURNING id");
    const id = user.rows[0].id;
    await client.query("INSERT INTO roles(id,name) VALUES('admin','Administrator') ON CONFLICT DO NOTHING");
    await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,'admin')", [id]);
    await client.query("INSERT INTO auth_accounts(user_id,provider,provider_subject,password_hash) VALUES($1,'credentials','admin',$2)", [id,hash]);
    console.log("Admin account created (username: admin).");
  } else console.log("Admin account already exists; password unchanged.");
  await client.query("COMMIT");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  reportFailure("Create admin", error);
} finally { client?.release(); await pool.end(); }
