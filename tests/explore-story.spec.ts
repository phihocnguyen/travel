import { test, expect, type Page } from "@playwright/test";
import { CHECKPOINTS, EMPTY_STORY, STORY_SAVE_KEY, currentChapter, parseStorySave, storyCheckpoints, type Story } from "../components/explore/story";
import { foliageOverlapsWater, INTERIOR, WORLD_PONDS } from "../components/explore/world";

async function resumeAt(page: Page, story: Partial<Story>, activities: Record<string, number> = {}) {
  const scene=currentChapter({...EMPTY_STORY,started:true,...story}).stop;
  await page.addInitScript(({ key, story, activities, scene, entry }) => {
    if (!sessionStorage.getItem("explore-test-seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, story, activities, mangoes: story.harvested ? [0, 1, 2] : [], visited: [], quizzes: {}, location:{scene,...entry,dir:0,boatSide:"east"} }));
      sessionStorage.setItem("explore-test-seeded", "true");
    }
  }, { key: STORY_SAVE_KEY, story: { ...EMPTY_STORY, started: true, ...story }, activities, scene, entry:INTERIOR.entry });
  await page.goto("/explore");
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
}

async function openActivity(page: Page, title: string) {
  await page.locator(".ex-activityJump").filter({ hasText: title }).click();
  await expect(page.locator("button.ex-interact")).toContainText(/0\/3|0\/1|2\/3/);
  await page.locator("button.ex-interact").click();
}

test("checkpoint order, save migration and terrain clearance", () => {
  let story = { ...EMPTY_STORY };
  for (const checkpoint of CHECKPOINTS) {
    expect(currentChapter(story).id).toBe(checkpoint.id);
    story = { ...story, [checkpoint.key]: true };
  }
  expect(currentChapter(story).id).toBe("complete");
  const saved = parseStorySave({ version: 1, story, activities: { "gao-giong": 0 }, mangoes: [], visited: 123 });
  expect(saved?.story.fished).toBe(true); // Replaying never revokes a checkpoint.
  expect(storyCheckpoints(saved!.story, saved!.activities).every(item => item.done)).toBe(true);
  expect(parseStorySave({ version: 1, story: {}, activities: { "gao-giong": 3 } })?.story.fished).toBe(true);
  for (const pond of WORLD_PONDS) {
    expect(foliageOverlapsWater(pond.x + pond.width / 2, pond.y + pond.height / 2)).toBe(true);
    expect(foliageOverlapsWater(pond.x + pond.width + 20, pond.y + 100)).toBe(true);
  }
  expect(foliageOverlapsWater(550, 1000)).toBe(true);
  expect(foliageOverlapsWater(800, 1200)).toBe(false);
});

test("intro exists before hydration, starts black and never flashes the map", async ({ page, request }) => {
  const html = await (await request.get("/explore")).text();
  expect(html).toContain('class="ex-introFade"');
  expect(html).toContain('data-intro="true"');
  await page.route(/\/_next\/.*\.js(?:\?|$)/, route => route.abort());
  await page.goto("/explore", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".ex-introFade")).toHaveCSS("opacity", "1");
  await expect(page.locator(".ex-stage canvas")).toHaveCSS("visibility", "hidden");
});

test("fish catches show SVG species, persist and finish the story", async ({ page }) => {
  await resumeAt(page, { metFarmer: true, harvested: true, preparedLotus: true, wrapped: true, boated: true });
  await openActivity(page, "Câu cá ao quê");
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  for (const name of ["Cá rô đồng", "Cá trê", "Cá lóc"]) {
    await page.getByRole("button", { name: "Thả câu", exact: true }).click();
    await page.clock.runFor(3500);
    await page.getByRole("button", { name: "Giật cần!", exact: true }).click();
    await page.clock.runFor(650);
    await page.getByRole("button", { name: "Kéo lên", exact: true }).click();
    await expect(page.locator(".mg-catchResult").getByRole("img", { name, exact: true })).toBeVisible();
    await expect(page.locator(".mg-catchResult>strong")).toHaveText(name);
    if (name !== "Cá lóc") await page.getByRole("button", { name: "Tiếp tục câu" }).click();
  }
  await expect(page.locator(".mg-fishCollection svg")).toHaveCount(3);
  await page.screenshot({ path: "test-results/explore-fish.png" });
  await page.getByRole("button", { name: "Câu lại", exact: true }).click();
  await page.clock.runFor(500);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).story.fished, STORY_SAVE_KEY)).toBe(true);
  await page.getByRole("button", { name: "Về bờ", exact: true }).click();
  await page.clock.resume();
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await page.getByRole("button", { name: "Nhiệm vụ" }).click();
  await expect(page.locator(".ex-questLog .is-done")).toHaveCount(6);
  await page.getByRole("button", { name: "Tiếp tục checkpoint 7" }).click();
  await expect(page.locator(".ex-page")).toHaveAttribute("data-scene", "gao-giong");
  await expect(page.locator(".ex-routeGuide")).toContainText("Ra bản đồ");
  // Load a saved arrival at the market; checkpoint buttons only guide now.
  await page.addInitScript(key=>{
    const saved=JSON.parse(localStorage.getItem(key)!);
    saved.location={scene:"cho-que",x:300,y:500,dir:0,boatSide:"east"};
    localStorage.setItem(key,JSON.stringify(saved));
  },STORY_SAVE_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(page.locator("button.ex-interact")).toContainText("Dì bán bánh");
  await page.locator("button.ex-interact").click();
  await page.getByRole("button", { name: "Nghe tiếp" }).click();
  await page.getByRole("button", { name: "Nghe tiếp" }).click();
  await page.getByRole("button", { name: "Hẹn gặp lại, Cao Lãnh" }).click();
  await expect(page.locator(".ex-storyEnding")).toBeVisible();
});

test("boat contact removes one life per obstacle, loses, and resets on retry", async ({ page }) => {
  await resumeAt(page, { metFarmer: true, harvested: true, preparedLotus: true, wrapped: true });
  await openActivity(page, "Chèo xuồng ba lá");
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.getByRole("button", { name: "Bắt đầu chèo", exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.locator('[aria-label="Còn 2 lượt va chạm"]')).toBeVisible();
  await expect(page.locator(".mg-feedback")).toContainText("Va vào nhánh cây!");
  await page.clock.runFor(500);
  await expect(page.locator('[aria-label="Còn 2 lượt va chạm"]')).toBeVisible();
  await page.clock.runFor(17000);
  await expect(page.locator(".mg-courseOverlay>strong")).toHaveText("Thử một chuyến nữa nhé");
  await expect(page.locator('[aria-label="Còn 0 lượt va chạm"]')).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).story.boated, STORY_SAVE_KEY)).toBe(false);
  await page.getByRole("button", { name: "Chèo lại", exact: true }).click();
  await expect(page.locator('[aria-label="Còn 3 lượt va chạm"]')).toBeVisible();
  await expect(page.locator('[data-hit="true"]')).toHaveCount(0);
  // Remain in the right lane, then move left after the last left-lane obstacle.
  await page.getByRole("button", { name: "Sang phải" }).click();
  await expect.poll(()=>page.locator(".mg-playerBoat").evaluate(node=>{
    const box=node.getBoundingClientRect(),river=node.parentElement!.getBoundingClientRect();
    return Math.abs(box.x+box.width/2-river.x-river.width*.75);
  })).toBeLessThan(2);
  await page.clock.runFor(20500);
  await expect(page.locator('[aria-label="Còn 1 lượt va chạm"]')).toBeVisible();
  await page.getByRole("button", { name: "Sang trái" }).click();
  await expect.poll(()=>page.locator(".mg-playerBoat").evaluate(node=>{
    const box=node.getBoundingClientRect(),river=node.parentElement!.getBoundingClientRect();
    return Math.abs(box.x+box.width/2-river.x-river.width*.5);
  })).toBeLessThan(2);
  await page.clock.runFor(5000);
  await expect(page.locator(".mg-courseOverlay>strong")).toHaveText("Cập bến bình yên!");
  await page.clock.runFor(500);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).story.boated, STORY_SAVE_KEY)).toBe(true);
});

test("landing sections reveal once and reduced motion reveals all content", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("[data-hero-title]").first();
  await expect(hero).toHaveAttribute("data-revealed", "true");
  await expect(hero).toHaveCSS("opacity", "1");
  for (const id of ["story", "destinations", "photos", "cta"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    const title = page.locator(id === "photos" ? ".photo-library-heading>div" : `#${id} [data-split-line]`).first();
    await title.scrollIntoViewIfNeeded();
    await expect(title).toHaveAttribute("data-revealed", "true");
    await expect(title).toHaveCSS("opacity", "1");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button",{name:"Bật hiệu ứng chuyển động"}).click();
  await expect(page.locator("[data-library-photo]").last()).toHaveCSS("opacity", "1");
  await page.locator("#hero").scrollIntoViewIfNeeded();
  await expect(hero).toHaveCSS("opacity", "1");
});
