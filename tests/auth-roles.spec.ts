import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { Pool } from "pg";

test("admin credentials and dashboard role boundaries", async ({page,request,context}) => {
  const origin="http://localhost:3000";
  expect((await request.post("/api/auth/login",{headers:{Origin:origin},data:{username:"admin",password:"wrong-password"}})).status()).toBe(401);
  expect((await request.post("/api/auth/login",{headers:{Origin:"https://example.invalid"},data:{username:"admin",password:"admin"}})).status()).toBe(403);
  await page.goto("/admin/login");
  await page.getByLabel("Tài khoản",{exact:true}).fill("admin");
  await page.getByLabel("Mật khẩu",{exact:true}).fill("admin");
  await page.getByRole("button",{name:"Đăng nhập quản trị",exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard\/admin\/overview$/);
  await expect(page.getByRole("link",{name:"Quản lý người dùng",exact:true})).toBeVisible();
  await expect(page.getByRole("link",{name:"Vé của tôi",exact:true})).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/admin\/overview$/);

  const pool=new Pool({connectionString:process.env.DATABASE_URL,enableChannelBinding:true,max:1});
  const sub=`test:roles:${randomUUID()}`;
  let id:string|undefined;
  try {
    id=(await pool.query("INSERT INTO users(auth_subject,display_name,email,avatar_url) VALUES($1,'Role test',$2,'/card.webp') RETURNING id",[sub,`${randomUUID()}@example.invalid`])).rows[0].id;
    await pool.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,'user')",[id]);
    const body=Buffer.from(JSON.stringify({sub,name:"Role test",email:"role-test@example.invalid",provider:"google",exp:Math.floor(Date.now()/1000)+600})).toString("base64url");
    const token=`${body}.${createHmac("sha256",process.env.AUTH_SECRET||"dong-thap-local-development-secret").update(body).digest("base64url")}`;
    await context.clearCookies();
    await context.addCookies([{name:"dt_session",value:token,url:origin}]);
    await page.goto("/dashboard");
    await expect(page.getByRole("link",{name:"Vé của tôi",exact:true})).toBeVisible();
    // The signed cookie has no picture: restore the avatar from the database.
    await expect(page.locator("aside").getByRole("img",{name:"Ảnh đại diện của Role test"})).toHaveAttribute("src","/card.webp");
    await page.reload();
    await expect(page.locator("aside").getByRole("img",{name:"Ảnh đại diện của Role test"})).toHaveAttribute("src","/card.webp");
    await page.goto("/dashboard/settings");
    await expect(page.locator("[data-dashboard-content]").getByRole("img",{name:"Ảnh đại diện của Role test"})).toHaveCount(1);
    expect((await page.request.post("/api/auth/presence",{headers:{Origin:origin}})).status()).toBe(204);
    expect((await pool.query("SELECT avatar_url FROM users WHERE id=$1",[id])).rows[0].avatar_url).toBe("/card.webp");
    await expect(page.getByRole("link",{name:"Quản lý người dùng",exact:true})).toHaveCount(0);
    await page.goto("/dashboard/admin/users");
    await expect(page).toHaveURL(/\/dashboard$/);
    expect((await page.request.get("/api/admin/users")).status()).toBe(403);
    await pool.query("UPDATE users SET status='disabled' WHERE id=$1",[id]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  } finally {
    if(id)await pool.query("DELETE FROM users WHERE id=$1",[id]);
    await pool.end();
  }
});
