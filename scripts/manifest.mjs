// Web app manifest, generated from data/content.json and kept in the repository (site.webmanifest)
// so it can be served from the CDN with the other static files. URLs are absolute because the
// manifest is fetched from the CDN, not from the site.
// Usage: node scripts/manifest.mjs   (rewrites site.webmanifest when content.json changed)
import { readFileSync, writeFileSync } from "node:fs";

export function manifest(content) {
  const url = content.site.url.replace(/\/?$/, "/");
  const name = `${content.profile.firstName} ${content.profile.lastName}`;
  return `${JSON.stringify({
    name: `${name} | ${content.profile.jobTitle}`,
    short_name: name,
    id: url,
    start_url: url,
    scope: url,
    display: "standalone",
    background_color: "#07070b",
    theme_color: "#07070b",
    icons: [{ src: `${url}favicon.svg`, sizes: "any", type: "image/svg+xml" }],
  }, null, 2)}\n`;
}

if (process.argv[1]?.endsWith("manifest.mjs")) {
  const next = manifest(JSON.parse(readFileSync("data/content.json", "utf8")));
  let current = "";
  try { current = readFileSync("site.webmanifest", "utf8").replace(/\r\n/g, "\n"); } catch {}
  if (current !== next) {
    writeFileSync("site.webmanifest", next);
    console.log("site.webmanifest updated");
  } else console.log("site.webmanifest is up to date");
}
