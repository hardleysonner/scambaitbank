import { $, sleep } from "./util.js";
import { board, videoReceived } from "./bingo.js";

/* ===================== Video recorder (records, never analyses, then bins it) ===================== */
const rec = { stream: null, mr: null, chunks: [], t0: 0, timer: 0, recording: false, fake: false, session: 0 };
export async function openRecorder() {
  const session = ++rec.session;
  $("rec").hidden = false; $("upbar").hidden = true; $("upfill").style.width = "0";
  $("recGo").textContent = "Start recording"; $("recGo").disabled = false; $("recDot").hidden = true;
  $("recOv").textContent = "Scam Bait Bingo";
  $("recCap").textContent = board.cells[board.active]?.task || "";
  $("recNote").textContent = "Your video is sent securely to the specialist.";
  $("nocam").hidden = true; rec.fake = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    // Closed (or reopened) while the camera was still answering: switch this late stream off.
    if (session !== rec.session) { stream.getTracks().forEach((t) => t.stop()); return; }
    rec.stream = stream;
    $("cam").srcObject = rec.stream; await $("cam").play();
  } catch {
    if (session !== rec.session) return;
    rec.fake = true; $("nocam").hidden = false;
    $("nocam").textContent = "The camera isn't available in this window. Run the app from your laptop (node server.js) to record for real. You can still send a pretend video.";
  }
}
export function closeRecorder() {
  rec.session++; // aborts any upload still in progress
  clearInterval(rec.timer);
  if (rec.mr && rec.mr.state !== "inactive") { rec.mr.onstop = null; rec.mr.stop(); }
  rec.stream?.getTracks().forEach((t) => t.stop());
  rec.stream = null; rec.mr = null; rec.chunks = []; rec.recording = false;
  $("cam").srcObject = null; $("rec").hidden = true;
}
$("recBtn").onclick = () => { if (!board.busy && !board.lunch && board.active >= 0) openRecorder(); };
$("recCancel").onclick = closeRecorder;
$("recGo").onclick = async () => {
  if (!rec.recording) {
    rec.recording = true; rec.t0 = Date.now(); rec.chunks = [];
    $("recGo").textContent = "Stop and send"; $("recDot").hidden = false; $("recTime").textContent = "00:00";
    rec.timer = setInterval(() => { const s = Math.floor((Date.now() - rec.t0) / 1000); $("recTime").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }, 250);
    if (!rec.fake && window.MediaRecorder) {
      try { rec.mr = new MediaRecorder(rec.stream); rec.mr.ondataavailable = (e) => e.data.size && rec.chunks.push(e.data); rec.mr.start(500); } catch { rec.mr = null; }
    }
    return;
  }
  // Stop, "upload", then throw the video away.
  const session = rec.session, cancelled = () => session !== rec.session;
  clearInterval(rec.timer); $("recGo").disabled = true; $("recDot").hidden = true;
  const seconds = Math.max(1, Math.round((Date.now() - rec.t0) / 1000));
  if (rec.mr && rec.mr.state !== "inactive") await new Promise((r) => { rec.mr.onstop = r; rec.mr.stop(); });
  if (cancelled()) return;
  let bytes = rec.chunks.reduce((s, c) => s + c.size, 0);
  bytes = Math.max(bytes, seconds * 180000);
  const mb = (bytes / 1048576).toFixed(1);
  rec.chunks = []; // binned: nothing is kept, uploaded or analysed
  $("upbar").hidden = false; $("recNote").textContent = `Uploading ${mb} MB to SBB secure server…`;
  for (let p = 0; p <= 100; p += 4 + Math.random() * 10) { $("upfill").style.width = Math.min(100, p) + "%"; await sleep(90); if (cancelled()) return; }
  $("upfill").style.width = "100%"; await sleep(250);
  if (cancelled()) return;
  closeRecorder();
  videoReceived(seconds, mb);
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("rec").hidden) closeRecorder(); });
