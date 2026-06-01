import { expect, test } from "@playwright/test";

test("mobile navigation opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Founders" })).toBeVisible();

  await page.getByRole("link", { name: "Founders" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#founders")).toBeInViewport();
});

