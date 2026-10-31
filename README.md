# Wassim Rifay — Portfolio

Personal portfolio of **Wassim Rifay**, Full Stack Software Engineer & aspiring AI researcher.

Live: https://w2001-rf.github.io/me/

## How it works

- All content (texts, links, experience, projects, photo and CV paths) lives in [`data/content.json`](data/content.json).
- [`src/template.mjs`](src/template.mjs) renders that JSON into a static, SEO-friendly `index.html`.
- On every push to `main`, the GitHub Actions workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs `node scripts/build.mjs` and deploys `_site/` to GitHub Pages.

## Editing content: `/admin`

Open https://w2001-rf.github.io/me/admin/ (not linked from the site, `noindex`).

1. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) with access to **only this repository** and **Contents: Read and write**.
2. Paste it in the admin page and click **Connect**. The token stays in your browser.
3. Edit any section, choose a new photo or CV if needed, check **Preview**, then **Save & publish**.
   The site rebuilds in about a minute.

Anyone can open `/admin`, but nothing can be saved without a token that has write access to the repository.

## Local development

```bash
node scripts/build.mjs        # builds _site/ (Node 18+, no dependencies)
npx http-server _site         # serve it locally
```
