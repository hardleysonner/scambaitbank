import { $, sleep } from "./util.js";
import { btsLog } from "./bts.js";

/* ===================== Hacker terminal ===================== */
const TERM = [
  ["dim", "$ ./takeover.sh --target \"Ivan Petrov\" --bank sbb"],
  ["", "[*] loading leaked KYC dump (sbb_kyc_2026-11-20.tar.gz) ........ 2.4M records"],
  ["ok", "[+] target found: Ivan Petrov, 34, Dubai, acct ··3341"],
  ["", "[*] spoofing device fingerprint: Galaxy S24 / Android 15"],
  ["", "[*] routing through tor exit 185.220.101.4"],
  ["", "[*] liveness check: streaming deepfake_ivan_v3.mp4 to SBB Verify"],
  ["ok", "[+] Face ID: PASSED (confidence 0.98)"],
  ["", "[*] KYC re-verification via compromised provider"],
  ["ok", "[+] KYC: PASSED"],
  ["", "[*] swapping phone number to +971 50 ••• 88 31"],
  ["ok", "[+] SMS 2FA now delivered to our phone"],
  ["ok", "[+] session token acquired. Online banking is ours."],
  ["warn", "[!] balance AED 58,420.50. Mule ready: Golden Sands Crypto FZE (Dubai)"],
];
let termDone = false;
export async function runTerm() {
  const out = $("termOut");
  for (const [cls, line] of TERM) {
    if (termDone) return;
    const div = document.createElement("div"); div.className = cls; out.append(div);
    for (let i = 0; i <= line.length; i += 3) { if (termDone) return; div.textContent = line.slice(0, i); await sleep(12); }
    div.textContent = line; out.scrollTop = 1e9;
    await sleep(cls === "ok" ? 380 : 220);
  }
  out.insertAdjacentHTML("beforeend", '<div class="dim">$ <span class="cursor"></span></div>');
  $("enterBank").hidden = false; $("enterBank").focus();
}
export function enterBank() {
  termDone = true; $("term").hidden = true;
  btsLog("Takeover pattern: 2am login, new device on Tor, phone swap, KYC re-check");
  btsLog("Real account quietly frozen. Ivan woken on his pre-registered channel");
  $("btsBtn").hidden = false;
}
$("enterBank").onclick = enterBank;
$("skipTerm").onclick = enterBank;
