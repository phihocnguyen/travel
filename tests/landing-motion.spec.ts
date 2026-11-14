import { expect, test } from "@playwright/test";

test("landing reveals text on scroll and animates magnetic buttons", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("[data-hero-title]").first()).toHaveAttribute("data-revealed", "true");
  const heading = page.locator("#story [data-split-line]").first();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute("data-revealed", "true");
  await expect(heading).toHaveCSS("opacity", "1");

  const button = page.locator("#story [data-magnetic]").first();
  await button.scrollIntoViewIfNeeded();
  await expect(button).toHaveAttribute("data-revealed", "true");
  await button.hover();
  await expect.poll(() => button.evaluate(node => getComputedStyle(node).transform)).not.toBe("none");
  await page.mouse.move(0, 0);
  await expect(button).toHaveCSS("transform", "none");
});

test("the landing motion control can disable effects explicitly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-hero-title]").first()).toHaveAttribute("data-revealed", "true");
  const motion = page.getByRole("button", { name: "Bật hiệu ứng chuyển động" });
  await expect(motion).toHaveAttribute("aria-pressed", "true");
  await motion.click();
  await expect(motion).toHaveAttribute("aria-pressed", "false");
  const heading = page.locator("#story [data-split-line]").first();
  await expect(heading).toHaveAttribute("data-revealed", "true");
  await expect(heading).toHaveCSS("opacity", "1");
  const button = page.locator("#story [data-magnetic]").first();
  await button.hover();
  await expect(button).toHaveCSS("transform", "none");
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`navigation scrolls through intermediate frames with OS motion ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(page.locator("[data-hero-title]").first()).toHaveAttribute("data-revealed", "true");
    const samples = await page.evaluate(async () => {
      const link = document.querySelector<HTMLAnchorElement>('nav a[href="#story"]')!;
      const target = document.getElementById("story")!.getBoundingClientRect().top + scrollY - 84;
      const positions: number[] = [];
      link.click();
      for (let frame = 0; frame < 15; frame++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        positions.push(scrollY);
      }
      return { positions, target };
    });
    expect(samples.positions.some(y => y > 0 && y < samples.target - 10)).toBe(true);
    expect(new Set(samples.positions).size).toBeGreaterThan(3);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(Math.round(samples.target), -1);
    await expect(page.locator("#story [data-split-line]").first()).toHaveAttribute("data-revealed", "true");
    const button = page.locator("#story [data-magnetic]").first();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toHaveAttribute("data-revealed", "true");
    await button.hover();
    await expect.poll(() => button.evaluate(node => getComputedStyle(node).transform)).not.toBe("none");
  });
}
