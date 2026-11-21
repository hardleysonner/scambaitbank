import { $, sleep } from "./util.js";
import { btsLog } from "./bts.js";
import { openAuth } from "./auth.js";

/* ===================== Bank ===================== */
$("qaTransfer").onclick = () => { $("transferCard").scrollIntoView({ behavior: "smooth" }); $("amt").focus(); };
$("qaSupport").onclick = () => { $("transferCard").scrollIntoView({ behavior: "smooth" }); };
$("tform").onsubmit = async (e) => {
  e.preventDefault();
  const b = $("sendBtn"); b.disabled = true; b.innerHTML = '<span class="spinner"></span>Checking transfer…';
  await sleep(1600);
  b.disabled = false; b.textContent = "Send transfer";
  const amt = $("amt").value, to = $("to").value;
  btsLog(`Transfer attempt: AED ${amt} to ${to}. Not executed`);
  $("awSum").textContent = `AED ${amt} to ${to} · pending verification`;
  $("verify").hidden = false; $("connect").focus();
};
$("connect").onclick = () => { $("verify").hidden = true; openAuth(); };
