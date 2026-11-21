import { test, expect } from "@playwright/test";

// CI has no camera; make getUserMedia fail so the recorder uses its pretend-video fallback.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

async function startUpload(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await page.locator("#board .cell").nth(0).click();
  await page.locator("#recBtn").click();
  await expect(page.locator("#rec")).toBeVisible();
  await page.locator("#recGo").click();
  await expect(page.locator("#recGo")).toHaveText("Stop and send");
  await page.waitForTimeout(1200);
  // Smallest upload steps, so the "upload" lasts a couple of seconds.
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator("#recGo").click();
  await expect(page.locator("#recNote")).toContainText("Uploading");
}

async function expectNothingCountedOrJudged(page) {
  await expect(page.locator("#rec")).toBeHidden();
  // Longer than the full upload plus review would take.
  await page.waitForTimeout(5000);
  await expect(page.locator("#btsVids")).toHaveText("0");
  await expect(page.locator("#verdicts")).not.toContainText(/Reviewing|Accepted|Rejected/);
  await expect(page.locator("#board .cell").nth(0)).toHaveClass(/open/);
  await expect(page.locator("#recBtn")).toBeEnabled();
}

test("Cancel during upload aborts it: the video is not counted or judged", async ({ page }) => {
  await startUpload(page);
  await page.locator("#recCancel").click();
  await expectNothingCountedOrJudged(page);
});

test("Esc during upload aborts it: the video is not counted or judged", async ({ page }) => {
  await startUpload(page);
  await page.keyboard.press("Escape");
  await expectNothingCountedOrJudged(page);
});

test("after a cancelled upload, the next video is still sent and judged once", async ({ page }) => {
  await startUpload(page);
  await page.locator("#recCancel").click();
  await expect(page.locator("#rec")).toBeHidden();
  await page.locator("#recBtn").click();
  await page.locator("#recGo").click();
  await page.waitForTimeout(1200);
  await page.locator("#recGo").click();
  await expect(page.locator("#rec")).toBeHidden({ timeout: 10_000 });
  await expect(page.locator("#btsVids")).toHaveText("1");
  await expect(page.locator("#verdicts .vd b").first()).toHaveText("Accepted.", { timeout: 15_000 });
  await page.waitForTimeout(2000);
  await expect(page.locator("#btsVids")).toHaveText("1");
});
