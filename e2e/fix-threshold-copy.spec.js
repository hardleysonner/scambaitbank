import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

// Scam Bait Bingo triggers for every transfer, so the modal must not promise an amount threshold.
for (const amount of ["10.00", "55,000.00"]) {
  test(`verification modal for AED ${amount} does not claim an amount threshold`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "skip intro" }).click();
    await page.getByLabel("Amount, AED").fill(amount);
    await page.getByRole("button", { name: "Send transfer" }).click();

    const modal = page.getByRole("dialog", { name: "Additional verification required" });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Scam Bait Bingo");
    await expect(modal).not.toContainText(/\b(over|above|exceeding|more than)\s+AED\b/i);
    await expect(modal).not.toContainText(/AED\s*[\d,]+/);
    await expect(modal).toContainText(/every transfer/i);
  });
}
