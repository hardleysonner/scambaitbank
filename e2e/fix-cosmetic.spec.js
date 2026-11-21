import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

test("terminal places Ivan in the UAE, matching his AED bank", async ({ page }) => {
  await page.goto("/");
  const out = page.locator("#termOut");
  await expect(out).toContainText("[+] target found: Ivan Petrov, 34, Dubai, acct ··3341", { timeout: 30_000 });
  await expect(out).not.toContainText("Moscow");
  await expect(out).toContainText("Online banking is ours.", { timeout: 30_000 });
  await expect(page.locator("#enterBank")).toBeVisible();
});

test("behind-the-scenes button and panel declare z-index once and stay on top (60)", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  for (const selector of [".bts-btn", ".bts"]) {
    const escaped = selector.replace(/[.-]/g, "\\$&");
    const rule = html.match(new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, "m"));
    expect(rule, `CSS rule for ${selector}`).not.toBeNull();
    expect(rule[1].match(/z-index\s*:/g), `z-index declarations in ${selector}`).toHaveLength(1);
  }

  await page.goto("/");
  await page.locator("#enterBank").evaluate((b) => b.click());
  await expect(page.locator("#btsBtn")).toBeVisible();
  await page.locator("#btsBtn").click();
  await expect(page.locator("#bts")).toBeVisible();
  for (const id of ["#btsBtn", "#bts"]) {
    await expect(page.locator(id)).toHaveCSS("z-index", "60");
  }
});

test("package.json describes the app that actually ships", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  expect(pkg.description).not.toMatch(/Galina|Nikitichna/i);
  expect(pkg.description).toMatch(/ScamBaitBank/);
  expect(pkg.description).toMatch(/Bingo/);
});
