export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
let clock = new Date(2026, 10, 21, 2, 3, 7);
export const hhmm = () => clock.toTimeString().slice(0, 5);
setInterval(() => { clock = new Date(clock.getTime() + 1000); $("termClock").textContent = clock.toTimeString().slice(0, 8); }, 1000);
