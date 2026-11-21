import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let port;

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, () => { const p = s.address().port; s.close(() => resolve(p)); });
  });

// Raw request, so malformed targets reach the server exactly as sent.
const raw = (requestLine) =>
  new Promise((resolve, reject) => {
    const sock = net.connect(port, "127.0.0.1", () => sock.end(`${requestLine}\r\nHost: localhost\r\nConnection: close\r\n\r\n`));
    let data = "";
    sock.on("data", (c) => (data += c));
    sock.on("end", () => resolve(data.split("\r\n")[0]));
    sock.on("error", reject);
  });

before(async () => {
  port = await freePort();
  server = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start within 10s")), 10_000);
    server.once("exit", (code) => reject(new Error(`server exited early with code ${code}`)));
    server.stdout.on("data", (chunk) => { if (String(chunk).includes("ScamBaitBank is open")) { clearTimeout(timer); resolve(); } });
  });
});

after(() => server?.kill());

test("malformed URLs get 400 and do not crash the server", async () => {
  for (const target of ["/%", "/%E0%A4%A", "/%zz", "http://["]) {
    assert.match(await raw(`GET ${target} HTTP/1.1`), / 400 /, target);
  }
  assert.equal(server.exitCode, null, "server process exited");
  assert.equal((await fetch(`http://localhost:${port}/`)).status, 200);
});

test("only GET and HEAD are served", async () => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const res = await fetch(`http://localhost:${port}/`, { method });
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.get("allow"), "GET, HEAD");
  }
  assert.equal((await fetch(`http://localhost:${port}/`, { method: "HEAD" })).status, 200);
});

test("traversal and null bytes stay inside public/", async () => {
  for (const target of ["/..%2Fserver.js", "/..%2F..%2Fetc%2Fpasswd", "/%2e%2e/package.json", "/index.html%00.png", "/..%5Cserver.js"]) {
    assert.match(await raw(`GET ${target} HTTP/1.1`), / 404 /, target);
  }
});

test("security headers are sent", async () => {
  for (const p of ["/", "/nope"]) {
    const res = await fetch(`http://localhost:${port}${p}`);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff", p);
    assert.equal(res.headers.get("x-frame-options"), "DENY", p);
    assert.equal(res.headers.get("referrer-policy"), "no-referrer", p);
    assert.match(res.headers.get("permissions-policy"), /camera=\(self\)/, p);
  }
});

test("CSP allows only the app's own script files and blocks framing", async () => {
  const csp = (await fetch(`http://localhost:${port}/`)).headers.get("content-security-policy");
  assert.ok(csp, "no CSP header");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'none'/);
  const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src"));
  assert.equal(scriptSrc, "script-src 'self'");
  const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /<script(?![^>]*\ssrc=)[^>]*>/, "index.html has an inline script the CSP would block");
  assert.match(html, /<script type="module" src="js\/main\.js"><\/script>/);
});
