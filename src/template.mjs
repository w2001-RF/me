// Renders the portfolio page from data/content.json.
// Used by scripts/build.mjs (static HTML for GitHub Pages) and by the admin page (live preview).

const esc = (v = "") =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Escaped text with **bold** support
const rich = (v = "") => esc(v).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

const list = (items = [], fn) => items.map(fn).join("\n");
const tags = (items = [], cls = "tags sm") =>
  items.length ? `<ul class="${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
const ext = (url) => (url ? ` target="_blank" rel="noopener"` : "");

const ICONS = {
  github: `<path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/>`,
  linkedin: `<path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/>`,
  mail: `<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13Zm2.4-.5L12 10.7 19.6 5H4.4ZM20 6.6l-7.4 5.6a1 1 0 0 1-1.2 0L4 6.6v11.9c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V6.6Z"/>`,
  whatsapp: `<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/>`,
  pin: `<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>`,
  download: `<path d="M12 3a1 1 0 0 1 1 1v9.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l3.3 3.3V4a1 1 0 0 1 1-1ZM4 19a1 1 0 0 1 1 1h14a1 1 0 1 1 0 2H5a2 2 0 0 1-2-2 1 1 0 0 1 1-1Z"/>`,
  arrow: `<path d="M13.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4l4.3-4.3H4a1 1 0 1 1 0-2h13.6l-4.3-4.3a1 1 0 0 1 0-1.4Z"/>`,
  up: `<path d="M11.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1-1.4 1.4L13 8.4V19a1 1 0 1 1-2 0V8.4l-4.3 4.3a1 1 0 0 1-1.4-1.4l6-6Z"/>`,
  sun: `<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM3 11h1a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2Zm17 0h1a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2ZM5.6 4.2l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4Zm13.5 13.5.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4Zm.7-13.5a1 1 0 0 1 0 1.4l-.7.7a1 1 0 1 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0ZM6.3 17.7a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z"/>`,
  moon: `<path d="M21 14.5A9 9 0 0 1 9.5 3a1 1 0 0 0-1.3-1.2A10.5 10.5 0 1 0 22.2 15.8a1 1 0 0 0-1.2-1.3Z"/>`,
  brain: `<path d="M9 2a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 8a3 3 0 0 0 .6 1.8A3.5 3.5 0 0 0 5 16a3 3 0 0 0 4 3.8V20a2 2 0 0 0 2 2V3.2A3 3 0 0 0 9 2Zm6 0a3 3 0 0 0-2 .8V22a2 2 0 0 0 2-2v-.2A3 3 0 0 0 19 16a3.5 3.5 0 0 0 .4-6.2A3 3 0 0 0 20 8a3 3 0 0 0-2-2.8V5a3 3 0 0 0-3-3Z"/>`,
  bot: `<path d="M12 2a1.5 1.5 0 0 1 1 2.6V6h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h4V4.6A1.5 1.5 0 0 1 12 2ZM9 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM2 11a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm20 0a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z"/>`,
  server: `<path d="M4 3h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM4 13h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Zm2 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>`,
  layout: `<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v3h14V5H5Zm0 5v9h5v-9H5Zm7 0v9h7v-9h-7Z"/>`,
  db: `<path d="M12 2c4.4 0 8 1.6 8 3.5S16.4 9 12 9 4 7.4 4 5.5 7.6 2 12 2ZM4 8.3C5.6 9.6 8.6 10.5 12 10.5s6.4-.9 8-2.2V12c0 1.9-3.6 3.5-8 3.5S4 13.9 4 12V8.3Zm0 6.5c1.6 1.3 4.6 2.2 8 2.2s6.4-.9 8-2.2v3.7C20 20.4 16.4 22 12 22s-8-1.6-8-3.5v-3.7Z"/>`,
  cloud: `<path d="M6.5 20A5.5 5.5 0 0 1 5.6 9.1 7 7 0 0 1 19 8.5a5.8 5.8 0 0 1-.8 11.5H6.5Z"/>`,
  grad: `<path d="M11.5 3.1a1 1 0 0 1 1 0l10 5a1 1 0 0 1 0 1.8L21 10.6V16a1 1 0 1 1-2 0v-4.4l-6.5 3.3a1 1 0 0 1-1 0l-10-5a1 1 0 0 1 0-1.8l10-5ZM5 13.1l6.1 3a2 2 0 0 0 1.8 0l6.1-3V17c0 1.1-3.1 3-7 3s-7-1.9-7-3v-3.9Z"/>`,
  code: `<path d="M8.7 6.3a1 1 0 0 1 0 1.4L4.4 12l4.3 4.3a1 1 0 0 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Zm6.6 0a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z"/>`,
};
export const ICON_NAMES = ["brain", "bot", "server", "layout", "db", "cloud", "code", "grad"];
const icon = (name) => `<svg><use href="#i-${ICONS[name] ? name : "code"}"/></svg>`;
const FACT_ICONS = ["pin", "grad", "brain"];

export function render(c, { base = "" } = {}) {
  const s = c.site;
  const p = c.profile;
  const name = `${p.firstName} ${p.lastName}`;
  const url = s.url.replace(/\/?$/, "/");
  const abs = (path) => (/^https?:/.test(path) ? path : url + path.replace(/^\//, ""));
  const wa = `https://wa.me/${p.whatsapp}`;
  const initials = `${p.firstName[0] || ""}${p.lastName[0] || ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name,
        url,
        image: abs(p.photo),
        email: `mailto:${p.email}`,
        jobTitle: p.jobTitle,
        description: p.description,
        worksFor: p.currentEmployer ? { "@type": "Organization", name: p.currentEmployer } : undefined,
        alumniOf: p.school ? { "@type": "CollegeOrUniversity", name: p.school } : undefined,
        address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: p.countryCode },
        knowsLanguage: p.languages,
        knowsAbout: p.keywords,
        sameAs: [p.github, p.linkedin].filter(Boolean),
      },
      {
        "@type": "ProfilePage",
        "@id": `${url}#webpage`,
        url,
        name: s.shareTitle,
        inLanguage: "en",
        mainEntity: { "@id": `${url}#person` },
      },
    ],
  };

  const socials = `
            <li><a href="${esc(p.github)}" target="_blank" rel="noopener me" aria-label="GitHub">${icon("github")}</a></li>
            <li><a href="${esc(p.linkedin)}" target="_blank" rel="noopener me" aria-label="LinkedIn">${icon("linkedin")}</a></li>
            <li><a href="mailto:${esc(p.email)}" aria-label="Email">${icon("mail")}</a></li>`;

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ${base ? `<base href="${esc(base)}">` : ""}
  <script>
    document.documentElement.classList.replace("no-js", "js");
    try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  </script>

  <title>${esc(s.title)}</title>
  <meta name="description" content="${esc(s.description)}">
  <meta name="author" content="${esc(name)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${esc(url)}">

  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="${esc(name)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:title" content="${esc(s.shareTitle)}">
  <meta property="og:description" content="${esc(s.shareDescription)}">
  <meta property="og:image" content="${esc(abs(p.photo))}">
  <meta property="og:image:alt" content="Portrait of ${esc(name)}">
  <meta property="og:locale" content="en_US">
  <meta property="profile:first_name" content="${esc(p.firstName)}">
  <meta property="profile:last_name" content="${esc(p.lastName)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(s.shareTitle)}">
  <meta name="twitter:description" content="${esc(s.shareDescription)}">
  <meta name="twitter:image" content="${esc(abs(p.photo))}">

  <meta name="theme-color" content="#fbfbfd">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${esc(p.photo)}">
  <link rel="manifest" href="site.webmanifest">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Apple devices use SF Pro from the system stack; Inter is the fallback elsewhere -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="preload" as="image" href="${esc(p.photo)}" fetchpriority="high">
  <link rel="stylesheet" href="style.css">

  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body data-email="${esc(p.email)}" data-whatsapp="${esc(p.whatsapp)}" data-form-key="${esc(s.web3formsKey)}">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
${Object.entries(ICONS).map(([k, v]) => `    <symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("\n")}
  </svg>

  <a class="skip-link" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"><span></span></div>

  <header class="nav">
    <div class="container nav-inner">
      <a href="#top" class="logo" aria-label="${esc(name)}, home"><span class="logo-mark">${esc(initials)}</span><span class="logo-text">${esc(name)}</span></a>
      <nav class="nav-links" id="nav-links" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
        <div class="menu-extra">
          <a href="#contact" class="btn">Hire me</a>
          ${p.cv ? `<a href="${esc(p.cv)}" class="btn btn-ghost" download>Download CV</a>` : ""}
        </div>
      </nav>
      <div class="nav-actions">
        <button class="icon-btn theme-toggle" type="button" aria-label="Toggle dark and light theme">
          <svg class="ic-sun"><use href="#i-sun"/></svg><svg class="ic-moon"><use href="#i-moon"/></svg>
        </button>
        <a href="#contact" class="btn btn-sm nav-cta">Hire me</a>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="container hero-grid">
        <div class="hero-text reveal">
          ${p.availability ? `<p class="eyebrow"><span class="dot"></span> ${esc(p.availability)}</p>` : ""}
          <h1 id="hero-title">Hi, I'm <span class="grad">${esc(name)}</span></h1>
          <p class="hero-role">
            <span class="sr-only">${esc(p.roles.join(", "))}.</span>
            <span aria-hidden="true"><span class="typed" data-words="${esc(JSON.stringify(p.roles))}">${esc(p.roles[0] || "")}</span><span class="caret"></span></span>
          </p>
          <p class="lead">${rich(p.intro)}</p>
          <div class="hero-cta">
            <a href="#contact" class="btn">Let's talk ${icon("arrow")}</a>
            ${p.cv ? `<a href="${esc(p.cv)}" class="btn btn-link" download>Download CV ${icon("download")}</a>` : ""}
          </div>
          <ul class="socials" aria-label="Social profiles">${socials}
            <li><a href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("whatsapp")}</a></li>
          </ul>
        </div>
        <div class="hero-photo reveal">
          <div class="photo-frame">
            <img src="${esc(p.photo)}" alt="${esc(name)}, ${esc(p.jobTitle)}" width="1138" height="1600" fetchpriority="high" decoding="async">
          </div>
          <div class="float-card fc-1"><strong>${esc(c.heroCards.statValue)}</strong><span>${esc(c.heroCards.statLabel)}</span></div>
          <div class="float-card fc-2"><code>${esc(c.heroCards.code)}</code><span>${esc(c.heroCards.codeLabel)}</span></div>
          <div class="float-card fc-3">${icon("pin")}<span>${esc(p.city)}, ${esc(p.country)}</span></div>
        </div>
      </div>
      ${c.trusted.length ? `<div class="container">
        <div class="trusted reveal">
          <p>Experience with</p>
          <ul>${c.trusted.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </div>` : ""}
    </section>

    <section id="about" class="section" aria-labelledby="about-title">
      <div class="container about-grid">
        <div class="reveal">
          <p class="section-tag">About me</p>
          <h2 class="section-title" id="about-title">${esc(c.about.title)}</h2>
          <ul class="about-facts">
${list(c.about.facts, (f, i) => `            <li>${icon(FACT_ICONS[i] || "pin")} ${esc(f)}</li>`)}
          </ul>
        </div>
        <div class="reveal">
${list(c.about.paragraphs, (t) => `          <p>${rich(t)}</p>`)}
          <dl class="stats">
${list(c.about.stats, (st) => `            <div><dt>${esc(st.label)}</dt><dd><span class="count" data-to="${Number(st.value) || 0}">${Number(st.value) || 0}</span>${esc(st.suffix)}</dd></div>`)}
          </dl>
        </div>
      </div>
    </section>

    <section id="skills" class="section section-alt" aria-labelledby="skills-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Tech stack</p>
          <h2 class="section-title" id="skills-title">${esc(c.skills.title)}</h2>
          <p class="section-sub">${esc(c.skills.subtitle)}</p>
        </header>
        <div class="skills-grid">
${list(c.skills.groups, (g) => `          <article class="card reveal">
            <div class="card-icon">${icon(g.icon)}</div>
            <h3>${esc(g.title)}</h3>
            ${tags(g.items, "tags")}
          </article>`)}
        </div>
        <div class="marquee reveal" aria-label="Programming languages">
          <ul class="marquee-track">
            ${c.skills.programmingLanguages.map((l) => `<li>${esc(l)}</li>`).join("")}
            ${c.skills.programmingLanguages.map((l) => `<li aria-hidden="true">${esc(l)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </section>

    <section id="experience" class="section" aria-labelledby="exp-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Career</p>
          <h2 class="section-title" id="exp-title">${esc(c.experience.title)}</h2>
        </header>
        <ol class="timeline">
${list(c.experience.items, (x) => `          <li class="reveal">
            <time class="tl-date"${x.startDate ? ` datetime="${esc(x.startDate)}"` : ""}>${esc(x.period)}</time>
            <article class="tl-body">
              <h3>${esc(x.role)} <span>${esc(x.company)}</span></h3>
              <ul>
${list(x.bullets, (b) => `                <li>${rich(b)}</li>`)}
              </ul>
              ${tags(x.tags)}
            </article>
          </li>`)}
        </ol>
${list(c.experience.education, (ed) => `        <div class="edu reveal">
          <div class="card-icon">${icon("grad")}</div>
          <div>
            <h3>${esc(ed.degree)}</h3>
            <p>${esc(ed.school)} · ${esc(ed.period)}</p>
          </div>
        </div>`)}
      </div>
    </section>

    <section id="projects" class="section section-alt" aria-labelledby="projects-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Portfolio</p>
          <h2 class="section-title" id="projects-title">${esc(c.projects.title)}</h2>
          <p class="section-sub">${esc(c.projects.subtitle)}</p>
        </header>
        <div class="filters reveal" role="group" aria-label="Filter projects">
          <button type="button" class="chip active" data-filter="all" aria-pressed="true">All</button>
${list(c.projects.filters, (f) => `          <button type="button" class="chip" data-filter="${esc(f.id)}" aria-pressed="false">${esc(f.label)}</button>`)}
        </div>
        <div class="projects-grid">
${list(c.projects.items, (pr) => `          <article class="project reveal" data-cat="${esc((pr.categories || []).join(" "))}">
            <div class="project-head"><span class="badge">${esc(pr.badge)}</span><span class="year">${esc(pr.year)}</span></div>
            <h3>${esc(pr.title)}</h3>
            <p>${rich(pr.description)}</p>
            ${tags(pr.tags)}
            ${pr.link ? `<a class="project-link" href="${esc(pr.link)}"${ext(pr.link)}>View project ${icon("arrow")}</a>` : ""}
          </article>`)}
        </div>
        <div class="swipe-hint" aria-hidden="true"><span>Swipe to see more →</span><span class="swipe-dots"></span></div>
        <div class="center reveal">
          <a href="${esc(p.github)}?tab=repositories" target="_blank" rel="noopener" class="btn btn-ghost">${icon("github")} See all repositories</a>
        </div>
      </div>
    </section>

    <section class="cta-band" aria-label="Call to action">
      <div class="container cta-inner reveal">
        <div>
          <h2>${esc(c.cta.title)}</h2>
          <p>${esc(c.cta.text)}</p>
        </div>
        <a href="#contact" class="btn btn-light">${esc(c.cta.button)} ${icon("arrow")}</a>
      </div>
    </section>

    <section id="contact" class="section" aria-labelledby="contact-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Contact</p>
          <h2 class="section-title" id="contact-title">${esc(c.contact.title)}</h2>
          <p class="section-sub">${esc(c.contact.subtitle)}</p>
        </header>
        <div class="contact-grid">
          <address class="contact-cards reveal">
            <a class="contact-card" href="mailto:${esc(p.email)}">
              <span class="ci ci-mail">${icon("mail")}</span>
              <span><strong>Email</strong><small>${esc(p.email)}</small></span>
            </a>
            <a class="contact-card" href="${wa}" target="_blank" rel="noopener">
              <span class="ci ci-wa">${icon("whatsapp")}</span>
              <span><strong>WhatsApp</strong><small>${esc(p.whatsappDisplay)}</small></span>
            </a>
            <a class="contact-card" href="${esc(p.linkedin)}" target="_blank" rel="noopener">
              <span class="ci ci-li">${icon("linkedin")}</span>
              <span><strong>LinkedIn</strong><small>${esc(p.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, "").replace(/\/$/, ""))}</small></span>
            </a>
            <div class="contact-card static">
              <span class="ci ci-loc">${icon("pin")}</span>
              <span><strong>Location</strong><small>${esc(p.city)}, ${esc(p.country)}${p.timezone ? ` (${esc(p.timezone)})` : ""}</small></span>
            </div>
          </address>

          <form class="contact-form reveal" id="contact-form" novalidate>
            <div class="row">
              <div class="field">
                <input type="text" id="f-name" name="name" required autocomplete="name" placeholder=" ">
                <label for="f-name">Your name</label>
              </div>
              <div class="field">
                <input type="email" id="f-email" name="email" autocomplete="email" placeholder=" ">
                <label for="f-email">Your email</label>
              </div>
            </div>
            <div class="field">
              <input type="text" id="f-subject" name="subject" placeholder=" ">
              <label for="f-subject">Subject (job, project, collaboration…)</label>
            </div>
            <div class="field">
              <textarea id="f-message" name="message" rows="5" required maxlength="5000" placeholder=" "></textarea>
              <label for="f-message">Your message</label>
            </div>
            <label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
            <p class="form-error" id="form-error" role="alert"></p>
            <p class="form-success" id="form-success" role="status"></p>
            <div class="form-actions">
              <button type="submit" class="btn" data-channel="email" id="send-email">${icon("mail")} <span>Send message</span></button>
              <button type="submit" class="btn btn-wa" data-channel="whatsapp">${icon("whatsapp")} Send via WhatsApp</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </main>

  <div class="floating">
    <a class="to-top" href="#top" aria-label="Back to top">${icon("up")}</a>
    <a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon("whatsapp")}</a>
  </div>

  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <a href="#top" class="logo"><span class="logo-mark">${esc(initials)}</span><span class="logo-text">${esc(name)}</span></a>
        <p>${esc(p.jobTitle)}, based in ${esc(p.city)}, ${esc(p.country)}.</p>
      </div>
      <nav aria-label="Footer">
        <a href="#about">About</a><a href="#skills">Skills</a><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#contact">Contact</a>
      </nav>
      <ul class="socials">${socials}
      </ul>
    </div>
    <div class="container footer-bottom">
      <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(name)}. All rights reserved.</p>
    </div>
  </footer>

  <script src="main.js" defer></script>
</body>
</html>
`;
}
