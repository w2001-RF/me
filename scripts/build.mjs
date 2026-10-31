// Builds the static site into _site/ from data/content.json.
// Usage: node scripts/build.mjs   (no dependencies, Node 18+)
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { render } from "../src/template.mjs";

const OUT = "_site";
const content = JSON.parse(await readFile("data/content.json", "utf8"));

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

await writeFile(`${OUT}/index.html`, render(content));

const COPY = ["style.css", "main.js", "scenes.js", "favicon.svg", "site.webmanifest", "404.html", "robots.txt", ".nojekyll", "assets", "admin", "src", "data"];
for (const path of COPY) {
  if (existsSync(path)) await cp(path, `${OUT}/${path}`, { recursive: true });
}

const url = content.site.url.replace(/\/?$/, "/");
const today = new Date().toISOString().slice(0, 10);
await writeFile(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`
);

console.log(`Built ${OUT}/ from data/content.json`);
