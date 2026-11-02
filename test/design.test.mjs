// Guards the design rules in the README ("Design"): system fonts, hierarchy without gradient text,
// no looping decoration, and none of the stock "AI template" ornaments.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderPage, PAGES } from "../src/template.mjs";

const css = readFileSync("style.css", "utf8");
const content = JSON.parse(readFileSync("data/content.json", "utf8"));
const html = PAGES.map((pg) => renderPage(content, pg.id)).join("\n");

test("system fonts only: no web fonts to download", () => {
  assert.ok(!/@font-face/.test(css), "style.css declares a web font");
  assert.match(css, /--font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text"/);
});

test("hierarchy comes from weight, size and colour: no gradient or serif-italic text", () => {
  assert.ok(!/background-clip:\s*text/.test(css), "gradient text");
  assert.ok(!/conic-gradient/.test(css), "conic gradient");
  assert.ok(!/font-style:\s*italic/.test(css), "italic accent");
});

test("large text is tracked tighter than body text", () => {
  const ls = (sel) => Number(css.match(new RegExp(`${sel}[^{]*\\{[^}]*letter-spacing: (-?[\\d.]+)em`))[1]);
  assert.ok(ls("\\.t-display") < ls("\\.t-title"), "display tighter than titles");
  assert.ok(ls("\\.t-title") < ls("\\.t-card"), "titles tighter than card titles");
  assert.ok(ls("\\.t-card") <= ls("\nbody"), "card titles at most as open as body text");
});

test("no looping decorative motion (only the loading spinner repeats)", () => {
  for (const m of css.matchAll(/animation:\s*([\w-]+)[^;]*infinite/g)) assert.equal(m[1], "spin", `${m[1]} loops forever`);
});

test("no icons in boxes, marquees or spinning rings in the markup", () => {
  for (const cls of ["card-icon", "marquee", "photo-ring", "tech-strip"]) assert.ok(!html.includes(`class="${cls}`), cls);
});
