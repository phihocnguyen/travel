import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { getDatabase } from "@/lib/db";

export async function authenticateAdmin(username: string, password: string) {
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const account = (await client.query(`SELECT a.*, u.auth_subject, u.display_name, u.email, u.status,
      EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_id='admin') AS admin
      FROM auth_accounts a JOIN users u ON u.id=a.user_id
      WHERE a.provider='credentials' AND a.provider_subject=$1 FOR UPDATE OF a`, [username])).rows[0];
    const [scheme, salt, digest] = (account?.password_hash ?? "scrypt:invalid:" + "00".repeat(64)).split(":");
    const actual = scryptSync(password, salt, 64), expected = Buffer.from(digest, "hex");
    const valid = scheme === "scrypt" && actual.length === expected.length && timingSafeEqual(actual, expected);
    if (!account || (account.locked_until && new Date(account.locked_until).getTime() > Date.now())) {
      await client.query("COMMIT"); return null;
    }
    if (!valid || account.status !== "active" || !account.admin) {
      await client.query(`UPDATE auth_accounts SET failed_attempts=CASE WHEN locked_until<=now() THEN 1 ELSE failed_attempts+1 END,
        locked_until=CASE WHEN (locked_until IS NULL OR locked_until>now()) AND failed_attempts>=4 THEN now()+interval '15 minutes' WHEN locked_until<=now() THEN NULL ELSE locked_until END WHERE id=$1`, [account.id]);
      await client.query("COMMIT"); return null;
    }
    await client.query("UPDATE auth_accounts SET failed_attempts=0,locked_until=NULL WHERE id=$1", [account.id]);
    await client.query("COMMIT");
    return {sub:account.auth_subject as string,name:account.display_name as string,email:(account.email ?? "") as string,provider:"credentials" as const,role:"admin" as const};
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
