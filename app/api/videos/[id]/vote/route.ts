import {getSession} from '@/lib/auth/session';
import {ensureDatabaseUser} from '@/lib/auth/user';
import {setVideoVote} from '@/lib/videos/store';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){const session=await getSession();if(!session)return Response.json({error:'Unauthorized'},{status:401});const body=await request.json().catch(()=>null);if(typeof body?.voted!=='boolean')return Response.json({error:'Lựa chọn vote không hợp lệ.'},{status:400});await ensureDatabaseUser(session);const result=await setVideoVote(session.sub,(await params).id,body.voted);return result?Response.json(result):Response.json({error:'Video chưa được duyệt hoặc không tồn tại.'},{status:404});}
