import { test } from "node:test";
import assert from "node:assert/strict";
import { LINES, FREE, LUNCH_AFTER, freshCells, findLine, lunchDue, nextLevel } from "../public/js/bingo-engine.js";

const withOk = (idx, state = "ok") => { const cells = freshCells(); idx.forEach((i) => (cells[i].state = state)); return cells; };

test("a fresh board has only the free centre card open", () => {
  const cells = freshCells();
  assert.equal(cells.length, 25);
  assert.equal(cells[FREE].state, "free");
  assert.equal(cells.filter((c) => c.state === "closed").length, 24);
  assert.equal(findLine(cells), undefined);
});

test("BINGO on every row, column and diagonal", () => {
  assert.equal(LINES.length, 12);
  for (const line of LINES) assert.deepEqual(findLine(withOk(line.filter((i) => i !== FREE))), line);
});

test("the free centre completes the middle row, column and both diagonals", () => {
  assert.deepEqual(findLine(withOk([10, 11, 13, 14])), [10, 11, 12, 13, 14]);
  assert.deepEqual(findLine(withOk([0, 6, 18, 24])), [0, 6, 12, 18, 24]);
});

test("no BINGO with four in a row, or with open/rejected cards in the line", () => {
  assert.equal(findLine(withOk([0, 1, 2, 3])), undefined);
  const cells = withOk([0, 1, 2, 3]); cells[4].state = "open";
  assert.equal(findLine(cells), undefined);
  cells[4].state = "bad";
  assert.equal(findLine(cells), undefined);
  assert.equal(findLine(withOk([0, 6, 7, 18, 19, 23])), undefined);
});

test("lunch break starts on the 10th accepted card, once", () => {
  assert.equal(LUNCH_AFTER, 10);
  for (let accepted = 0; accepted < 10; accepted++) assert.equal(lunchDue({ accepted, lunchDone: false }), false, `accepted ${accepted}`);
  assert.equal(lunchDue({ accepted: 10, lunchDone: false }), true);
  assert.equal(lunchDue({ accepted: 10, lunchDone: true }), false);
  assert.equal(lunchDue({ accepted: 11, lunchDone: false }), false);
});

test("levels stop at 7 of 7", () => {
  assert.equal(nextLevel(1), 2);
  assert.equal(nextLevel(6), 7);
  assert.equal(nextLevel(7), 7);
});
