// ScamBaitBank demo: a tiny static server. No AI, no database, no real bank.
// The whole app is public/index.html. Run: node server.js, then open http://localhost:3000
// (the camera only works on localhost or https).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = path.join(pub, path.normalize(p));
  if (!file.startsWith(pub) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end("not found");
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  if (file.endsWith(".html")) {
    // index.html is written as a page body (it is also published as a claude.ai artifact); add the document skeleton here.
    return res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${fs.readFileSync(file, "utf8")}</body></html>`);
  }
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`ScamBaitBank is open: http://localhost:${PORT}`));
