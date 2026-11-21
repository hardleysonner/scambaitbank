import { test, expect } from "@playwright/test";

// A camera that answers only when the test says so. Each stream is a real MediaStream (canvas capture),
// and every track records whether stop() was called, so a "light left on" is observable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__cams = [];
    navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 48;
      canvas.getContext("2d").fillRect(0, 0, 64, 48);
      const stream = canvas.captureStream(5);
      const cam = { stopped: false, resolve: () => resolve(stream) };
      for (const t of stream.getTracks()) { const stop = t.stop.bind(t); t.stop = () => { cam.stopped = true; stop(); }; }
      window.__cams.push(cam);
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await page.locator("#board .cell").nth(0).click();
  await expect(page.locator("#taskText")).toBeVisible();
});

const camCount = (page) => page.evaluate(() => window.__cams.length);
const answerCam = (page, i) => page.evaluate((i) => window.__cams[i].resolve(), i);
const camStopped = (page, i) => page.evaluate((i) => window.__cams[i].stopped, i);
const camShown = (page) => page.evaluate(() => !!document.getElementById("cam").srcObject);

async function openRecorderWaitingForCamera(page, n) {
  await page.locator("#recBtn").click();
  await expect(page.locator("#rec")).toBeVisible();
  await expect.poll(() => camCount(page)).toBe(n);
}

for (const [how, close] of [
  ["Cancel", (page) => page.locator("#recCancel").click()],
  ["Esc", (page) => page.keyboard.press("Escape")],
]) {
  test(`${how} before the camera answers turns the camera off when it does`, async ({ page }) => {
    await openRecorderWaitingForCamera(page, 1);
    await close(page);
    await expect(page.locator("#rec")).toBeHidden();

    await answerCam(page, 0);
    await expect.poll(() => camStopped(page, 0)).toBe(true);
    expect(await camShown(page)).toBe(false);
  });
}

test("a late camera from a cancelled recorder doesn't hijack the reopened one", async ({ page }) => {
  await openRecorderWaitingForCamera(page, 1);
  await page.locator("#recCancel").click();
  await openRecorderWaitingForCamera(page, 2);

  await answerCam(page, 1);
  await expect.poll(() => camShown(page)).toBe(true);
  await answerCam(page, 0);
  await expect.poll(() => camStopped(page, 0)).toBe(true);
  expect(await camStopped(page, 1)).toBe(false);
  await expect(page.locator("#nocam")).toBeHidden();

  await page.locator("#recCancel").click();
  await expect.poll(() => camStopped(page, 1)).toBe(true);
});

test("the camera still works normally when it answers in time", async ({ page }) => {
  await openRecorderWaitingForCamera(page, 1);
  await answerCam(page, 0);
  await expect.poll(() => camShown(page)).toBe(true);
  await expect(page.locator("#nocam")).toBeHidden();
  await page.locator("#recCancel").click();
  await expect.poll(() => camStopped(page, 0)).toBe(true);
});
