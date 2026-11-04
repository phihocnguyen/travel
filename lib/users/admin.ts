import "server-only";
import { getDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";

const ONLINE=`EXISTS(SELECT 1 FROM user_sessions s WHERE s.user_id=u.id AND s.ended_at IS NULL AND s.expires_at>now() AND s.last_seen_at>now()-interval '2 minutes')`;
export type AdminUser={id:string;name:string;email:string|null;status:"active"|"disabled";createdAt:string;lastLoginAt:string|null;lastSeenAt:string|null;provider:string|null;loginCount:number;online:boolean;ticketCode:string|null;posts:number;protected:boolean};
export type UserList={users:AdminUser[];total:number;page:number;pageSize:number};
export type UserInsights={total:number;newToday:number;new7Days:number;new30Days:number;online:number;active7Days:number;disabled:number;withTicket:number;daily:{day:string;newUsers:number}[];updatedAt:string};

export async function listUsers(params:URLSearchParams):Promise<UserList>{
  const q=(params.get("q")??"").trim().slice(0,200),status=params.get("status")??"",period=params.get("period");
  const requested=Math.max(1,Math.trunc(Number(params.get("page"))||1)),pageSize=Math.min(50,Math.max(1,Math.trunc(Number(params.get("size"))||10)));
  const values:unknown[]=[];const filters:string[]=[];
  if(q){values.push(`%${q.replace(/[\\%_]/g,"\\$&")}%`);filters.push(`(u.display_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);}
  if(status==="active"||status==="disabled"){values.push(status);filters.push(`u.status=$${values.length}`);}
  if(status==="online")filters.push(`u.status='active' AND ${ONLINE}`);
  if(period==="today")filters.push(`u.created_at >= date_trunc('day',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'`);
  if(period==="7"||period==="30"){values.push(Number(period));filters.push(`u.created_at>=now()-make_interval(days=>$${values.length}::int)`);}
  const where=filters.length?`WHERE ${filters.join(" AND ")}`:"";
  const total=Number((await getDatabase().query(`SELECT count(*) AS total FROM users u ${where}`,values)).rows[0].total);
  const page=Math.min(requested,Math.max(1,Math.ceil(total/pageSize)));
  const result=await getDatabase().query(`SELECT u.*,EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role_id='admin') AS admin,${ONLINE} AS online,
    (SELECT max(s.last_seen_at) FROM user_sessions s WHERE s.user_id=u.id) AS last_seen_at,
    (SELECT t.ticket_code FROM tickets t WHERE t.user_id=u.id LIMIT 1) AS ticket_code,
    (SELECT count(*) FROM blog_posts p WHERE p.author_id=u.id) AS posts
    FROM users u ${where} ORDER BY u.created_at DESC,u.id LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,pageSize,(page-1)*pageSize]);
  return {total,page,pageSize,users:result.rows.map(u=>({id:u.id,name:u.display_name,email:u.email,status:u.status,createdAt:new Date(u.created_at).toISOString(),lastLoginAt:u.last_login_at?new Date(u.last_login_at).toISOString():null,lastSeenAt:u.last_seen_at?new Date(u.last_seen_at).toISOString():null,provider:u.last_login_provider,loginCount:u.login_count,online:u.status==="active"&&u.online,ticketCode:u.ticket_code,posts:Number(u.posts),protected:u.admin||isAdmin({sub:u.auth_subject,email:u.email??"",name:u.display_name,provider:"credentials",exp:0})}))};
}

export async function userInsights():Promise<UserInsights>{
  const [summary,daily]=await Promise.all([
    getDatabase().query(`SELECT count(*) AS total,
      count(*) FILTER(WHERE u.created_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh') AS new_today,
      count(*) FILTER(WHERE u.created_at>=now()-interval '7 days') AS new_7,
      count(*) FILTER(WHERE u.created_at>=now()-interval '30 days') AS new_30,
      count(*) FILTER(WHERE u.status='active' AND ${ONLINE}) AS online,
      count(*) FILTER(WHERE EXISTS(SELECT 1 FROM user_sessions s WHERE s.user_id=u.id AND s.last_seen_at>now()-interval '7 days')) AS active_7,
      count(*) FILTER(WHERE u.status='disabled') AS disabled,
      count(*) FILTER(WHERE EXISTS(SELECT 1 FROM tickets t WHERE t.user_id=u.id)) AS with_ticket FROM users u`),
    getDatabase().query(`SELECT to_char(d.day,'YYYY-MM-DD') AS day,count(u.id)::int AS new_users
      FROM generate_series((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date-13,(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,interval '1 day') AS d(day)
      LEFT JOIN users u ON (u.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date=d.day::date GROUP BY d.day ORDER BY d.day DESC`)
  ]);
  const s=summary.rows[0];return {total:Number(s.total),newToday:Number(s.new_today),new7Days:Number(s.new_7),new30Days:Number(s.new_30),online:Number(s.online),active7Days:Number(s.active_7),disabled:Number(s.disabled),withTicket:Number(s.with_ticket),daily:daily.rows.map(d=>({day:d.day,newUsers:d.new_users})),updatedAt:new Date().toISOString()};
}

export async function setUserStatus(id:string,status:"active"|"disabled",actorId:string){
  const client=await getDatabase().connect();
  try{
    await client.query("BEGIN");
    const u=(await client.query("SELECT *,EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=users.id AND r.role_id='admin') AS admin FROM users WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if(!u){await client.query("ROLLBACK");return {error:"Không tìm thấy người dùng.",status:404};}
    if(id===actorId||u.admin||isAdmin({sub:u.auth_subject,email:u.email??"",name:u.display_name,provider:"credentials",exp:0})){
      await client.query("ROLLBACK");return {error:"Không thể khóa tài khoản quản trị.",status:409};
    }
    await client.query("UPDATE users SET status=$2 WHERE id=$1",[id,status]);
    if(status==="disabled")await client.query("UPDATE user_sessions SET ended_at=coalesce(ended_at,now()) WHERE user_id=$1",[id]);
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,changes) VALUES($1,'user.status','user',$2,$3)",[actorId,id,JSON.stringify({from:u.status,to:status})]);
    await client.query("COMMIT");return {ok:true};
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
