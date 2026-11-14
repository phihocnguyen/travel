import { expect, test, type Page } from "@playwright/test";
import { EMPTY_STORY, STORY_SAVE_KEY, parseStorySave } from "../components/explore/story";
import { STOPS, XEO_QUYT_RIVER } from "../components/explore/world";
import { checkpointGuidance, isInteriorBlocked, isWorldBlocked } from "../components/explore/navigation";

async function startAt(page: Page, scene: string | null, x: number, y: number) {
  await page.addInitScript(({ key, story, location }) => {
    if (!sessionStorage.getItem("navigation-fixture")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, story, location, visited: [], activities: {}, mangoes: [], quizzes: {} }));
      sessionStorage.setItem("navigation-fixture", "true");
    }
  }, { key: STORY_SAVE_KEY, story: { ...EMPTY_STORY, started: true }, location: { scene, x, y, dir: 0, boatSide: "east" } });
  await page.goto("/explore");
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(page.locator(".ex-page")).toHaveAttribute("data-intro", "false");
}

test("landmarks block movement but their entrances and interactions remain reachable", () => {
  for (const stop of STOPS) {
    expect(isWorldBlocked(stop.x, stop.y)).toBe(true);
    expect(isWorldBlocked(stop.x, stop.y + 65)).toBe(false);
    expect(isInteriorBlocked(stop, 235, 250)).toBe(true);
    expect(isInteriorBlocked(stop, 235, 290)).toBe(false);
    expect(isInteriorBlocked(stop, 480, 540)).toBe(false);
  }
  const xeoQuyt = STOPS.find(stop => stop.id === "xeo-quyt")!;
  expect(checkpointGuidance(xeoQuyt, "boat", null, {x:770,y:540})).toMatchObject(XEO_QUYT_RIVER.eastDock);
  expect(parseStorySave({version:1,story:EMPTY_STORY,location:{scene:"invalid",x:50,y:50,dir:0,boatSide:"east"}})?.location).toBeUndefined();
});

test("checkpoint marks the map without moving, resume and reload keep the same position", async ({ page }) => {
  await startAt(page, null, 820, 580);
  const game = page.locator(".ex-page");
  await expect(game).toHaveAttribute("data-player-x", "820");
  await expect(game).toHaveAttribute("data-player-y", "580");
  await page.getByRole("button", { name: "Đến checkpoint", exact: true }).click();
  await expect(page.locator(".ex-miniMap .ex-target")).toHaveCount(1);
  await expect(page.locator(".ex-waypoint")).toBeVisible();
  await expect(page.locator(".ex-mapArrow")).toBeVisible();
  await expect(game).toHaveAttribute("data-scene", "world");
  await expect(game).toHaveAttribute("data-player-x", "820");
  await page.getByRole("button", { name: "Menu", exact: false }).click();
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(game).toHaveAttribute("data-scene", "world");
  await expect(game).toHaveAttribute("data-player-x", "820");
  await expect(game).toHaveAttribute("data-player-y", "580");
  const button = page.getByRole("button", { name: "Nhiệm vụ", exact: true });
  const centers = await button.evaluate(node => {
    const button = node.getBoundingClientRect(), icon = node.querySelector("svg")!.getBoundingClientRect();
    return { x: Math.abs(button.x+button.width/2-icon.x-icon.width/2), y: Math.abs(button.y+button.height/2-icon.y-icon.height/2) };
  });
  expect(centers.x).toBeLessThan(1);
  expect(centers.y).toBeLessThan(1);
  await expect(page.locator(".ex-stage>canvas")).toHaveCSS("opacity", "1");
  await page.screenshot({path:"test-results/explore-waypoint.png"});
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(game).toHaveAttribute("data-player-x", "820");
  await expect(game).toHaveAttribute("data-player-y", "580");
});

test("walking cannot pass through a landmark, but E still enters it", async ({ page }) => {
  await page.clock.install();
  await startAt(page, null, 745, 970);
  await page.keyboard.down("KeyW");
  await page.clock.runFor(1500);
  await page.keyboard.up("KeyW");
  await page.clock.runFor(150);
  const y = Number(await page.locator(".ex-page").getAttribute("data-player-y"));
  expect(y).toBeGreaterThanOrEqual(896);
  expect(y).toBeLessThan(910);
  await page.keyboard.press("KeyE");
  await expect(page.locator(".ex-page")).toHaveAttribute("data-scene", "vuon-xoai");
});

test("interior quest guidance never moves the player and menu resumes inside", async ({ page }) => {
  await startAt(page, "vuon-xoai", 480, 540);
  await page.getByRole("button", { name: "Nhiệm vụ", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục checkpoint 1" }).click();
  await expect(page.locator(".ex-waypoint")).toBeVisible();
  await expect(page.locator(".ex-routeGuide")).toContainText("Chú làm vườn");
  await expect(page.locator(".ex-page")).toHaveAttribute("data-player-x", "480");
  await expect(page.locator(".ex-page")).toHaveAttribute("data-player-y", "540");
  await page.getByRole("button", { name: "Menu", exact: false }).click();
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(page.locator(".ex-page")).toHaveAttribute("data-scene", "vuon-xoai");
  await expect(page.locator(".ex-page")).toHaveAttribute("data-player-x", "480");
});
