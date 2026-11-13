import { getSession,isAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { readStoredImage } from "@/lib/storage/images";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return new Response("Not found",{status:404});
  const row=(await getDatabase().query(`SELECT i.file_path,i.image_data,i.content_type,u.auth_subject,
    EXISTS(SELECT 1 FROM blog_post_images l JOIN blog_posts p ON p.id=l.post_id WHERE l.image_id=i.id AND p.status='approved') AS is_public
    FROM blog_images i JOIN users u ON u.id=i.owner_id WHERE i.id=$1`,[id])).rows[0];
  if(!row)return new Response("Not found",{status:404});
  if(!row.is_public){const session=await getSession();if(!session||(!isAdmin(session)&&session.sub!==row.auth_subject))return new Response("Not found",{status:404});}
  const data=await readStoredImage(row);
  if(!data)return new Response("Not found",{status:404});
  return new Response(new Uint8Array(data),{headers:{"Content-Type":row.content_type,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
