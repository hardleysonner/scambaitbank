import { test, expect } from "@playwright/test";

// CI has no camera; make getUserMedia fail so the recorder uses its pretend-video fallback.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

const lastVerdict = (page) => page.locator("#verdicts .vd").first();

async function sendPretendVideo(page, random) {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await page.locator("#board .cell").nth(0).click();
  await page.locator("#recBtn").click();
  await page.locator("#recGo").click();
  await expect(page.locator("#recGo")).toHaveText("Stop and send");
  await page.waitForTimeout(1200);
  await page.evaluate((r) => { Math.random = () => r; }, random);
  await page.locator("#recGo").click();
}

test("accepted verdict text does not repeat the title", async ({ page }) => {
  // 0.3 accepts the video and picks the second accept line.
  await sendPretendVideo(page, 0.3);
  await expect(lastVerdict(page).locator("b")).toHaveText("Accepted.", { timeout: 15_000 });
  const body = await lastVerdict(page).evaluate((el) => el.lastChild.textContent);
  expect(body).not.toMatch(/accepted/i);
});

test("rejected verdict text does not repeat the title", async ({ page }) => {
  await sendPretendVideo(page, 0.99);
  await expect(lastVerdict(page).locator("b")).toHaveText("Rejected.", { timeout: 15_000 });
  const body = await lastVerdict(page).evaluate((el) => el.lastChild.textContent);
  expect(body).not.toMatch(/^\s*rejected/i);
});

test("no accept or reject line restates its verdict title", async ({ page }) => {
  await page.goto("/");
  const { ok, rejected } = await page.evaluate(async () => { const { OK_LINES, VERDICTS } = await import("/js/verdicts.js"); return { ok: OK_LINES, rejected: VERDICTS }; });
  expect(ok.filter((l) => /accept/i.test(l))).toEqual([]);
  expect(rejected.filter((l) => /^\s*(rejected|not accepted)/i.test(l))).toEqual([]);
});
