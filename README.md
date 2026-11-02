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

## Design

Calm, precise and honest, like the person it presents: an INTP engineer who prefers evidence to adjectives. The craft follows Apple's interface guidelines (see `.claude/apple-design/SKILL.md`). The rules below exist so the site never looks like a generated template. `test/design.test.mjs` enforces the ones that can be checked.

### Type

- **System fonts only:** SF Pro on Apple devices, Segoe UI Variable on Windows, Roboto on Android. They ship optical sizes and tracking tables, cost nothing to download and look native everywhere.
- **Tracking and leading change with size:** large text is tight (display `-0.03em`, line height 1.04), body text is near `0` (line height 1.53), and small labels are slightly open. Sizes are in `rem`, so the layout follows the reader's text-size setting.
- **Hierarchy comes from weight, size and colour.** A title's second clause is grey in the same face ("Projects that **ship.**"). There is no gradient text, italic accent or second display font.

### Colour

| Role | Light | Dark | Used for |
|---|---|---|---|
| Background | `#ffffff` / `#f5f5f7` | `#000000` / `#0c0c0d` | page / alternate sections |
| Tiles | `#f5f5f7` | `#161617` | cards, grouped lists |
| Text / muted | `#1d1d1f` / `#6e6e73` | `#f5f5f7` / `#98989d` | |
| **Action** (zellige blue) | `#12609f` | `#6ab7e6` | the only colour for what you can act on |
| **Data** (ochre) | `#9a5a00` | `#e6b45a` | measured figures only: stats, the rate, project types |

- **Blue** is the "Cool Blue" of colour-energy profiles (cautious, precise, deliberate, questioning), the one that fits an INTP. It is also Morocco's blue: zellige tiles, Chefchaouen, and the Atlantic at Kenitra.
- **Ochre** is the colour of Moroccan earth and kasbah walls. Facts stand apart from links.
- **No red or violet in the interface:** "Fiery Red" (competitive, demanding) is the opposite of this profile. Morocco's red and green appear only in the skill universe's zellige tones (terracotta, Mamora forest green).
- The theme follows the device's light or dark setting until the visitor picks one.

### Surfaces and components

- **Tiles are filled, never outlined, shadowed or glowing.** One radius for tiles (22px), one for inner elements (14px), pills only for buttons.
- **Translucent material only on floating chrome:** the navigation, the guided-path bar, the dialog buttons and the badges over screenshots. Content scrolls under it. The bar's edge is a soft fade, not a divider.
- **Familiar patterns:** "Where do you want to start?", the contact methods and the service offers are grouped lists, like Settings. The project filter is a segmented control. On phones, project details open as a sheet from the bottom.
- **No ornaments:** no icons in boxes, marquees, spinning rings, hover-tilt cards or count-up numbers.

### Motion

- **Feedback on press:** buttons and rows react on pointer-down, not on release.
- **No looping decoration.** The only thing that repeats is the loading spinner.
- **Direct manipulation:**
  - *Hero:* grab the chrome sphere with a mouse and throw it. It follows the pointer 1:1, with rubber-band resistance far from home, then springs back (damping 0.8, response 0.45 s) at the speed you let go and drops a ripple into the wave.
  - *Screenshot carousel:* a flick's velocity is projected forward the way scrolling decelerates, and it lands on the shot you were heading for.
- **3D follows the story:**
  - *Home story,* "From a question to a system": one shape changes state as the chapters scroll past, from a point (*Question*) to a structure (*Model*), connected clusters (*Build*) and spreading rings (*Ship*).
  - *Skills:* the skill universe, a network you can rotate and filter.
- **Accessibility settings are respected:**
  - `prefers-reduced-motion`: cross-fades, no springs or slides;
  - `prefers-reduced-transparency`: solid bars;
  - `prefers-contrast: more`: outlined tiles and stronger text.
- The site reads fully without JavaScript or WebGL.

### Guided paths and wordmark

- **Guided paths:** the hero asks "Where do you want to start?" (*I'm hiring*, *I have a project*, *Just curious*). A small bar then shows the next step on every page.
- **Wordmark:** `W A S S I M   R I F A Y` in thin, widely spaced capitals closes every page.

## Local development

```bash
npm install                   # sharp and puppeteer-core, for the image optimizer, tests and audit
npm run build                 # builds _site/
npx http-server _site         # serve it locally
npm test                      # images, CDN build, scoring rules, writing and design rules
npm run optimize              # recompress images and refresh site.webmanifest
npm run audit -- https://w2001-rf.github.io/me/   # WebPageTest-style scores of a page
```
