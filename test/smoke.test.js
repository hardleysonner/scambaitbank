import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let base;

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

before(async () => {
  const port = await freePort();
  base = `http://localhost:${port}`;
  server = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start within 10s")), 10_000);
    server.once("exit", (code) => reject(new Error(`server exited early with code ${code}`)));
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes("ScamBaitBank is open")) { clearTimeout(timer); resolve(); }
    });
  });
});

after(() => server?.kill());

test("GET / returns the app as HTML", async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  const html = await res.text();
  assert.match(html, /^<!doctype html>/i);

  // Bank UI with the prefilled transfer form
  assert.match(html, /ScamBaitBank/);
  assert.match(html, /id="transferCard"/);
  assert.match(html, /id="amt"[^>]*value="55,000\.00"/);
  assert.match(html, /id="sendBtn"[^>]*>Send transfer</);

  // Transfer-authentication window
  assert.match(html, /id="authWin"/);
  assert.match(html, /Transfer authentication/);
  assert.match(html, /id="awX"/);

  // Bingo board
  assert.match(html, /Scam Bait <span>Bingo<\/span>/);
  assert.match(html, /id="board"/);
});

test("unknown paths and path traversal return 404", async () => {
  assert.equal((await fetch(`${base}/nope.html`)).status, 404);
  assert.equal((await fetch(`${base}/..%2Fserver.js`)).status, 404);
  assert.equal((await fetch(`${base}/..%2F..%2Fetc%2Fpasswd`)).status, 404);
});
