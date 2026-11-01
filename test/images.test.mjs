// Every image in assets/ must pass WebPageTest's "Compress Images" and "Progressive JPEG" checks.
// Fix failures with: npm run optimize
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { imageWaste, isJpeg, isProgressiveJpeg } from "../scripts/perf-audit.mjs";
import { maxWidthFor } from "../scripts/optimize-images.mjs";

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const images = walk("assets").filter((p) => /\.(jpe?g|png)$/i.test(p)).map((p) => p.replace(/\\/g, "/"));

test("there are images to check", () => assert.ok(images.length > 0));

for (const path of images) {
  test(`${path} is optimized`, async () => {
    const buf = readFileSync(path);
    if (isJpeg(buf) && buf.length >= 10240) assert.ok(isProgressiveJpeg(buf), "baseline JPEG: should be progressive");
    const waste = await imageWaste(buf);
    assert.equal(waste, 0, `could be ${(waste / 1024).toFixed(1)} KB smaller`);
    const { width } = await sharp(buf).metadata();
    assert.ok(width <= maxWidthFor(path), `${width}px wide, larger than the ${maxWidthFor(path)}px it is ever shown at`);
  });
}
