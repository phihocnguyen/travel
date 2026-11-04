import { test,expect } from "@playwright/test";

test.beforeEach(async({page})=>{await page.addInitScript(()=>{try{sessionStorage.setItem("vxdl:landing-intro:v1","seen");}catch{}});});
test("cursor attracts only buttons, never text or images, and survives map-to-blog navigation",async({page})=>{
  await page.goto("/blog");
  await expect(page.locator("html")).toHaveAttribute("data-site-page","blog");
  await page.mouse.move(80,160);
  await expect(page.locator("html")).toHaveAttribute("data-site-cursor-active","true");
  const title=page.getByRole("heading",{level:1});const before=await title.evaluate(element=>getComputedStyle(element).transform);
  await title.hover();await expect(page.locator("[data-site-cursor]")).toHaveAttribute("data-magnet","none");
  expect(await title.evaluate(element=>getComputedStyle(element).transform)).toBe(before);
  const logo=page.getByRole("link",{name:"Vị Xoài Dẫn Lối · Trang chủ",exact:true});await logo.hover();await expect(page.locator("[data-site-cursor]")).toHaveAttribute("data-magnet","none");
  const map=page.locator("[data-site-header]").getByRole("link",{name:"Explore Map",exact:true}),box=(await map.boundingBox())!;
  const x=box.x+8,y=box.y+box.height/2;await page.mouse.move(x,y);
  await expect(page.locator("[data-site-cursor]")).toHaveAttribute("data-magnet","button");
  const dot=await page.locator("[data-cursor-dot]").boundingBox();expect(Math.abs(dot!.x+dot!.width/2-x)).toBeLessThanOrEqual(5.5);
  await map.click();await expect(page).toHaveURL(/\/map$/);await page.mouse.move(120,130);
  await expect(page.locator("html")).toHaveAttribute("data-site-cursor-active","true");
  await page.goBack();await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("html")).toHaveAttribute("data-site-cursor-active","true");
  await expect(page.locator("[data-cursor-dot]")).toBeVisible();
  expect(await page.locator("html").evaluate(element=>getComputedStyle(element).overflowY)).not.toBe("hidden");
  await page.getByRole("searchbox",{name:"Tìm bài viết"}).hover();
  await expect(page.locator("html")).not.toHaveAttribute("data-site-cursor-active");
});

test("landing text and artwork do not have magnetic targets",async({page})=>{
  await page.goto("/");await expect(page.getByRole("status",{name:"Loading Mango Trails"})).toHaveCount(0);
  await expect(page.locator('h1[data-cursor-magnet],h2[data-cursor-magnet],[data-hero-float][data-cursor-magnet],[data-cursor-text]')).toHaveCount(0);
  const heading=page.locator("[data-hero-title-line]").first();await heading.hover();
  await expect(page.locator("[data-site-cursor]")).toHaveAttribute("data-magnet","none");
  const image=page.locator("[data-hero-float] img");await image.hover();
  await expect(page.locator("[data-site-cursor]")).toHaveAttribute("data-magnet","none");
});
