import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
});

test("the demo runs under the CSP with no violations", async ({ page }) => {
  const res = await page.goto("/");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await page.getByRole("button", { name: "Skip intro" }).or(page.locator("#skipTerm")).first().click();
  await expect(page.getByText("Good night, Ivan")).toBeVisible();
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await page.locator("#board .cell:not([disabled])").first().click();
  await page.locator("#recBtn").click();
  await page.locator("#recGo").click();
  await page.waitForTimeout(1200);
  await page.locator("#recGo").click();
  await expect(page.locator("#verdicts .vd b").first()).toHaveText(/^(Rejected|Accepted|BINGO!|Audit)\.?/, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

test("injected markup cannot run script", async ({ page }) => {
  await page.goto("/");
  const ran = await page.evaluate(async () => {
    window.__pwned = false;
    document.body.insertAdjacentHTML("beforeend", '<img src="x:" onerror="window.__pwned=true"><div id="inj"></div>');
    const s = document.createElement("script"); s.textContent = "window.__pwned=true"; document.body.append(s);
    await new Promise((r) => setTimeout(r, 300));
    return window.__pwned;
  });
  expect(ran).toBe(false);
});

test("the app refuses to be framed", async ({ page, baseURL }) => {
  await page.goto("about:blank");
  await page.setContent(`<iframe id="f" src="${baseURL}/" width="800" height="600"></iframe>`);
  await page.waitForTimeout(1500);
  const frame = page.frames().find((f) => f.url().startsWith(baseURL));
  const loaded = frame ? await frame.locator("#term").count().catch(() => 0) : 0;
  expect(loaded).toBe(0);
});
