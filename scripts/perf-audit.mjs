// Loads a page in a real browser (phone viewport) and scores the requests it makes, using the same
// rules as WebPageTest's "Optimization Summary":
//   Cache Static Content  every static response (everything but the HTML document): 100 if it may be
//                         cached for at least 7 days, 50 for at least 1 hour, 0 otherwise; averaged
//   Compress Images       JPEGs are re-encoded at quality 85 and PNGs losslessly; an image more than
//                         10% larger than that wastes the difference. Score = 100 - wasted% of image bytes
//   Progressive JPEG      share of bytes, among JPEGs of 10 KB or more, that are progressive
//
// Usage:
//   node scripts/perf-audit.mjs https://w2001-rf.github.io/me/
//   node scripts/perf-audit.mjs --serve _site            (serves a local build, no cache headers)
//   options: --min 90 (fail below this score), --json report.json, --path about/
// The browser comes from CHROME_PATH, or a usual Chrome/Edge install location.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const MIN = Number(opt("min", 90));
const SERVE = opt("serve");
const JSON_OUT = opt("json");
const PATH = opt("path", "");
let target = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

const WEEK = 7 * 24 * 3600;
const HOUR = 3600;

export const grade = (score) => (score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F");

// Seconds a response may be reused from cache, from Cache-Control or Expires
export function cacheTtl(headers) {
  const cc = (headers["cache-control"] || "").toLowerCase();
  if (/no-store|no-cache/.test(cc)) return 0;
  const m = cc.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/);
  if (m) return Number(m[1]);
  if (headers.expires) {
    const now = headers.date ? Date.parse(headers.date) : Date.now();
    const exp = Date.parse(headers.expires);
    if (!Number.isNaN(exp)) return Math.max(0, Math.round((exp - now) / 1000));
  }
  return 0;
}
export const cacheScore = (ttl) => (ttl >= WEEK ? 100 : ttl >= HOUR ? 50 : 0);

export const isJpeg = (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
export const isPng = (buf) => buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;

// Progressive JPEGs use a SOF2 frame marker (0xFFC2)
export function isProgressiveJpeg(buf) {
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return false;
    const marker = buf[i + 1];
    if (marker === 0xc2) return true;
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xda) return false;
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return false;
}

// Bytes an image could lose: JPEG re-encoded at quality 85, PNG recompressed losslessly
export async function imageWaste(buf) {
  let optimized;
  if (isJpeg(buf)) optimized = await sharp(buf).jpeg({ quality: 85, mozjpeg: false }).toBuffer();
  else if (isPng(buf)) optimized = await sharp(buf).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  else return 0;
  return buf.length > optimized.length * 1.1 ? buf.length - optimized.length : 0;
}

export async function score(entries) {
  const statics = entries.filter((e) => !e.document);
  const cache = statics.map((e) => ({ ...e, ttl: cacheTtl(e.headers), score: cacheScore(cacheTtl(e.headers)) }));
  const images = [];
  for (const e of statics) {
    if (!e.body || !(isJpeg(e.body) || isPng(e.body))) continue;
    images.push({ ...e, bytes: e.body.length, wasted: await imageWaste(e.body), jpeg: isJpeg(e.body), progressive: isJpeg(e.body) && isProgressiveJpeg(e.body) });
  }
  const imgBytes = images.reduce((s, x) => s + x.bytes, 0);
  const wasted = images.reduce((s, x) => s + x.wasted, 0);
  const bigJpegs = images.filter((x) => x.jpeg && x.bytes >= 10240);
  const jpegBytes = bigJpegs.reduce((s, x) => s + x.bytes, 0);
  const progBytes = bigJpegs.filter((x) => x.progressive).reduce((s, x) => s + x.bytes, 0);
  return {
    cacheStatic: cache.length ? Math.round(cache.reduce((s, x) => s + x.score, 0) / cache.length) : 100,
    compressImages: imgBytes ? Math.round(((imgBytes - wasted) / imgBytes) * 100) : 100,
    progressiveJpeg: jpegBytes ? Math.round((progBytes / jpegBytes) * 100) : 100,
    details: { cache, images },
  };
}

// Minimal static server for a local build (sends no cache headers, like a dev server)
function serve(dir) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
    ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".pdf": "application/pdf",
    ".webmanifest": "application/manifest+json", ".txt": "text/plain", ".xml": "application/xml" };
  const server = createServer((req, res) => {
    let file = normalize(join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname)));
    if (!file.startsWith(normalize(dir))) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

function findBrowser() {
  const candidates = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium",
    "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("No Chrome/Edge found: set CHROME_PATH");
  return found;
}

async function run() {
  let server;
  if (SERVE) {
    server = await serve(SERVE);
    target = `http://127.0.0.1:${server.address().port}/`;
  }
  if (!target) throw new Error("Give a URL or --serve <dir>");
  const url = new URL(PATH, target).href;

  const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); // iPhone 15
  await page.setCacheEnabled(false);
  const pending = [];
  page.on("response", (res) => {
    const req = res.request();
    if (res.url().startsWith("data:") || res.status() < 200 || res.status() >= 300) return;
    pending.push((async () => {
      let body = null;
      if (req.resourceType() === "image") body = await res.buffer().catch(() => null);
      return { url: res.url(), type: req.resourceType(), headers: res.headers(), body,
        document: req.resourceType() === "document" && req.frame() === page.mainFrame() };
    })());
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2000));
  const entries = await Promise.all(pending);
  await browser.close();
  server?.close();

  const result = await score(entries);
  const rows = [["Cache Static Content", result.cacheStatic], ["Compress Images", result.compressImages], ["Progressive JPEG", result.progressiveJpeg]];
  console.log(`\nOptimization summary for ${url}\n`);
  for (const [name, s] of rows) console.log(`  ${grade(s)}  ${String(s).padStart(3)}  ${name}`);
  console.log("\n  Static requests (cache lifetime):");
  for (const c of result.details.cache) console.log(`    ${String(c.score).padStart(3)}  ${fmtTtl(c.ttl).padStart(8)}  ${short(c.url)}`);
  if (result.details.images.length) {
    console.log("\n  Images:");
    for (const x of result.details.images) console.log(`    ${(x.bytes / 1024).toFixed(1).padStart(7)} KB  ${x.jpeg ? (x.progressive ? "progressive" : "baseline   ") : "png        "}  ${x.wasted ? `wastes ${(x.wasted / 1024).toFixed(1)} KB` : "ok"}  ${short(x.url)}`);
  }
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ url, cacheStatic: result.cacheStatic, compressImages: result.compressImages, progressiveJpeg: result.progressiveJpeg }, null, 2));
  const failed = rows.filter(([, s]) => s < MIN);
  if (failed.length) {
    console.error(`\n  Below ${MIN}: ${failed.map(([n]) => n).join(", ")}`);
    process.exitCode = 1;
  } else console.log(`\n  All scores are ${MIN} or more.`);
}
const fmtTtl = (s) => (s >= 86400 ? `${Math.round(s / 86400)}d` : s >= 3600 ? `${Math.round(s / 3600)}h` : `${s}s`);
const short = (u) => (u.length > 90 ? `${u.slice(0, 44)}…${u.slice(-44)}` : u);

if (import.meta.url === new URL(process.argv[1], "file:").href || process.argv[1]?.endsWith("perf-audit.mjs")) {
  run().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
