// Recompresses the images in assets/ in place:
//   JPEG  -> progressive mozjpeg (quality 80), resized when larger than it is ever displayed
//   PNG   -> palette + maximum compression when that is smaller
// A file is only rewritten when the result is smaller, or when a baseline JPEG becomes progressive.
// Usage: node scripts/optimize-images.mjs [dir] [--check]   (--check reports without writing, exits 1 if work is left)
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { isProgressiveJpeg } from "./perf-audit.mjs";

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const DIR = args.find((a) => !a.startsWith("--")) || "assets";

// Largest width each image is shown at (2x for high-density screens)
const MAX_WIDTH = [
  [/(^|\/)wassim\.[a-z]+$/, 900], // hero portrait: at most 440 CSS px wide
  [/(^|\/)logos\//, 200], // company logos: 44 CSS px
  [/./, 1600],
];
export const maxWidthFor = (path) => MAX_WIDTH.find(([re]) => re.test(path.replace(/\\/g, "/")))[1];

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

export async function optimize(path) {
  const input = readFileSync(path);
  const rel = relative(".", path).replace(/\\/g, "/");
  const meta = await sharp(input).metadata();
  const width = Math.min(meta.width, maxWidthFor(rel));
  // Already done: never re-encode a JPEG twice (each pass would lose a little quality)
  const done = { rel, before: input.length, after: input.length, changed: false };
  if (meta.format === "jpeg" && isProgressiveJpeg(input) && width === meta.width) return done;
  if (meta.format === "png" && (meta.isPalette || meta.paletteBitDepth) && width === meta.width) return done; // already quantized
  let img = sharp(input).rotate();
  if (width < meta.width) img = img.resize({ width });
  let output;
  if (meta.format === "jpeg") output = await img.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toBuffer();
  else if (meta.format === "png") output = await img.png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 }).toBuffer();
  else return null;
  const mustConvert = meta.format === "jpeg"; // a baseline JPEG (progressive ones returned above)
  const worthIt = output.length < input.length * 0.9;
  if (!mustConvert && !worthIt && width === meta.width) return { rel, before: input.length, after: input.length, changed: false };
  if (!CHECK) writeFileSync(path, output);
  return { rel, before: input.length, after: output.length, changed: true, resized: width < meta.width ? `${meta.width}→${width}px` : "" };
}

if (process.argv[1]?.endsWith("optimize-images.mjs")) {
  const files = walk(DIR).filter((p) => /\.(jpe?g|png)$/i.test(p));
  let before = 0;
  let after = 0;
  let changed = 0;
  for (const f of files) {
    const r = await optimize(f);
    if (!r) continue;
    before += r.before;
    after += r.after;
    if (r.changed) {
      changed++;
      console.log(`${CHECK ? "would optimize" : "optimized"} ${r.rel}: ${(r.before / 1024).toFixed(1)} → ${(r.after / 1024).toFixed(1)} KB ${r.resized || ""}`);
    }
  }
  console.log(`\n${files.length} images, ${changed} ${CHECK ? "to optimize" : "optimized"}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`);
  if (CHECK && changed) process.exitCode = 1;
}
