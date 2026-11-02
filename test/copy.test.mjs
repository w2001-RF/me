// Guards the writing against "AI slop": no stock self-descriptions, and a short home page.
// The rule behind it: say what was done and measured, not what kind of person did it.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { PAGES } from "../src/template.mjs";

// Phrases every CV and About page on the internet uses; they carry no information
const BANNED = [
  /\bpassion(ate)?\b/i,
  /\bdriven by\b/i,
  /innovation,? (and|&) problem[- ]solving/i,
  /\bresults[- ]driven\b/i,
  /\bthrives? on\b/i,
  /\bself[- ]starter\b/i,
  /\bteam player\b/i,
  /\bdynamic environments?\b/i,
  /\bcommitted to delivering\b/i,
  /\bhigh[- ]quality results\b/i,
  /\binnovative thinker\b/i,
];
const HOME_MAX_WORDS = 450;

const pages = {};
before(() => {
  execFileSync(process.execPath, ["scripts/build.mjs"], { env: { ...process.env, ASSET_CDN: "" }, stdio: "pipe" });
  for (const pg of PAGES) pages[pg.id] = readFileSync(`_site/${pg.path}index.html`, "utf8");
});

// Visible text of <main>: no scripts, dialogs, icons or decorative (aria-hidden) elements
export function mainText(html) {
  let m = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  for (const tag of ["script", "dialog", "svg", "canvas"]) m = m.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "g"), " ");
  m = m.replace(/<div class="story-stage"[\s\S]*?<div class="container story-flow">/, " ");
  m = m.replace(/<(\w+)[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, " ");
  return m.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
}
const words = (text) => text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

for (const pg of PAGES) {
  test(`${pg.label}: no stock self-descriptions`, () => {
    const text = mainText(pages[pg.id]);
    for (const re of BANNED) assert.ok(!re.test(text), `"${text.match(re)?.[0]}" on the ${pg.label} page`);
  });
}

test("meta descriptions and link previews have no stock phrases either", () => {
  for (const pg of PAGES) {
    const head = pages[pg.id].slice(0, pages[pg.id].indexOf("</head>"));
    for (const re of BANNED) assert.ok(!re.test(head), `"${head.match(re)?.[0]}" in the ${pg.label} page head`);
  }
});

test(`the home page stays under ${HOME_MAX_WORDS} words`, () => {
  const n = words(mainText(pages.home));
  assert.ok(n <= HOME_MAX_WORDS, `${n} words on the home page`);
});

test("the home page backs its claims with numbers", () => {
  assert.match(mainText(pages.home), /\d+%/, "at least one measured result");
});
