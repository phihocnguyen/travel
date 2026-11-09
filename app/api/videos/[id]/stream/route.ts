import {getSession,isAdmin} from '@/lib/auth/session';
import {getDatabase} from '@/lib/db';
import {validVideoId} from '@/lib/videos/store';
import {videoRange} from '@/lib/videos/range';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getSession();if(!session)return new Response(null,{status:401});const {id}=await params;if(!validVideoId(id))return new Response(null,{status:404});
 const db=getDatabase();
 const row=(await db.query(`SELECT v.content_type,v.video_url,octet_length(v.video_data) size FROM community_videos v JOIN users u ON u.id=v.author_id WHERE v.id=$1 AND (v.status='approved' OR u.auth_subject=$2 OR $3::boolean)`,[id,session.sub,isAdmin(session)])).rows[0];
 if(!row)return new Response(null,{status:404});
 if(row.video_url)return new Response(null,{status:307,headers:{Location:row.video_url,'Cache-Control':'private, no-store'}});
 const range=videoRange(request.headers.get('range'),row.size);
 if(range==='invalid')return new Response(null,{status:416,headers:{'Content-Range':`bytes */${row.size}`}});
 const start=range?.start??0,end=range?.end??row.size-1;
 const data=(await db.query(`SELECT substring(v.video_data FROM $2::int FOR $3::int) data FROM community_videos v JOIN users u ON u.id=v.author_id WHERE v.id=$1 AND (v.status='approved' OR u.auth_subject=$4 OR $5::boolean)`,[id,start+1,end-start+1,session.sub,isAdmin(session)])).rows[0];
 if(!data)return new Response(null,{status:404});
 return new Response(new Uint8Array(data.data),{status:range?206:200,headers:{'Content-Type':row.content_type,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(range?{'Content-Range':`bytes ${start}-${end}/${row.size}`}:{})}});
}
