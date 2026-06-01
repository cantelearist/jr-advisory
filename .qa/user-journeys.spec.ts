import { expect, test } from "@playwright/test";

// ─── Journey 1: Hero loads and CTA scrolls to consultation ───────────────────
test("hero CTA scrolls to consultation form", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Protecting The Coast We Call Home",
  );

  await page.getByRole("link", { name: /Book a Confidential Inquiry/i }).first().click();
  await expect(page.locator("#consultation")).toBeInViewport();
  await expect(page.getByRole("heading", { name: /Request a confidential consultation/i })).toBeVisible();
});

// ─── Journey 2: Desktop nav links scroll to correct sections ─────────────────
test("desktop nav links reach correct sections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByRole("link", { name: "The Process" }).first().click();
  await expect(page.locator("#process")).toBeInViewport();

  await page.getByRole("link", { name: "Malibu Story" }).first().click();
  await expect(page.locator("#story")).toBeInViewport();

  await page.getByRole("link", { name: "Certifications" }).first().click();
  await expect(page.locator("#certifications")).toBeInViewport();
});

// ─── Journey 3: Consultation form — validation errors ────────────────────────
test("consultation form shows validation errors on bad input", async ({ page }) => {
  await page.goto("/#consultation", { waitUntil: "networkidle" });
  await page.locator("#consultation").scrollIntoViewIfNeeded();

  await page.getByLabel("Name").fill("J");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Primary market").fill("M");
  await page.getByLabel("Matter type").fill("R");
  await page.getByLabel("Brief context").fill("short");

  await page.getByRole("button", { name: /Submit request/i }).click();

  await expect(page.getByRole("alert")).toBeVisible();
});

// ─── Journey 4: Consultation form — successful submission ────────────────────
test("consultation form submits successfully with valid data", async ({ page }) => {
  await page.goto("/#consultation", { waitUntil: "networkidle" });
  await page.locator("#consultation").scrollIntoViewIfNeeded();

  await page.getByLabel("Name").fill("Alexandra Reed");
  await page.getByLabel("Email").fill("alex.reed@example.com");
  await page.getByLabel("Primary market").fill("Malibu");
  await page.getByLabel("Matter type").fill("Remediation oversight");
  await page.getByLabel("Brief context").fill(
    "We are dealing with post-fire remediation on our Broad Beach property and need owner-side advisory.",
  );

  await page.getByRole("button", { name: /Submit request/i }).click();

  await expect(page.getByRole("status")).toContainText(/Request received/i);
});

// ─── Journey 5: Private Office link navigates to portal ──────────────────────
test("Private Office button in desktop nav goes to portal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByRole("link", { name: /Private Office/i }).click();
  await expect(page).toHaveURL(/\/portal/);
  await expect(page.getByRole("heading", { name: /Private engagement/i })).toBeVisible();
});

// ─── Journey 6: Footer links work ────────────────────────────────────────────
test("footer links reach correct sections and portal", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);

  await page.getByRole("contentinfo").getByRole("link", { name: "The Process" }).click();
  await expect(page.locator("#process")).toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);

  await page.getByRole("contentinfo").getByRole("link", { name: "Client portal" }).click();
  await expect(page).toHaveURL(/\/portal/);
});

// ─── Journey 7: Portal preview renders key surfaces ──────────────────────────
test("portal preview page renders engagement file surfaces", async ({ page }) => {
  await page.goto("/portal", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: /Private engagement/i })).toBeVisible();
  await expect(page.getByText("Documents")).toBeVisible();
  await expect(page.getByText("Open requests")).toBeVisible();
  await expect(page.getByRole("link", { name: /public site/i })).toHaveAttribute("href", "/");
});
