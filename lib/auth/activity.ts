import "server-only";
import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { ensureDatabaseUser } from "./user";
import type { Session } from "./session";
import { isAdmin } from "./session";

export function sessionHash(token:string){return createHash("sha256").update(token).digest("hex");}

export async function registerLogin(session:Session,token:string){
  const id=await ensureDatabaseUser(session);
  const client=await getDatabase().connect();
  try{
    await client.query("BEGIN");
    const result=await client.query("UPDATE users SET last_login_at=now(),last_login_provider=$2,login_count=login_count+1 WHERE id=$1 AND status='active' RETURNING id",[id,session.provider]);
    if(!result.rowCount){await client.query("ROLLBACK");return false;}
    await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[id,isAdmin(session)?"admin":"user"]);
    if(session.provider==="google")await client.query(`INSERT INTO auth_accounts(user_id,provider,provider_subject) VALUES($1,'google',$2)
      ON CONFLICT(provider,provider_subject) DO NOTHING`,[id,session.sub]);
    await client.query(`INSERT INTO user_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)
      ON CONFLICT(token_hash) DO UPDATE SET last_seen_at=now(),ended_at=NULL,expires_at=EXCLUDED.expires_at`,[sessionHash(token),id,new Date(session.exp*1000)]);
    await client.query("COMMIT");return true;
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}

export async function recordPresence(session:Session,token:string){
  const id=await ensureDatabaseUser(session);
  const result=await getDatabase().query(`INSERT INTO user_sessions(token_hash,user_id,expires_at)
    SELECT $1,id,$3 FROM users WHERE id=$2 AND status='active'
    ON CONFLICT(token_hash) DO UPDATE SET last_seen_at=now()
    WHERE user_sessions.ended_at IS NULL AND user_sessions.expires_at>now()
    RETURNING user_id`,[sessionHash(token),id,new Date(session.exp*1000)]);
  return Boolean(result.rowCount);
}
