import "server-only";
import { getDatabase } from "@/lib/db";
import { isAdmin, type Session } from "./session";

export async function ensureDatabaseUser(session: Pick<Session,"sub"|"name"|"email"> & {picture?:string}): Promise<string> {
  const result = await getDatabase().query<{ id: string }>(`INSERT INTO users(auth_subject,display_name,email,avatar_url)
    VALUES ($1,$2,$3,$4) ON CONFLICT (auth_subject) DO UPDATE
    SET display_name=EXCLUDED.display_name, avatar_url=EXCLUDED.avatar_url
    RETURNING id`, [session.sub,session.name,session.email || null,session.picture ?? null]);
  return result.rows[0].id;
}

export async function canManageTickets(session: Session | null): Promise<boolean> {
  if (!session) return false;
  if (isAdmin(session)) return true;
  const result = await getDatabase().query(`SELECT 1 FROM users u JOIN user_roles r ON r.user_id=u.id
    JOIN role_permissions p ON p.role_id=r.role_id WHERE u.auth_subject=$1 AND u.status='active'
    AND p.permission_id='tickets.manage' LIMIT 1`, [session.sub]);
  return result.rowCount === 1;
}
