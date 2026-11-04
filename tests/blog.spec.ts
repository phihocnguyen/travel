import { test,expect,type Page } from "@playwright/test";
import { createHmac,randomUUID } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";
const pool=new Pool({connectionString:process.env.DATABASE_URL,enableChannelBinding:true,max:2});
const subject=`test:blog:${randomUUID()}`;
async function readyImages(page:Page){await page.locator("img").evaluateAll(async images=>{await Promise.all(images.map(async element=>{const image=element as HTMLImageElement;image.loading="eager";await image.decode().catch(()=>{});}));});}
function session(sub=subject){const admin=sub==="bypass:local";const body=Buffer.from(JSON.stringify({sub,name:"Blog paste test",email:admin?"explorer@localhost":`${sub.replace(/:/g,"-")}@example.invalid`,provider:"credentials",exp:Math.floor(Date.now()/1000)+600})).toString("base64url");return `${body}.${createHmac("sha256",process.env.AUTH_SECRET||"dong-thap-local-development-secret").update(body).digest("base64url")}`;}
test.afterAll(async()=>{const user=(await pool.query("SELECT id FROM users WHERE auth_subject=$1",[subject])).rows[0];if(user){await pool.query("DELETE FROM blog_posts WHERE author_id=$1",[user.id]);await pool.query("DELETE FROM users WHERE id=$1",[user.id]);}await pool.end();});
test("paste formatted blog HTML, clipboard images, inline upload, save, moderate and read",async({page,context,request})=>{
  const token=session(),owner={Cookie:`dt_session=${token}`},admin={Cookie:`dt_session=${session("bypass:local")}`};
  await context.addCookies([{name:"dt_session",value:token,url:"http://localhost:3000"}]);
  await page.goto("/dashboard/posts/new");await page.locator('input[maxlength="120"]').fill("Chuyện từ vườn xoài");
  await page.locator('input[accept="image/*"]').setInputFiles("public/cao-lanh-orchard.jpg");
  const editor=page.getByRole("textbox",{name:"Nội dung bài viết",exact:true});await expect(editor).toBeVisible();await editor.click();
  const image=await sharp({create:{width:80,height:60,channels:3,background:"#77aa33"}}).png().toBuffer();
  const dataUrl=`data:image/png;base64,${image.toString("base64")}`;
  // Simulate copying a formatted selection containing a base64 image from a blog.
  await editor.evaluate((element,src)=>{const data=new DataTransfer();data.setData("text/html",`<h2>Mùa xoài Cao Lãnh</h2><p>Một <strong>câu chuyện</strong> có ảnh.</p><ul><li>Tham quan vườn</li></ul><img src="${src}" alt="Vườn xoài"><table><tr><th>Trải nghiệm</th><th>Mùa</th></tr><tr><td>Hái xoài</td><td>Mùa xoài</td></tr></table>`);element.dispatchEvent(new ClipboardEvent("paste",{clipboardData:data,bubbles:true,cancelable:true}));},dataUrl);
  await expect(editor.locator("h2")).toHaveText("Mùa xoài Cao Lãnh");await expect(editor.locator("strong")).toHaveText("câu chuyện");await expect(editor.locator("table")).toBeVisible();
  await expect(editor.locator("img")).toHaveAttribute("src",/\/api\/posts\/images\//,{timeout:30000});
  // Simulate Ctrl+V of a screenshot/file from the clipboard.
  await editor.evaluate((element,src)=>{const bytes=Uint8Array.from(atob(src.split(",")[1]),char=>char.charCodeAt(0));const data=new DataTransfer();data.items.add(new File([bytes],"clipboard.png",{type:"image/png"}));element.dispatchEvent(new ClipboardEvent("paste",{clipboardData:data,bubbles:true,cancelable:true}));},dataUrl);
  await expect(editor.locator("img")).toHaveCount(2,{timeout:30000});
  const pending=page.waitForResponse(response=>response.url().endsWith("/api/posts")&&response.request().method()==="POST");
  await page.getByRole("button",{name:"Lưu & gửi duyệt",exact:true}).click();
  const saved=await pending;expect(saved.ok(),await saved.text()).toBeTruthy();const post=(await saved.json()).post;
  expect(post.contentFormat).toBe("html");expect(post.content).toContain("<strong>");expect(post.content).not.toContain("data:image");expect(post.status).toBe("pending");
  const imageUrl=/src="([^"]*\/api\/posts\/images\/[^"]+)"/.exec(post.content)![1];
  expect((await request.get(imageUrl)).status()).toBe(404);
  const approval=await request.post(`/api/posts/${post.id}/review`,{headers:admin,data:{action:"approve"}});expect(approval.ok(),await approval.text()).toBeTruthy();
  expect((await request.get(imageUrl)).status()).toBe(200);
  await page.goto("/blog");
  await expect(page.locator('a[href="/dashboard/posts/new"]')).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Chuyện từ vườn xoài",exact:true})).toBeVisible();
  await page.getByRole("searchbox",{name:"Tìm bài viết"}).fill("chuyen tu vuon xoai");
  await page.getByRole("searchbox",{name:"Tìm bài viết"}).press("Enter");
  await expect(page).toHaveURL(/q=chuyen/);
  await expect(page.getByRole("heading",{name:"Chuyện từ vườn xoài",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Ẩm thực",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Không tìm thấy bài viết phù hợp.",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Điểm đến",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Chuyện từ vườn xoài",exact:true})).toBeVisible();
  await readyImages(page);await page.screenshot({path:"test-results/blog-list-desktop.png",fullPage:true});
  await page.goto(`/blog/${post.id}`);await expect(page.getByRole("heading",{name:"Mùa xoài Cao Lãnh"})).toBeVisible();await expect(page.locator(".blog-content img")).toHaveCount(2);await expect(page.locator(".blog-content table")).toBeVisible();
  await readyImages(page);await page.screenshot({path:"test-results/rich-blog.png",fullPage:true});
  await expect(page.locator('a[href^="#muc-"]').first()).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  for(const [path,name] of [["/blog","blog-list-mobile"],[`/blog/${post.id}`,"blog-detail-mobile"]]){
    await page.goto(path);await expect(page.locator("[data-blog-page]")).toBeVisible();
    const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));expect(width.document).toBeLessThanOrEqual(width.viewport+1);
    await readyImages(page);await page.screenshot({path:`test-results/${name}.png`,fullPage:true});
  }
  const malicious=await request.put(`/api/posts/${post.id}`,{headers:owner,data:{title:post.title,category:post.category,excerpt:"",contentFormat:"html",content:'<h2>Updated</h2><p onclick="alert(1)">Safe text</p><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"> <a href="javascript:alert(1)">Link</a>'}});expect(malicious.ok()).toBeTruthy();
  const clean=(await malicious.json()).post;expect(clean.content).not.toMatch(/script|onclick|onerror|javascript:/i);expect(clean.status).toBe("pending");
  expect((await request.get(imageUrl)).status()).toBe(404);
});

test("homepage places Blog beside Explore Map without overflowing mobile navigation",async({page})=>{
  for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:844});await page.goto("/");
    const map=page.getByRole("link",{name:"Explore Map",exact:true}),blog=page.getByRole("link",{name:"Bài viết",exact:true});
    await expect(blog).toHaveAttribute("href","/blog");
    expect(await map.evaluate(element=>element.nextElementSibling?.getAttribute("href"))).toBe("/blog");
    const box=await page.getByRole("navigation",{name:"Điều hướng chính"}).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  }
});

test("landing intro runs once per session and landing/blog share the same header",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("status",{name:"Loading Mango Trails"})).toBeVisible();
  await page.waitForFunction(()=>sessionStorage.getItem("vxdl:landing-intro:v1")==="seen");
  const landingLabels=await page.locator("[data-site-header] nav").innerText();
  await page.goto("/blog");
  await expect(page.locator("[data-site-header] nav")).toHaveText(landingLabels,{useInnerText:true});
  await expect(page.getByRole("link",{name:"Bài viết",exact:true}).first()).toHaveAttribute("href","/blog");
  await expect(page.locator('a[href="/dashboard/posts/new"]')).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("status",{name:"Loading Mango Trails"})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status",{name:"Loading Mango Trails"})).toHaveCount(0);
});
