import { test, expect } from "@playwright/test";

test("gallery changes decoded images without hover scaling or moving the frame", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("vxdl:landing-intro:v1", "seen"));
  await page.goto("/");
  const nav = page.locator("[data-gallery-nav]");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  for (let progress = .5; progress < .88; progress += .025) {
    await page.evaluate(p => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * p), progress);
    await page.waitForTimeout(1700);
    if (await nav.evaluate(el => getComputedStyle(el).pointerEvents === "auto" && Number(getComputedStyle(el).opacity) > .99)) break;
  }
  await expect(nav).toHaveCSS("pointer-events", "auto");
  const frame = page.locator("[data-arc-card]").first();
  const image = frame.locator("img");
  const before = await frame.boundingBox();
  await image.hover({ position: { x: 100, y: 100 } });
  await page.waitForTimeout(600);
  expect(await image.evaluate(el => getComputedStyle(el).transform)).toBe("none");
  const original = await image.getAttribute("src");
  await page.getByRole("button", { name: "Next gallery story", exact: true }).click();
  await expect(image).not.toHaveAttribute("src", original!);
  await expect(image).toHaveCSS("opacity", "1");
  expect(await image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const after = await frame.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 0);
  expect(after!.height).toBeCloseTo(before!.height, 0);
  await page.screenshot({ path: "test-results/gallery-slide.png" });
});
