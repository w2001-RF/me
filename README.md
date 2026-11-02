# Wassim Rifay — Portfolio

Personal portfolio of **Wassim Rifay**, Full Stack AI Engineer in Kenitra, Morocco.

Live: [https://w2001-rf.github.io/me](https://w2001-rf.github.io/me/)

## How it works

- All content (texts, links, experience, projects, the story, the guided paths, photo and CV paths) lives in [`data/content.json`](data/content.json).
- [`src/template.mjs`](src/template.mjs) renders that JSON into one static, SEO-friendly page per section; [`main.js`](main.js) then navigates between them without reloads (SPA) and runs the guided paths; [`scenes.js`](scenes.js) holds the Three.js scenes.
- On every push to `main`, the GitHub Actions workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) optimizes new images, runs the tests, builds `_site/` (static files served from jsDelivr, cached for a year) and deploys it to GitHub Pages, then audits the live site.

## Editing content: `/admin`

Open https://w2001-rf.github.io/me/admin/ (not linked from the site, `noindex`).

1. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) with access to **only this repository** and **Contents: Read and write**.
2. Paste it in the admin page and click **Connect**. The token stays in your browser.
3. Edit any section, choose a new photo or CV if needed, check **Preview**, then **Save & publish**.
   The site rebuilds in about a minute.

Anyone can open `/admin`, but nothing can be saved without a token that has write access to the repository.

## Writing rules

The tests (`test/copy.test.mjs`) enforce them, so edits made from `/admin` keep to them too:

- **Facts, not adjectives.** Say what was built and what it changed ("an estimated 30% less ticket-processing time"), never what kind of person built it. Stock phrases such as "passionate", "driven by", "results-driven" or "innovation and problem-solving" fail the build.
- **Every claim has its evidence.** Each story chapter links to the page that proves it.
- **The home page stays under 450 words.** Details belong on their own pages.
- In titles, `*words*` become the italic serif accent; in paragraphs, `**words**` are bold.

## Visual identity: "the Logician's notebook"

Designed around an INTP profile: analytical, curious, independent, more at ease with systems and evidence than with self-promotion. The site should feel like the margin notes of an engineer's notebook: calm, precise, and showing its work.

| Role | Dark (default) | Light | Used for |
|---|---|---|---|
| Ink / paper (background) | `#0b0c10` | `#f3f1ec` | page |
| Surface | `#12141a` | `#fbfaf7` | cards |
| Text | `#ebe8e1` | `#15171c` | body text (warm, paper-like white) |
| Muted | `#8b8e97` | `#6c6f78` | secondary text, annotations |
| **Signal** (violet, the analysts' colour) | `#a594ff` | `#5b46e0` | the only colour for what you can act on: links, buttons, the current step |
| **Trace** (amber) | `#e6b45a` | `#9a5a00` | measured data only (figures, results) |

- **Type:** Inter for reading; monospace for annotations (section tags written as `// about me`, labels, dates, tags, figures); Instrument Serif italic for the one accented phrase in a title.
- **Restraint:** one accent per screen. The gradient appears in a single place, the hero statement.
- **Motion with meaning:** the 3D follows the story rather than decorating it.
  - Hero: a calm particle wave and one focal object, a chrome sphere that rises and dips, sending a ripple each time.
  - Home story, "From a question to a system": one shape changes state as the chapters scroll past: a point (*Question*) → a structure (*Model*) → connected clusters (*Build*) → spreading rings (*Ship*).
  - Skills: the skill universe, a network you can rotate and filter.
- **Guided paths:** the hero asks "Where do you want to start?" (*I'm hiring*, *I have a project*, *Just curious*); a small bar then shows the next step on every page.
- **Wordmark:** `W A S S I M   R I F A Y` in thin, widely spaced capitals closes every page.

Everything respects `prefers-reduced-motion`, and the site reads fully without JavaScript or WebGL.

## Local development

```bash
npm install                   # sharp and puppeteer-core, for the image optimizer, tests and audit
npm run build                 # builds _site/
npx http-server _site         # serve it locally
npm test                      # images, CDN build, scoring rules and writing rules
npm run optimize              # recompress images and refresh site.webmanifest
npm run audit -- https://w2001-rf.github.io/me/   # WebPageTest-style scores of a page
```
