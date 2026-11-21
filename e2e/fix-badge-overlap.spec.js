import { test, expect } from "@playwright/test";

const PASSPORT_TASK = "Do 100 squats holding your passport open at the photo page.";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("No camera in CI", "NotFoundError"));
    }
  });
});

// Boxes of every text line on accepted cards, and of each card's ✓ badge (the .bk::after pseudo-element).
const okCardGeometry = (page) => page.locator("#board .cell.ok .bk").evaluateAll((bks) => bks.map((bk) => {
  const card = bk.getBoundingClientRect(), cs = getComputedStyle(bk), tick = getComputedStyle(bk, "::after");
  const right = card.right - parseFloat(cs.borderRightWidth) - parseFloat(tick.right);
  const bottom = card.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(tick.bottom);
  const badge = { left: right - parseFloat(tick.width), top: bottom - parseFloat(tick.height), right, bottom };
  const range = document.createRange(); range.selectNodeContents(bk);
  const lines = [...range.getClientRects()].map(({ left, top, right, bottom }) => ({ left, top, right, bottom }));
  return { task: bk.textContent, tick: tick.content, badge, lines };
}));

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function expectNoOverlap(cards) {
  for (const { task, tick, badge, lines } of cards) {
    expect(tick, task).toBe('"✓"');
    expect(lines.length, task).toBeGreaterThan(0);
    const hit = lines.filter((line) => overlaps(line, badge));
    expect(hit, `✓ badge covers text of "${task}"`).toEqual([]);
  }
}

async function openBingo(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "skip intro" }).click();
  await page.getByRole("button", { name: "Send transfer" }).click();
  await page.getByRole("button", { name: "Start Scam Bait Bingo" }).click();
  await expect(page.getByRole("dialog", { name: "Transfer authentication" })).toBeVisible();
}

test("the ✓ badge does not cover the passport task text on an accepted card", async ({ page }) => {
  await openBingo(page);
  const cell = page.locator("#board .cell").nth(4);
  await cell.click();
  await expect(page.locator("#taskText")).toHaveText(PASSPORT_TASK);
  await page.locator("#recBtn").click();
  await page.locator("#recGo").click();
  await expect(page.locator("#recGo")).toHaveText("Stop and send");
  await page.waitForTimeout(1200);
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator("#recGo").click();
  await expect(page.locator("#verdicts .vd b").first()).toHaveText("Accepted.", { timeout: 15_000 });
  await expect(cell).toHaveClass(/ok/);
  await page.waitForTimeout(700); // card flip
  await page.screenshot({ path: test.info().outputPath("accepted-passport.png") });

  const cards = await okCardGeometry(page);
  expect(cards.map((c) => c.task)).toEqual([PASSPORT_TASK]);
  expectNoOverlap(cards);
});

for (const width of [1280, 390]) {
  test(`no task text runs under the ✓ badge on accepted cards at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openBingo(page);
    const tasks = await page.evaluate(() => TASKS);
    for (let k = 0; k < tasks.length; k += 24) {
      await page.evaluate((k) => {
        board.cells.forEach((c, i) => { if (i !== FREE) { c.state = "ok"; c.task = TASKS[(k + i) % TASKS.length]; } });
        drawBoard();
      }, k);
      const cards = await okCardGeometry(page);
      expect(cards).toHaveLength(24);
      expectNoOverlap(cards);
    }
  });
}
