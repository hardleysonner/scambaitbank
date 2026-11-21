import { test, expect } from "@playwright/test";

const PASSPORT_TASK = "Do 100 squats holding your passport open at the photo page.";

// CI has no camera; make getUserMedia fail everywhere so the recorder always uses its pretend-video fallback.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

const lastVerdictTitle = (page) => page.locator("#verdicts .vd b").first();

async function openBingo(page) {
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await expect(page.getByRole("dialog", { name: "Transfer authentication" })).toBeVisible();
}

async function sendPretendVideo(page, { beforeSend } = {}) {
  await page.locator("#recBtn").click();
  const recorder = page.locator("#rec");
  await expect(recorder).toBeVisible();
  await expect(page.locator("#nocam")).toContainText("You can still send a pretend video");
  await page.locator("#recGo").click();
  await expect(page.locator("#recGo")).toHaveText("Stop and send");
  await expect(page.locator("#recDot")).toBeVisible();
  await page.waitForTimeout(1200);
  if (beforeSend) await beforeSend();
  await page.locator("#recGo").click();
  await expect(page.locator("#upbar")).toBeVisible();
  await expect(page.locator("#recNote")).toContainText("Uploading");
  await expect(recorder).toBeHidden();
  await expect(page.locator("#btsVids")).toHaveText("1");
}

test("5-minute demo flow from the README", async ({ page }) => {
  await page.goto("/");

  // 1. Terminal intro plays out and leads to online banking.
  const term = page.locator("#term");
  await expect(term).toBeVisible();
  await expect(page.locator("#termOut")).toContainText("Online banking is ours.", { timeout: 30_000 });
  const enter = page.getByRole("button", { name: /open https:\/\/online\.sbb\.bank/ });
  await expect(enter).toBeVisible();
  await enter.click();
  await expect(term).toBeHidden();
  await expect(page.getByText("Good night, Ivan")).toBeVisible();
  await expect(page.locator("#bal")).toHaveText("AED 58,420.50");

  // 2. The transfer form is prefilled for AED 55,000.
  await expect(page.getByLabel("Amount, AED")).toHaveValue("55,000.00");
  await expect(page.getByLabel("Recipient")).toHaveValue("Golden Sands Crypto FZE");

  // 3. Send transfer -> "Additional verification required" -> transfer-authentication window.
  await page.getByRole("button", { name: "Send transfer" }).click();
  await expect(page.locator("#sendBtn")).toContainText("Checking transfer");
  await expect(page.getByRole("dialog", { name: "Additional verification required" })).toBeVisible();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  const authWin = page.getByRole("dialog", { name: "Transfer authentication" });
  await expect(authWin).toBeVisible();
  await expect(authWin).toContainText("AED 55,000.00 to Golden Sands Crypto FZE");

  // The close button does not close it; it only shakes and warns.
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(authWin).toBeVisible();
  await expect(page.locator("#awBox")).toHaveClass(/shake/);
  await expect(page.locator("#awWarn")).toBeVisible();
  await expect(page.locator("#awWarn")).toContainText("cannot be closed");

  // 4. Scam Bait Bingo: a 5x5 board with a free centre square.
  const cells = page.locator("#board .cell");
  await expect(cells).toHaveCount(25);
  await expect(cells.nth(12)).toHaveClass(/free/);
  const boxes = await cells.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [Math.round(r.left), Math.round(r.top)]));
  expect(new Set(boxes.map(([x]) => x)).size).toBe(5);
  expect(new Set(boxes.map(([, y]) => y)).size).toBe(5);

  // The first card opened is always the passport squats.
  await cells.nth(0).click();
  await expect(page.locator("#taskText")).toHaveText(PASSPORT_TASK);
  await expect(cells.nth(0)).toHaveClass(/open/);
  await expect(page.locator("#board .cell:not([disabled])")).toHaveCount(0);

  // Submit a pretend video; the verdict is random: rejected or accepted.
  await sendPretendVideo(page);
  await expect(lastVerdictTitle(page)).toHaveText(/^(Rejected|Accepted)\.$/, { timeout: 15_000 });
  if ((await lastVerdictTitle(page).textContent()) === "Rejected.") {
    await expect(cells.nth(0)).toHaveAttribute("aria-label", "Closed card");
  } else {
    await expect(cells.nth(0)).toHaveClass(/ok/);
  }
  await expect(page.locator("#taskBox")).toBeHidden();

  // 5. Behind the scenes: account frozen, nothing moved, video binned.
  await page.getByRole("button", { name: "Behind the scenes" }).click();
  const bts = page.locator("#bts");
  await expect(bts).toBeVisible();
  await expect(bts).toContainText("frozen");
  await expect(bts).toContainText("AED 0");
  await expect(bts).toContainText("Transfer attempt: AED 55,000.00 to Golden Sands Crypto FZE. Not executed");
  await expect(bts).toContainText("thrown away unwatched");
  await expect(page.locator("#btsTime")).not.toHaveText("0:00");
});

test("a rejected video flips the card back face down", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await openBingo(page);
  await page.locator("#board .cell").nth(6).click();
  await expect(page.locator("#taskText")).toHaveText(PASSPORT_TASK);
  await sendPretendVideo(page, { beforeSend: () => page.evaluate(() => { Math.random = () => 0.99; }) });
  await expect(lastVerdictTitle(page)).toHaveText("Rejected.", { timeout: 15_000 });
  await expect(page.locator("#board .cell").nth(6)).toHaveClass(/bad/);
  await expect(page.locator("#board .cell").nth(6)).toHaveAttribute("aria-label", "Closed card");
  await expect(page.locator("#board .cell:not([disabled])")).toHaveCount(24);
});

test("an accepted video keeps the card face up, and the next card is a different task", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await openBingo(page);
  const cells = page.locator("#board .cell");
  await cells.nth(0).click();
  await sendPretendVideo(page, { beforeSend: () => page.evaluate(() => { Math.random = () => 0; }) });
  await expect(lastVerdictTitle(page)).toHaveText("Accepted.", { timeout: 15_000 });
  await expect(cells.nth(0)).toHaveClass(/ok/);
  await expect(cells.nth(0)).toHaveAttribute("aria-label", PASSPORT_TASK);

  await cells.nth(1).click();
  await expect(page.locator("#taskText")).not.toHaveText(PASSPORT_TASK);
  await expect(page.locator("#taskText")).not.toBeEmpty();
});
