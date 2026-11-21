import { $ } from "./util.js";
import { btsLog } from "./bts.js";
import { board, verdict, drawBoard } from "./bingo.js";

/* ---------- Lunch break after the 10th accepted card ---------- */
const LUNCH_SECONDS = 30 * 60;
let lunchEnd = 0, lunchTimer = 0;
export function startLunch() {
  board.lunch = true; board.lunchDone = true;
  $("lunch").hidden = false;
  verdict("info", "Lunch break.", "Scam Bait Bingo reviewers are at lunch. Please do not close this window or you will lose your progress.");
  btsLog("Verification 'lunch break'. Scammer left waiting");
  lunchEnd = Date.now() + LUNCH_SECONDS * 1000;
  tickLunch(); lunchTimer = setInterval(tickLunch, 1000); drawBoard();
}
function tickLunch() {
  const left = Math.max(0, Math.round((lunchEnd - Date.now()) / 1000));
  $("lunchLeft").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  if (left <= 0) endLunch();
}
export function endLunch() {
  if (!board.lunch) return;
  clearInterval(lunchTimer); board.lunch = false; $("lunch").hidden = true;
  verdict("info", "Back from lunch.", "Service resumed. Open the next card.");
  drawBoard();
}
$("lunchLeft").ondblclick = endLunch;
