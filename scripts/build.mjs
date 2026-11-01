// Builds the static site into _site/ from data/content.json: one HTML file per page.
// Usage: node scripts/build.mjs   (no dependencies, Node 18+)
// ASSET_CDN=<url/> serves images, CSS, JS and fonts from that base instead of the site itself. The deploy
// workflow sets it to jsDelivr pinned to the deployed commit, which caches them for a year
// (GitHub Pages caches everything for 10 minutes only, and its headers cannot be changed).
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { renderPage, PAGES } from "../src/template.mjs";

const OUT = "_site";
const content = JSON.parse(await readFile("data/content.json", "utf8"));
const url = content.site.url.replace(/\/?$/, "/");
const basePath = new URL(url).pathname; // e.g. "/me/" on GitHub Pages
const cdn = process.env.ASSET_CDN ? process.env.ASSET_CDN.replace(/\/?$/, "/") : "";

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const page of PAGES) {
  const dir = `${OUT}/${page.path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}index.html`, renderPage(content, page.id, { root: page.path ? "../" : "", cdn }));
}
// GitHub Pages serves 404.html for any unknown URL, at any depth, so it uses absolute paths
await writeFile(`${OUT}/404.html`, renderPage(content, "404", { root: basePath, cdn }));

const COPY = ["style.css", "main.js", "scenes.js", "favicon.svg", "robots.txt", ".nojekyll", "assets", "admin", "src", "data"];
for (const path of COPY) {
  if (existsSync(path)) await cp(path, `${OUT}/${path}`, { recursive: true });
}

const name = `${content.profile.firstName} ${content.profile.lastName}`;
await writeFile(
  `${OUT}/site.webmanifest`,
  JSON.stringify({
    name: `${name} | ${content.profile.jobTitle}`,
    short_name: name,
    start_url: basePath,
    scope: basePath,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fbfbfd",
    icons: [{ src: `${basePath}favicon.svg`, sizes: "any", type: "image/svg+xml" }],
  }, null, 2)
);

const today = new Date().toISOString().slice(0, 10);
await writeFile(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((pg) => `  <url>
    <loc>${url}${pg.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${pg.path ? "0.8" : "1.0"}</priority>
  </url>`).join("\n")}
</urlset>
`
);

console.log(`Built ${PAGES.length} pages + 404 into ${OUT}/ from data/content.json${cdn ? `, static files from ${cdn}` : ""}`);
