import { $, esc, sleep, pick } from "./util.js";
import { bts, btsLog } from "./bts.js";
import { TASKS } from "./tasks.js";
import { VERDICTS, OK_LINES } from "./verdicts.js";
import { freshCells, findLine, lunchDue, nextLevel } from "./bingo-engine.js";
import { startLunch } from "./lunch.js";

/* ===================== Verification Bingo (no AI, nothing is analysed) ===================== */
export const board = { level: 1, cells: [], active: -1, busy: false, accepted: 0, lunch: false, lunchDone: false, opened: false, deck: [], used: new Set(), firstDone: false };

export function newBoard() {
  board.cells = freshCells();
  board.active = -1;
  $("bLevel").textContent = `Level ${board.level} of 7`;
  $("taskBox").hidden = true;
  drawBoard();
}
function drawTask() {
  // The first card anyone opens is always the passport squats.
  if (!board.firstDone) { board.firstDone = true; return TASKS[0]; }
  if (!board.deck.length) board.deck = TASKS.slice(1).sort(() => Math.random() - .5);
  return board.deck.pop();
}
export function drawBoard() {
  $("board").innerHTML = board.cells.map((c, i) => {
    const cls = c.state === "free" ? "free" : c.state === "ok" ? "ok" : c.state === "open" ? "open" : c.state === "bad" ? "open bad" : "";
    const back = c.state === "free" ? "SBB<br>FREE" : esc(c.task);
    const dis = c.state !== "closed" || board.active >= 0 || board.busy || board.lunch;
    return `<button class="cell ${cls}" data-i="${i}" ${dis ? "disabled" : ""} aria-label="${c.state === "closed" ? "Closed card" : esc(c.task || "Free")}"><div class="in"><div class="f">SBB</div><div class="bk">${back}</div></div></button>`;
  }).join("");
}
export function verdict(kind, title, text) {
  $("verdicts").insertAdjacentHTML("afterbegin", `<div class="vd ${kind}"><b>${esc(title)}</b>${esc(text)}</div>`);
  while ($("verdicts").children.length > 4) $("verdicts").lastElementChild.remove();
}
export function setActive(i) {
  board.active = i;
  $("taskBox").hidden = i < 0;
  if (i >= 0) $("taskText").textContent = board.cells[i].task;
  drawBoard();
}
$("board").onclick = (e) => {
  const el = e.target.closest(".cell"); if (!el || el.disabled) return;
  const i = +el.dataset.i;
  board.cells[i].state = "open"; board.cells[i].task = drawTask();
  setActive(i);
  $("recBtn").focus();
};
let vPool = [];
const nextVerdict = () => { if (!vPool.length) vPool = VERDICTS.slice().sort(() => Math.random() - .5); return vPool.pop(); };
const hasLine = () => findLine(board.cells);

export async function videoReceived(seconds, sizeMb) {
  bts.vids++; $("btsVids").textContent = bts.vids;
  btsLog(`Video (${sizeMb} MB) thrown away unwatched`);
  board.busy = true; $("recBtn").disabled = true;
  verdict("info", "Reviewing…", `Video ${seconds}s · ${sizeMb} MB received.`);
  await sleep(1800 + Math.random() * 1500);
  const i = board.active, c = board.cells[i];
  const accept = Math.random() < 0.38;
  if (!accept) {
    c.state = "bad"; drawBoard();
    verdict("", "Rejected.", nextVerdict() + " Card returned to the deck.");
    await sleep(1300);
    c.state = "closed"; c.task = ""; setActive(-1);
  } else {
    c.state = "ok"; board.accepted++; setActive(-1);
    const line = hasLine();
    if (line) {
      document.querySelectorAll(".cell").forEach((el, k) => line.includes(k) && el.classList.add("win"));
      verdict("ok", "BINGO!", `Level ${board.level} of 7 complete. Generating the next card…`);
      btsLog(`Scammer completed Bingo level ${board.level}. There are 7. There is no level 8 either.`);
      await sleep(2600);
      board.level = nextLevel(board.level); newBoard();
    } else if (Math.random() < 0.15 && board.cells.filter((x) => x.state === "ok").length >= 3) {
      const oks = board.cells.map((x, k) => (x.state === "ok" ? k : -1)).filter((k) => k >= 0).sort(() => Math.random() - .5).slice(0, 2);
      oks.forEach((k) => { board.cells[k].state = "closed"; board.cells[k].task = ""; });
      verdict("", "Audit.", "Random quality audit found issues in 2 earlier videos. Those cards were reset.");
      drawBoard();
    } else {
      verdict("ok", "Accepted.", pick(OK_LINES));
    }
  }
  board.busy = false; $("recBtn").disabled = false; drawBoard();
  if (lunchDue(board)) startLunch();
}
