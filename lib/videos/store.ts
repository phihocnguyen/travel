import 'server-only';
import {getDatabase} from '@/lib/db';
import {ensureDatabaseUser} from '@/lib/auth/user';
import type {PostAuthor} from '@/lib/posts/types';
import {MAX_VIDEO_BYTES,type CommunityVideo} from './types';
export class VideoValidationError extends Error {}
export const validVideoId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export async function listVideos(subject:string,scope='approved',admin=false):Promise<CommunityVideo[]> {
 try {
 const result=await getDatabase().query(`SELECT v.id,v.title,v.description,v.status,v.review_note,v.created_at,v.is_sample,u.display_name,u.auth_subject,
 (SELECT count(*)::int FROM community_video_votes x WHERE x.video_id=v.id) votes,
 EXISTS(SELECT 1 FROM community_video_votes x JOIN users voter ON voter.id=x.user_id WHERE x.video_id=v.id AND voter.auth_subject=$1) voted
 FROM community_videos v JOIN users u ON u.id=v.author_id WHERE
 ($2='approved' AND v.status='approved') OR ($2='mine' AND u.auth_subject=$1) OR ($2='moderation' AND $3::boolean)
 ORDER BY v.created_at DESC LIMIT 100`,[subject,scope,admin]);
 return result.rows.map(r=>({id:r.id,title:r.title,description:r.description,status:r.status,reviewNote:r.review_note,createdAt:new Date(r.created_at).toISOString(),authorName:r.display_name,authorSub:r.auth_subject,votes:r.votes,voted:r.voted,isSample:Boolean(r.is_sample)}));
 } catch (error) {
  const code = (error as {code?: string}).code;
  console.error(`Video listing failed (${typeof code === 'string' && /^[A-Z0-9]{5}$/.test(code) ? code : 'UNKNOWN'}).`);
  throw error;
 }
}
export async function uploadVideo(author:PostAuthor,form:FormData){
 const title=String(form.get('title')??'').trim(),description=String(form.get('description')??'').trim(),file=form.get('video');
 if(!title||title.length>120||description.length>2000)throw new VideoValidationError('Nhập tiêu đề tối đa 120 ký tự và mô tả tối đa 2.000 ký tự.');
 if(!(file instanceof File)||!file.size||file.size>MAX_VIDEO_BYTES||!['video/mp4','video/webm'].includes(file.type))throw new VideoValidationError('Chọn video MP4 hoặc WebM, tối đa 4 MB.');
 const buffer=Buffer.from(await file.arrayBuffer());
 const mp4=buffer.length>=12&&buffer.toString('ascii',4,8)==='ftyp';
 const webm=buffer.length>=4&&buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
 if(!(file.type==='video/mp4'?mp4:webm))throw new VideoValidationError('Nội dung file không đúng định dạng video.');
 const userId=await ensureDatabaseUser(author);
 return (await getDatabase().query('INSERT INTO community_videos(author_id,title,description,content_type,video_data) VALUES ($1,$2,$3,$4,$5) RETURNING id',[userId,title,description,file.type,buffer])).rows[0].id as string;
}
export async function setVideoVote(subject:string,id:string,voted:boolean){
 if(!validVideoId(id))return null;
 const db=getDatabase(),client=await db.connect();
 try{await client.query('BEGIN');
 const video=await client.query("SELECT id FROM community_videos WHERE id=$1 AND status='approved' FOR SHARE",[id]);
 if(!video.rowCount){await client.query('ROLLBACK');return null;}
 if(voted)await client.query('INSERT INTO community_video_votes(video_id,user_id) SELECT $1,id FROM users WHERE auth_subject=$2 AND status=\'active\' ON CONFLICT DO NOTHING',[id,subject]);
 else await client.query('DELETE FROM community_video_votes x USING users u WHERE x.user_id=u.id AND x.video_id=$1 AND u.auth_subject=$2',[id,subject]);
 const result=await client.query('SELECT count(*)::int votes,EXISTS(SELECT 1 FROM community_video_votes x JOIN users u ON u.id=x.user_id WHERE x.video_id=$1 AND u.auth_subject=$2) voted FROM community_video_votes WHERE video_id=$1',[id,subject]);
 await client.query('COMMIT');return result.rows[0];
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export async function moderateVideo(subject:string,id:string,status:string,note:string){
 if(!validVideoId(id))return false;
 return (await getDatabase().query(`UPDATE community_videos SET status=$2,review_note=$3,reviewed_at=now(),reviewed_by=(SELECT id FROM users WHERE auth_subject=$4) WHERE id=$1`,[id,status,note.slice(0,2000)||null,subject])).rowCount===1;
}
