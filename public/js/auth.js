import { $ } from "./util.js";
import { bts, btsLog } from "./bts.js";
import { board, newBoard, verdict } from "./bingo.js";

/* Transfer-authentication window that hosts Scam Bait Bingo. */
export function openAuth() {
  $("authWin").hidden = false;
  if (board.opened) return;
  board.opened = true; bts.start = Date.now();
  btsLog("Scammer sent to Scam Bait Bingo");
  newBoard();
  verdict("info", "Welcome.", "Night transfers need Scam Bait Bingo. Open any card to start.");
}

/* The window can't be closed: the X only complains. */
$("awX").onclick = () => {
  $("awWarn").hidden = false;
  const box = $("awBox"); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
};
