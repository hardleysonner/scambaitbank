// ScamBaitBank demo: a tiny static server. No AI, no database, no real bank.
// The whole app is public/index.html. Run: node server.js, then open http://localhost:3000
// (the camera only works on localhost or https).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(self), microphone=(), geolocation=(), payment=()",
  "cross-origin-opener-policy": "same-origin",
};

// Inline scripts are allowed by hash only, so injected markup can't run code.
const csp = (html) => {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${crypto.createHash("sha256").update(m[1]).digest("base64")}'`);
  return [
    "default-src 'self'",
    `script-src ${hashes.join(" ") || "'none'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self' blob: mediastream:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
};

const send = (res, status, body, extra = {}) => { res.writeHead(status, { ...HEADERS, "content-type": "text/plain; charset=utf-8", ...extra }); res.end(body); };

function resolve(reqUrl) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(reqUrl, "http://x").pathname); } catch { return null; }
  if (pathname === "/") pathname = "/index.html";
  const file = path.join(pub, path.normalize(pathname));
  return file.startsWith(pub + path.sep) ? file : undefined;
}

http.createServer((req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method not allowed", { allow: "GET, HEAD" });
    const file = resolve(req.url);
    if (file === null) return send(res, 400, "bad request");
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, "not found");
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    if (file.endsWith(".html")) {
      // index.html is written as a page body (it is also published as a claude.ai artifact); add the document skeleton here.
      const body = fs.readFileSync(file, "utf8");
      res.writeHead(200, { ...HEADERS, "content-type": type, "content-security-policy": csp(body) });
      return res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`);
    }
    res.writeHead(200, { ...HEADERS, "content-type": type });
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) send(res, 500, "server error"); else res.destroy();
  }
}).listen(PORT, () => console.log(`ScamBaitBank is open: http://localhost:${PORT}`));
