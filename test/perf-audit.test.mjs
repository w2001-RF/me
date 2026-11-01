// The audit's scoring follows WebPageTest's optimization checks
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { cacheScore, cacheTtl, grade, imageWaste, isProgressiveJpeg, score } from "../scripts/perf-audit.mjs";

// A noisy, photo-like test image (large enough to count: the progressive check ignores JPEGs under 10 KB)
const pixels = Buffer.alloc(640 * 480 * 3);
for (let i = 0; i < pixels.length; i++) pixels[i] = (Math.sin(i * 0.013) * 90 + 128 + ((i * 2654435761) % 41)) & 255;
const photo = () => sharp(pixels, { raw: { width: 640, height: 480, channels: 3 } });

test("cache lifetime is read from Cache-Control, then Expires", () => {
  assert.equal(cacheTtl({ "cache-control": "max-age=600" }), 600);
  assert.equal(cacheTtl({ "cache-control": "public, max-age=31536000, immutable" }), 31536000);
  assert.equal(cacheTtl({ "cache-control": "no-cache, max-age=3600" }), 0);
  assert.equal(cacheTtl({ date: "Sun, 01 Nov 2026 10:00:00 GMT", expires: "Sun, 01 Nov 2026 12:00:00 GMT" }), 7200);
  assert.equal(cacheTtl({}), 0);
});

test("cache score: 100 from 7 days, 50 from 1 hour, else 0", () => {
  assert.equal(cacheScore(7 * 86400), 100);
  assert.equal(cacheScore(86400), 50);
  assert.equal(cacheScore(3600), 50);
  assert.equal(cacheScore(600), 0);
});

test("reproduces the WebPageTest report of the original site (cache static content: 35)", async () => {
  // 6 files from GitHub Pages (10 min), the Google Fonts stylesheet (1 day), 3 font files (1 year)
  const entries = [
    ...Array.from({ length: 6 }, (_, i) => ({ url: `gh${i}`, headers: { "cache-control": "max-age=600" } })),
    { url: "fonts.googleapis.com", headers: { "cache-control": "private, max-age=86400" } },
    ...Array.from({ length: 3 }, (_, i) => ({ url: `gstatic${i}`, headers: { "cache-control": "public, max-age=31536000" } })),
    { url: "page", document: true, headers: { "cache-control": "max-age=600" } },
  ];
  assert.equal((await score(entries)).cacheStatic, 35);
});

test("progressive JPEGs are told apart from baseline ones", async () => {
  assert.equal(isProgressiveJpeg(await photo().jpeg({ progressive: true }).toBuffer()), true);
  assert.equal(isProgressiveJpeg(await photo().jpeg({ progressive: false }).toBuffer()), false);
});

test("an over-quality JPEG wastes bytes, a quality-80 one does not", async () => {
  assert.ok((await imageWaste(await photo().jpeg({ quality: 100 }).toBuffer())) > 0);
  assert.equal(await imageWaste(await photo().jpeg({ quality: 80, mozjpeg: true }).toBuffer()), 0);
});

test("image and progressive scores are weighted by bytes", async () => {
  const good = await photo().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toBuffer();
  const heavy = await photo().jpeg({ quality: 100 }).toBuffer();
  const result = await score([
    { url: "a.jpg", headers: {}, body: good },
    { url: "b.jpg", headers: {}, body: heavy },
  ]);
  assert.ok(result.compressImages < 100 && result.compressImages > 0);
  assert.equal(result.progressiveJpeg, Math.round((good.length / (good.length + heavy.length)) * 100));
});

test("grades", () => {
  assert.deepEqual([95, 85, 75, 65, 10].map(grade), ["A", "B", "C", "D", "F"]);
});
