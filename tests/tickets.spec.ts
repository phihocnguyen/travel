import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";

const pool = new Pool({connectionString:process.env.DATABASE_URL,enableChannelBinding:true,max:2});
const run = randomUUID();
const subjects = [`test:${run}:owner`,`test:${run}:other`];
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
let baseline=0;
function cookie(sub:string,admin=false){
  const body=Buffer.from(JSON.stringify({sub:admin?"bypass:local":sub,name:"Ticket workflow test",email:admin?"explorer@localhost":`${sub.replace(/:/g,"-")}@example.invalid`,provider:"credentials",exp:Math.floor(Date.now()/1000)+600})).toString("base64url");
  return `dt_session=${body}.${createHmac("sha256",process.env.AUTH_SECRET||"dong-thap-local-development-secret").update(body).digest("base64url")}`;
}
test.beforeAll(async()=>{baseline=(await pool.query("SELECT next_number FROM ticket_code_counter")).rows[0].next_number;});
test.afterAll(async()=>{
  const client=await pool.connect();
  try{
    await client.query("BEGIN");await client.query("SELECT * FROM ticket_code_counter FOR UPDATE");
    const ids=(await client.query("SELECT t.id FROM tickets t JOIN users u ON u.id=t.user_id WHERE u.auth_subject=ANY($1::text[])",[subjects])).rows.map(r=>r.id);
    if(ids.length){
      await client.query("DELETE FROM audit_logs WHERE entity_type='ticket' AND entity_id=ANY($1::text[])",[ids]);
      await client.query("DELETE FROM ticket_collections WHERE ticket_id=ANY($1::uuid[])",[ids]);
      await client.query("DELETE FROM ticket_print_jobs WHERE ticket_id=ANY($1::uuid[])",[ids]);
      await client.query("DELETE FROM tickets WHERE id=ANY($1::uuid[])",[ids]);
    }
    await client.query("DELETE FROM users WHERE auth_subject=ANY($1::text[])",[subjects]);
    await client.query("UPDATE ticket_code_counter SET next_number=GREATEST($1,coalesce((SELECT max(substring(ticket_code from 5)::int)+1 FROM tickets),0))",[baseline]);
    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();await pool.end();}
});

test("one ticket per user, editable image, protected admin lookup, exact print output and duplicate handover prevention",async({request,page,context})=>{
  const owner={Cookie:cookie(subjects[0])}, other={Cookie:cookie(subjects[1])}, admin={Cookie:cookie("",true)};
  const payload={title:"Vé hẹn chu du kiểm thử",from:"Cao Lãnh",to:"Khách tham quan",message:"Lời nhắn tiếng Việt",layout:"left",theme:{background:"#ffffff",ink:"#234531",accent:"#777777"},stickers:[{id:"mango-test",emoji:"🥭",x:60,y:40,size:8,rotation:0}],image:{scale:0.7,x:12,y:-8},imageDataUrl:png};
  expect((await request.get("/api/admin/tickets")).status()).toBe(401);
  expect((await request.get("/api/admin/tickets",{headers:owner})).status()).toBe(403);
  const created=await request.post("/api/tickets",{headers:owner,data:payload});expect(created.ok(),await created.text()).toBeTruthy();
  let ticket=(await created.json()).ticket;
  expect(ticket.code).toMatch(/^VXDL\d{3}$/);
  const originalId=ticket.id, originalCode=ticket.code;
  const repeats=await Promise.all([1,2].map(()=>request.post("/api/tickets",{headers:owner,data:{...payload,title:"Should not overwrite"}})));
  for(const response of repeats){expect(response.ok()).toBeTruthy();const t=(await response.json()).ticket;expect(t.id).toBe(originalId);expect(t.title).toBe(payload.title);}
  const second=await request.post("/api/tickets",{headers:other,data:payload});expect(second.ok()).toBeTruthy();
  const otherTicket=(await second.json()).ticket;expect(otherTicket.code).not.toBe(originalCode);
  expect((await request.get(`/api/tickets/${ticket.id}`,{headers:other})).status()).toBe(404);
  expect((await request.get(`/api/tickets/${ticket.id}/image`,{headers:other})).status()).toBe(404);
  expect((await request.get(`/api/tickets/${ticket.id}/image`,{headers:owner})).status()).toBe(200);
  const stale=await request.put(`/api/tickets/${ticket.id}`,{headers:owner,data:{...payload,expectedUpdatedAt:"2000-01-01T00:00:00.000Z"}});expect(stale.status()).toBe(400);
  const updated=await request.put(`/api/tickets/${ticket.id}`,{headers:owner,data:{...payload,title:"Vé đã chỉnh sửa",image:{scale:0.9,x:20,y:5},expectedUpdatedAt:ticket.updatedAt}});expect(updated.ok(),await updated.text()).toBeTruthy();ticket=(await updated.json()).ticket;
  expect(ticket.code).toBe(originalCode);expect(ticket.image.scale).toBe(0.9);
  expect((await request.get("/api/admin/tickets?code=VXDL1000",{headers:admin})).status()).toBe(400);
  const lookup=await request.get(`/api/admin/tickets?code=${originalCode}`,{headers:admin});expect(lookup.ok()).toBeTruthy();expect((await lookup.json()).tickets).toHaveLength(1);
  // Exercise the actual browser renderer and PNG export used by operators.
  const signed=admin.Cookie.slice("dt_session=".length);
  await context.addCookies([{name:"dt_session",value:signed,url:"http://localhost:3000"}]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading",{name:"Tổng quan",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Vé của tôi",exact:true})).toBeVisible();
  await expect(page.getByText("Vé đã tạo",{exact:true})).toHaveCount(0);
  await page.goto("/dashboard/admin/overview");
  await expect(page.getByRole("table")).toBeVisible();
  await page.goto("/dashboard/admin/tickets");
  await page.getByRole("textbox",{name:"Mã vé",exact:true}).fill(originalCode);
  await page.getByRole("button",{name:"Kiểm tra ID"}).click();
  await page.getByRole("button",{name:`Xem vé ${originalCode}`,exact:true}).click();
  await expect(page.getByRole("heading",{name:originalCode,exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Chuẩn bị file in"}).click();
  await expect(page.getByRole("link",{name:"Mở trang in / tải PNG ↗"})).toBeVisible({timeout:60000});
  const output=await request.get(`/api/admin/tickets/${ticket.id}/output`,{headers:admin});expect(output.ok()).toBeTruthy();expect((await output.body()).length).toBeGreaterThan(1000);
  await page.screenshot({path:"test-results/admin-ticket.png",fullPage:true});
  const locked=await request.put(`/api/tickets/${ticket.id}`,{headers:owner,data:{...payload,expectedUpdatedAt:ticket.updatedAt}});expect(locked.status()).toBe(400);
  await page.goto(`/print/tickets/${ticket.id}`);await expect(page.getByRole("button",{name:"In vé màu",exact:true})).toBeEnabled();
  await page.screenshot({path:"test-results/print-ticket.png",fullPage:true});
  expect((await request.post(`/api/admin/tickets/${ticket.id}`,{headers:admin,data:{action:"printed"}})).ok()).toBeTruthy();
  expect((await request.post(`/api/admin/tickets/${ticket.id}`,{headers:admin,data:{action:"collect"}})).ok()).toBeTruthy();
  expect((await request.post(`/api/admin/tickets/${ticket.id}`,{headers:admin,data:{action:"collect"}})).status()).toBe(409);
  // A cancelled print allows further editing.
  const printImage="data:image/png;base64,"+(await sharp({create:{width:1417,height:827,channels:3,background:"white"}}).png().toBuffer()).toString("base64");
  expect((await request.post(`/api/admin/tickets/${otherTicket.id}`,{headers:admin,data:{action:"start",image:printImage,expectedUpdatedAt:otherTicket.updatedAt}})).ok()).toBeTruthy();
  expect((await request.post(`/api/admin/tickets/${otherTicket.id}`,{headers:admin,data:{action:"cancel"}})).ok()).toBeTruthy();
  expect((await request.put(`/api/tickets/${otherTicket.id}`,{headers:other,data:{...payload,expectedUpdatedAt:otherTicket.updatedAt}})).ok()).toBeTruthy();
  // User pages fit the viewport; mobile switches between editing and preview.
  await context.addCookies([{name:"dt_session",value:other.Cookie.slice("dt_session=".length),url:"http://localhost:3000"}]);
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const path of ["/dashboard","/dashboard/tickets",`/dashboard/tickets/${otherTicket.id}`,"/dashboard/posts","/dashboard/posts/new","/dashboard/settings"]){
      await page.goto(path);await expect(page.locator("[data-dashboard-shell]")).toBeVisible();
      const overflow=await page.evaluate(()=>({height:document.documentElement.scrollHeight,view:window.innerHeight,width:document.documentElement.scrollWidth,viewWidth:window.innerWidth}));
      expect(overflow.height,path).toBeLessThanOrEqual(overflow.view+1);expect(overflow.width,path).toBeLessThanOrEqual(overflow.viewWidth+1);
    }
    await page.goto(`/dashboard/tickets/${otherTicket.id}`);
    if(viewport.width<1024)await page.getByRole("button",{name:"Xem trước & kéo ảnh"}).click();
    const ticketPreview=page.locator("[data-ticket-preview]");await expect(ticketPreview).toBeVisible();
    const bounds=await ticketPreview.boundingBox();expect(bounds!.width).toBeGreaterThan(100);expect(bounds!.height).toBeGreaterThan(50);
    await page.screenshot({path:`test-results/user-ticket-${viewport.width}.png`,fullPage:true});
  }
});
