import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

async function submitTransfer(page, { amount, recipient }) {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  if (amount !== undefined) await page.getByLabel("Amount, AED").fill(amount);
  if (recipient !== undefined) await page.getByLabel("Recipient").fill(recipient);
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  const authWin = page.getByRole("dialog", { name: "Transfer authentication" });
  await expect(authWin).toBeVisible();
  return authWin.locator(".aw-title span");
}

test("auth window title shows the edited amount and recipient", async ({ page }) => {
  const title = await submitTransfer(page, { amount: "10.00", recipient: "Uncle Vanya Trading LLC" });
  await expect(title).toHaveText("AED 10.00 to Uncle Vanya Trading LLC · pending verification");
  await page.locator("#btsBtn").click();
  await expect(page.locator("#btsLog")).toContainText("Transfer attempt: AED 10.00 to Uncle Vanya Trading LLC. Not executed");
});

test("auth window title keeps the default demo transfer", async ({ page }) => {
  const title = await submitTransfer(page, {});
  await expect(title).toHaveText("AED 55,000.00 to Golden Sands Crypto FZE · pending verification");
});

test("auth window title renders user-entered text as text, not HTML", async ({ page }) => {
  const evil = '<img src=x onerror="window.__xss=1"><b>Evil</b>';
  const title = await submitTransfer(page, { recipient: evil });
  await expect(title).toHaveText(`AED 55,000.00 to ${evil} · pending verification`);
  await expect(title.locator("img, b")).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});
