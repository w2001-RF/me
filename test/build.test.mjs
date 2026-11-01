// With ASSET_CDN set, every static file is requested from the CDN (long cache lifetime) and exists in
// the repository, since jsDelivr serves the repository's files, not the built site.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const CDN = "https://cdn.jsdelivr.net/gh/example/site@0123456789abcdef/";
const pages = [];

before(() => {
  execFileSync(process.execPath, ["scripts/build.mjs"], { env: { ...process.env, ASSET_CDN: CDN }, stdio: "pipe" });
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? (/(admin|src|data|assets)$/.test(p) ? [] : walk(p)) : [p];
  });
  for (const file of walk("_site").filter((p) => p.endsWith(".html"))) pages.push({ file, html: readFileSync(file, "utf8") });
});

const refs = (html) => [...html.matchAll(/<(img|script|link)\b[^>]*?\s(src|href)="([^"]+)"[^>]*>/g)].map((m) => ({ tag: m[0], url: m[3] }));
const isStatic = ({ tag }) => /^<img|^<script/.test(tag) || /rel="(stylesheet|icon|apple-touch-icon|preload)"/.test(tag);

test("all pages were built", () => assert.ok(pages.length >= 7));

test("static files are served from the CDN", () => {
  for (const { file, html } of pages) {
    for (const r of refs(html).filter(isStatic)) {
      if (/^https:\/\/cdn\.jsdelivr\.net\/npm\//.test(r.url)) continue; // versioned npm packages (three.js)
      assert.ok(r.url.startsWith(CDN), `${file}: ${r.url} is not on the CDN`);
    }
  }
});

test("project screenshots in the details data come from the CDN", () => {
  const home = pages.find((p) => p.file.replace(/\\/g, "/") === "_site/index.html").html;
  const data = JSON.parse(home.match(/<script type="application\/json" id="projects-data">([\s\S]*?)<\/script>/)[1]);
  for (const x of data) for (const img of [x.image, ...x.gallery].filter(Boolean)) assert.ok(img.startsWith(CDN), img);
});

test("every file requested from the CDN exists in the repository", () => {
  const paths = new Set();
  for (const { html } of pages) for (const m of html.matchAll(new RegExp(CDN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^\"'\\s)]+)", "g"))) paths.add(m[1]);
  assert.ok(paths.size > 10);
  for (const p of paths) assert.ok(existsSync(decodeURIComponent(p)), `${p} is not in the repository`);
});

test("fonts are self-hosted (no Google Fonts requests)", () => {
  for (const { file, html } of pages) assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), file);
  const css = readFileSync("style.css", "utf8");
  for (const m of css.matchAll(/url\((assets\/fonts\/[^)]+)\)/g)) assert.ok(existsSync(m[1]), m[1]);
});

test("the CV and the manifest stay on the site (download attribute, same-origin manifest)", () => {
  const home = pages.find((p) => p.file.replace(/\\/g, "/") === "_site/index.html").html;
  assert.match(home, /href="assets\/Wassim-Rifay-CV\.pdf" class="btn btn-link" download/);
  assert.match(home, /<link rel="manifest" href="site\.webmanifest">/);
});

test("CSS and JS fall back to the site's own copy if the CDN fails", () => {
  const home = pages.find((p) => p.file.replace(/\\/g, "/") === "_site/index.html").html;
  assert.match(home, /href="[^"]+style\.css" onerror="this\.onerror=null;this\.href='style\.css'"/);
  assert.match(home, /src="[^"]+main\.js" defer onerror="this\.onerror=null;this\.src='main\.js'"/);
});
