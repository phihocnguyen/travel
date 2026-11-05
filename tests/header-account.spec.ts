import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("vxdl:landing-intro:v1", "seen"));
  await page.route("**/api/auth/presence", route => route.fulfill({ status: 204 }));
});

test("landing account survives reload and updates when the tab regains focus", async ({ page }) => {
  let user: { name: string; picture?: string } | null = {
    name: "Khách tham quan",
    picture: "/next.svg",
  };
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user } }));
  await page.goto("/");
  const header = page.locator("[data-site-header]");
  const account = header.getByRole("link", { name: "Tài khoản Khách tham quan" });
  await expect(account).toHaveAttribute("href", "/dashboard");
  await expect(account.getByRole("img")).toHaveAttribute("src", "/next.svg");
  await expect(header.getByRole("link", { name: "Đăng nhập", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(account).toBeVisible();
  user = null;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(header.getByRole("link", { name: "Đăng nhập", exact: true })).toBeVisible();
  await expect(account).toHaveCount(0);
});

test("signed-out landing shows the login link on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user: null } }));
  await page.goto("/");
  await expect(page.locator("[data-site-header]").getByRole("link", { name: "Đăng nhập", exact: true }))
    .toHaveAttribute("href", "/login?next=/dashboard");
});
