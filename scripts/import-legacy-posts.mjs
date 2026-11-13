import { readFile,readdir } from "node:fs/promises";
import path from "node:path";
import { databasePool,reportFailure } from "./db-utils.mjs";
import { writeImage } from "../lib/storage/disk.mjs";
const pool=databasePool();
let client;
try{
  const directory=process.env.POSTS_DATA_DIR??path.join(process.cwd(),".data","posts");
  const files=await readdir(directory).catch(error=>{if(error.code==="ENOENT")return [];throw error;});
  client=await pool.connect();await client.query("BEGIN");let imported=0;
  for(const filename of files.filter(name=>/^[0-9a-f-]{36}\.json$/i.test(name))){
    const post=JSON.parse(await readFile(path.join(directory,filename),"utf8"));
    if(!post.author?.sub||!post.id||typeof post.content!=="string")throw new Error("Invalid legacy post");
    const user=(await client.query(`INSERT INTO users(auth_subject,display_name,email) VALUES ($1,$2,$3)
      ON CONFLICT(auth_subject) DO UPDATE SET auth_subject=EXCLUDED.auth_subject RETURNING id`,[post.author.sub,post.author.name,post.author.email||null])).rows[0].id;
    const row=await client.query(`INSERT INTO blog_posts(id,author_id,title,category,excerpt,content,content_format,status,created_at,updated_at,reviewed_at,review_note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING RETURNING id`,[post.id,user,post.title,post.category,post.excerpt??"",post.content,post.contentFormat==="html"?"html":"plain",post.status,post.createdAt,post.updatedAt,post.reviewedAt??null,post.reviewNote??null]);
    if(!row.rowCount)continue;imported++;
    const cover=await readFile(path.join(directory,`${post.id}.jpg`)).catch(error=>{if(error.code==="ENOENT")return null;throw error;});
    if(cover){const filePath=await writeImage("blog-covers",cover);await client.query("INSERT INTO blog_covers(post_id,file_path) VALUES ($1,$2)",[post.id,filePath]);}
  }
  await client.query("COMMIT");console.log(`Imported ${imported} legacy posts. Existing DB posts and source files preserved.`);
}catch(error){if(client)await client.query("ROLLBACK").catch(()=>{});reportFailure("Legacy post import",error);}finally{client?.release();await pool.end();}
