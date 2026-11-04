import { getSession } from "@/lib/auth/session";
import { ensureDatabaseUser } from "@/lib/auth/user";
import { getDatabase } from "@/lib/db";
import sharp from "sharp";

export async function POST(request:Request){
  const session=await getSession();if(!session)return Response.json({error:"Vui lòng đăng nhập để tải ảnh."},{status:401});
  if(Number(request.headers.get("content-length"))>10*1024*1024)return Response.json({error:"Ảnh vượt 8MB."},{status:413});
  const form=await request.formData().catch(()=>null),file=form?.get("image");
  if(!(file instanceof File)||file.size===0||file.size>8*1024*1024)return Response.json({error:"Chọn ảnh JPG, PNG hoặc WebP dưới 8MB."},{status:400});
  try{
    const source=Buffer.from(await file.arrayBuffer());
    const metadata=await sharp(source,{limitInputPixels:40_000_000}).metadata();
    if(!["jpeg","png","webp"].includes(metadata.format??""))return Response.json({error:"Định dạng ảnh chưa được hỗ trợ."},{status:400});
    const {data,info}=await sharp(source,{limitInputPixels:40_000_000}).rotate().resize(2400,2400,{fit:"inside",withoutEnlargement:true}).webp({quality:90}).toBuffer({resolveWithObject:true});
    const owner=await ensureDatabaseUser(session);
    const row=(await getDatabase().query("INSERT INTO blog_images(owner_id,image_data,content_type,width,height) VALUES ($1,$2,'image/webp',$3,$4) RETURNING id",[owner,data,info.width,info.height])).rows[0];
    return Response.json({image:{id:row.id,url:`/api/posts/images/${row.id}`,width:info.width,height:info.height}},{status:201});
  }catch{return Response.json({error:"Không thể xử lý ảnh. Hãy thử JPG, PNG hoặc WebP khác."},{status:400});}
}
