import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.TOKEA_TEST_URL ?? "http://127.0.0.1:4173";
async function waitForServer() {
  for (let n = 0; n < 90; n++) {
    try {
      const response = await fetch(base);
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw new Error("Vite preview did not start within 54 seconds.");
}
await waitForServer();
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

async function visit(path, title) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: title, exact: true }).waitFor({ state: "visible", timeout: 15000 });
}
async function noOverflow(path, title, width) {
  await page.setViewportSize({ width, height: 844 });
  await visit(path, title);
  const measure = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(measure.scrollWidth <= measure.clientWidth + 1,
    `${path} at ${width}px overflows: ${measure.scrollWidth}px vs ${measure.clientWidth}px`);
}
try {
  await visit("/", "Find your people. Share a drink.");
} catch {
  // The intro uses a multi-line serif heading, so use the stable intro button instead.
  await page.getByRole("button", { name: "Skip sign-in — Enter demo" }).waitFor({ timeout: 15000 });
}
try {
  await page.getByRole("button", { name: "Skip sign-in — Enter demo" }).click();
  await page.getByRole("heading", { name: "A little about you" }).waitFor();
  await page.locator('button[role="checkbox"]').nth(0).click();
  await page.locator('button[role="checkbox"]').nth(1).click();
  await page.getByRole("button", { name: "Enter demo", exact: true }).click();
  await page.getByRole("heading", { name: "Who's out nearby?" }).waitFor();
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/discover-mobile.png", fullPage: true });

  const cards = page.locator('[data-testid="discover-card-list"] [data-testid="session-card"]');
  assert.ok(await cards.count() >= 5, "Seeded Discover cards should be visible");
  const cardLayout = await cards.evaluateAll((items) => items.map((el) => {
    const rect = el.getBoundingClientRect();
    const banner = el.querySelector('[data-testid="drink-banner"]');
    return {
      category: el.getAttribute("data-category"),
      banner: banner?.getAttribute("data-drink"),
      left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom,
    };
  }));
  for (let i = 0; i < cardLayout.length; i++) {
    assert.equal(cardLayout[i].banner, cardLayout[i].category, "Banner should match host-selected drink");
    if (i > 0) {
      assert.ok(Math.abs(cardLayout[i].top - cardLayout[i - 1].bottom - 16) <= 1,
        "Every Discover card must have exactly 16px vertical spacing");
      assert.ok(Math.abs(cardLayout[i].width - cardLayout[i - 1].width) <= 1,
        "Every Discover card must have the same width");
    }
  }
  assert.ok(new Set(cardLayout.map((card) => card.category)).size >= 4,
    "Distinct categories should produce category-specific banners");

  const tabs = [
    { path: "/requests", title: "Requests" },
    { path: "/chats", title: "Chats" },
    { path: "/profile", title: "Profile" },
  ];
  for (const tab of tabs) {
    const nav = page.locator(`nav[aria-label="Main"] a[href="${tab.path}"]`);
    await nav.click();
    await page.getByRole("heading", { name: tab.title, exact: true }).waitFor();
  }
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByRole("textbox", { name: "First name" }).fill("Taylor");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("heading", { name: "Taylor" }).waitFor();
  // Use a genuine screenshot PNG as a fixture; photo processing should center-crop,
  // compress, and persist it in local browser state without a network upload.
  const testImage = await page.screenshot();
  await page.locator('input[aria-label="Upload profile picture"]').setInputFiles({
    name: "sample-photo.png", mimeType: "image/png", buffer: Buffer.from(testImage),
  });
  await page.getByRole("button", { name: "Change photo" }).waitFor();
  const photo = page.locator("section").first().locator("img");
  await photo.waitFor();
  assert.ok((await photo.getAttribute("src"))?.startsWith("data:image/jpeg;base64,"),
    "Profile photo should be compressed and saved as a local JPEG");
  await page.reload();
  await page.getByRole("heading", { name: "Taylor" }).waitFor();
  await page.locator("section").first().locator("img").waitFor();


  await visit("/chats", "Chats");
  await page.locator('a[href="/chats/s2"]').click();
  const msg = "Hello from the automated Tokea browser check";
  await page.getByRole("textbox", { name: "Message" }).fill(msg);
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText(msg, { exact: true }).waitFor();

  for (const width of [320, 390, 448, 768]) {
    await noOverflow("/", "Who's out nearby?", width);
    await noOverflow("/requests", "Requests", width);
    await noOverflow("/chats", "Chats", width);
    await noOverflow("/profile", "Profile", width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/", "Who's out nearby?");
  await page.locator('a[aria-label="Host a drink"]').click();
  await page.getByRole("heading", { name: "Host a drink", exact: true }).waitFor();
  await page.getByRole("button", { name: "Coffee", exact: true }).click();
  await page.getByPlaceholder("e.g. Low-key after-work chat, happy to meet new people.").fill(
    "Easy morning coffee and conversations with new friends."
  );
  await page.getByRole("button", { name: "Publish session" }).click();
  await page.getByRole("heading", { name: "Your session", exact: true }).waitFor();
  await visit("/", "Who's out nearby?");
  const newest = page.locator('[data-testid="session-card"]').first();
  assert.equal(await newest.getAttribute("data-category"), "Coffee");
  assert.equal(await newest.locator('[data-testid="drink-banner"]').getAttribute("data-drink"), "Coffee");
  await page.screenshot({ path: "artifacts/discover-with-drink-banners.png", fullPage: true });


  assert.deepEqual(pageErrors, [], `Unhandled client errors: ${pageErrors.join("; ")}`);
  console.log("Browser smoke PASS: onboarding, tabs, chat, profile photo upload/persistence, hosting, category banners, 16px card gaps and 320/390/448/768px overflow checks.");
} finally {
  await browser.close();
}
