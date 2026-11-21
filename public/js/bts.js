import { $, esc, hhmm } from "./util.js";

/* ===================== Behind the scenes ===================== */
export const bts = { start: 0, vids: 0 };
export function btsLog(t) { $("btsLog").insertAdjacentHTML("afterbegin", `<li>${hhmm()} ${esc(t)}</li>`); }
setInterval(() => { if (bts.start) { const s = Math.floor((Date.now() - bts.start) / 1000); $("btsTime").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; } }, 1000);
$("btsBtn").onclick = () => { $("bts").hidden = !$("bts").hidden; };
