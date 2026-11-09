import "server-only";
import { getDatabase } from "@/lib/db";
import { ensureDatabaseUser } from "@/lib/auth/user";
import { POST_CATEGORIES,type BlogPost,type PostAuthor,type PostInput,type PostStatus,type PostSummary } from "./types";
import { sanitizePostHtml,plainToHtml,postPlainText } from "./content";
import type { PoolClient } from "pg";
import sharp from "sharp";
export class PostValidationError extends Error {}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT=`SELECT p.*,u.auth_subject,u.display_name,u.email,EXISTS(SELECT 1 FROM blog_covers c WHERE c.post_id=p.id) AS has_cover FROM blog_posts p JOIN users u ON u.id=p.author_id`;
function post(row:Record<string,unknown>):BlogPost{
  const updatedAt=new Date(row.updated_at as string).toISOString();
  return {id:String(row.id),title:String(row.title),category:row.category as BlogPost["category"],excerpt:String(row.excerpt),
    content:sanitizePostHtml(row.content_format==="html"?String(row.content):plainToHtml(String(row.content))),contentFormat:"html",
    coverImageUrl:row.has_cover?`/api/posts/${row.id}/cover?v=${encodeURIComponent(updatedAt)}`:null,status:row.status as PostStatus,
    author:{sub:String(row.auth_subject),name:String(row.display_name),email:String(row.email??"")},
    createdAt:new Date(row.created_at as string).toISOString(),updatedAt,reviewedAt:row.reviewed_at?new Date(row.reviewed_at as string).toISOString():null,reviewNote:row.review_note as string|null};
}
async function list(where="",values:unknown[]=[]):Promise<BlogPost[]>{return(await getDatabase().query(`${SELECT} ${where} ORDER BY p.created_at DESC`,values)).rows.map(post);}
export async function listAllPosts(){return list();}
export async function listPostsByAuthor(sub:string){return list("WHERE u.auth_subject=$1",[sub]);}
export async function listPostSummariesByAuthor(sub: string): Promise<PostSummary[]> {
  const result = await getDatabase().query<{id: string; title: string; status: PostStatus; updated_at: Date}>(
    "SELECT p.id,p.title,p.status,p.updated_at FROM blog_posts p JOIN users u ON u.id=p.author_id WHERE u.auth_subject=$1 ORDER BY p.created_at DESC", [sub],
  );
  return result.rows.map(row => ({id: row.id, title: row.title, status: row.status, updatedAt: new Date(row.updated_at).toISOString()}));
}
export async function listApprovedPosts(){return list("WHERE p.status='approved'");}
export async function listPendingPosts(){return list("WHERE p.status='pending'");}
export async function countPendingPosts(): Promise<number> {
  const result = await getDatabase().query("SELECT count(*)::int AS count FROM blog_posts WHERE status='pending'");
  return result.rows[0].count;
}
export async function getPost(id:string):Promise<BlogPost|null>{if(!UUID.test(id))return null;const rows=await list("WHERE p.id=$1",[id]);return rows[0]??null;}
function normalize(value:unknown){
  if(!value||typeof value!=="object")throw new PostValidationError("Dữ liệu bài viết không hợp lệ.");
  const raw=value as PostInput;
  const title=typeof raw.title==="string"?raw.title.trim().slice(0,120):"";
  if(!title)throw new PostValidationError("Nhập tiêu đề bài viết.");
  if(typeof raw.content!=="string"||raw.content.length>200000)throw new PostValidationError("Nội dung không hợp lệ hoặc quá dài (tối đa 200.000 ký tự).");
  const html=sanitizePostHtml(raw.contentFormat==="html"?raw.content:plainToHtml(raw.content));
  if(!postPlainText(html)&&!/<img\s/i.test(html))throw new PostValidationError("Nội dung bài viết đang trống.");
  return {title,category:POST_CATEGORIES.includes(raw.category)?raw.category:POST_CATEGORIES[0],excerpt:typeof raw.excerpt==="string"?raw.excerpt.trim().slice(0,320):"",content:html,raw};
}
async function attachments(client:PoolClient,id:string,userId:string,html:string,input:PostInput){
  const images=[...new Set([...html.matchAll(/\/api\/posts\/images\/([0-9a-f-]{36})/gi)].map(match=>match[1]))];
  if(images.length>50)throw new PostValidationError("Mỗi bài viết tối đa 50 ảnh.");
  if(images.length){const own=await client.query("SELECT id FROM blog_images WHERE id=ANY($1::uuid[]) AND owner_id=$2",[images,userId]);if(own.rowCount!==images.length)throw new PostValidationError("Một số ảnh không thuộc tài khoản của bạn. Hãy tải lại ảnh trong bài.");}
  await client.query("DELETE FROM blog_post_images WHERE post_id=$1",[id]);
  if(images.length)await client.query("INSERT INTO blog_post_images(post_id,image_id) SELECT $1,unnest($2::uuid[])",[id,images]);
  if(typeof input.coverImageDataUrl==="string"){
    if(input.coverImageDataUrl.length>12*1024*1024)throw new PostValidationError("Ảnh bìa vượt 8MB.");
    const match=/^data:image\/jpeg;base64,([a-z0-9+/=]+)$/i.exec(input.coverImageDataUrl);if(!match)throw new PostValidationError("Ảnh bìa phải là JPEG.");
    const buffer=Buffer.from(match[1],"base64");if(buffer.length>8*1024*1024)throw new PostValidationError("Ảnh bìa vượt 8MB.");
    try{await sharp(buffer,{limitInputPixels:40_000_000}).metadata();}catch{throw new PostValidationError("Không thể đọc ảnh bìa.");}
    await client.query("INSERT INTO blog_covers(post_id,image_data) VALUES ($1,$2) ON CONFLICT(post_id) DO UPDATE SET image_data=EXCLUDED.image_data",[id,buffer]);
  }else if(input.removeCover)await client.query("DELETE FROM blog_covers WHERE post_id=$1",[id]);
}
export async function createPost(author:PostAuthor,value:unknown):Promise<BlogPost>{
  const input=normalize(value),userId=await ensureDatabaseUser(author),client=await getDatabase().connect();let id:string;
  try{await client.query("BEGIN");id=(await client.query("INSERT INTO blog_posts(author_id,title,category,excerpt,content,content_format) VALUES ($1,$2,$3,$4,$5,'html') RETURNING id",[userId,input.title,input.category,input.excerpt,input.content])).rows[0].id;await attachments(client,id,userId,input.content,input.raw);await client.query("COMMIT");}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  return (await getPost(id!))!;
}
export async function updatePost(subject:string,id:string,value:unknown):Promise<BlogPost|null>{
  if(!UUID.test(id))return null;const input=normalize(value),client=await getDatabase().connect();
  try{await client.query("BEGIN");const row=(await client.query("SELECT p.id,p.author_id FROM blog_posts p JOIN users u ON u.id=p.author_id WHERE p.id=$1 AND u.auth_subject=$2 FOR UPDATE OF p",[id,subject])).rows[0];if(!row){await client.query("ROLLBACK");return null;}
    await client.query("UPDATE blog_posts SET title=$2,category=$3,excerpt=$4,content=$5,content_format='html',status='pending',reviewed_by=null,reviewed_at=null,review_note=null WHERE id=$1",[id,input.title,input.category,input.excerpt,input.content]);await attachments(client,id,row.author_id,input.content,input.raw);await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}return getPost(id);
}
export async function deletePost(subject:string,id:string){if(!UUID.test(id))return false;return (await getDatabase().query("DELETE FROM blog_posts p USING users u WHERE p.author_id=u.id AND u.auth_subject=$1 AND p.id=$2",[subject,id])).rowCount===1;}
export async function reviewPost(id:string,status:Extract<PostStatus,"approved"|"rejected">,note:string|null){if(!UUID.test(id))return null;await getDatabase().query("UPDATE blog_posts SET status=$2,reviewed_at=now(),review_note=$3 WHERE id=$1",[id,status,note?.slice(0,2000)??null]);return getPost(id);}
export async function readCover(id:string):Promise<Buffer|null>{if(!UUID.test(id))return null;return (await getDatabase().query("SELECT image_data FROM blog_covers WHERE post_id=$1",[id])).rows[0]?.image_data??null;}
