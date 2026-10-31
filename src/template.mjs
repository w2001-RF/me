// Renders the portfolio page from data/content.json.
// Used by scripts/build.mjs (static HTML for GitHub Pages) and by the admin page (live preview).

const esc = (v = "") =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Escaped text with **bold** support
const rich = (v = "") => esc(v).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// Titles: *words* become the italic serif accent
const tt = (v = "") => esc(v).replace(/\*(.+?)\*/g, "<em>$1</em>");

const list = (items = [], fn) => items.map(fn).join("\n");
const tags = (items = [], cls = "tags sm") =>
  items.length ? `<ul class="${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
const ext = (url) => (url ? ` target="_blank" rel="noopener"` : "");

const ICONS = {
  github: `<path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/>`,
  linkedin: `<path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/>`,
  mail: `<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13Zm2.4-.5L12 10.7 19.6 5H4.4ZM20 6.6l-7.4 5.6a1 1 0 0 1-1.2 0L4 6.6v11.9c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V6.6Z"/>`,
  whatsapp: `<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/>`,
  work: `<path d="M9 3h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v4.5a2 2 0 0 1-1.2 1.8L14 17v-1a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1l-6.8-2.7A2 2 0 0 1 2 12.5V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 3h6V5H9v1ZM2 15.6l8 3.1V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.3l8-3.1V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3.4Z"/>`,
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

// Pages of the site. Each one is built as its own static HTML file (good for SEO and direct links);
// main.js then navigates between them without full reloads (SPA-style).
export const PAGES = [
  { id: "home", path: "", label: "Home" },
  { id: "about", path: "about/", label: "About" },
  { id: "skills", path: "skills/", label: "Skills" },
  { id: "experience", path: "experience/", label: "Experience" },
  { id: "projects", path: "projects/", label: "Projects" },
  { id: "contact", path: "contact/", label: "Contact" },
];
const NAV = PAGES.filter((pg) => pg.id !== "home");
const plain = (v = "") => String(v).replace(/\*\*?(.+?)\*\*?/g, "$1");
const clip = (v, n = 158) => (v.length > n ? `${v.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : v);

// root: relative path from the page to the site root ("" for home, "../" for subpages,
// or an absolute path such as "/me/" for the 404 page, which can be served at any depth)
export function renderPage(c, pageId = "home", { base = "", root = "" } = {}) {
  const s = c.site;
  const p = c.profile;
  const name = `${p.firstName} ${p.lastName}`;
  const url = s.url.replace(/\/?$/, "/");
  const page = PAGES.find((pg) => pg.id === pageId) || { id: "404", path: "", label: "Not found" };
  const pageUrl = url + page.path;
  const absUrl = (path) => (/^https?:/.test(path) ? path : url + path.replace(/^\//, ""));
  const u = (path = "") => (/^(https?:|mailto:|data:|blob:|#)/.test(path) ? path : root + path.replace(/^\//, ""));
  const to = (id) => u(PAGES.find((pg) => pg.id === id).path) || "./";
  const wa = `https://wa.me/${p.whatsapp}`;
  const initials = `${p.firstName[0] || ""}${p.lastName[0] || ""}`;
  const H = (level, id, text, cls = "section-title") => `<h${level} class="${cls}" id="${id}">${text}</h${level}>`;
  const first = (id) => (page.id === id ? 1 : 2); // the page's main section uses <h1>

  const meta = {
    home: { title: s.title, description: s.description },
    about: { title: `About ${name} | ${p.jobTitle}`, description: clip(plain(c.about.paragraphs.join(" "))) },
    skills: { title: `Skills & Tools | ${name}`, description: clip(`${c.skills.subtitle} ${c.skills.groups.map((g) => g.title).join(", ")}.`) },
    experience: { title: `Experience | ${name}`, description: clip(`${name}'s professional experience: ${c.experience.items.map((x) => `${x.role} at ${x.company.split("·")[0].trim()}`).join("; ")}.`) },
    projects: { title: `Projects | ${name}`, description: clip(`${c.projects.subtitle} ${c.projects.items.slice(0, 4).map((x) => x.title).join(", ")}.`) },
    contact: { title: `Contact | ${name}`, description: clip(`${c.contact.subtitle} Email, WhatsApp or LinkedIn. Based in ${p.city}, ${p.country}.`) },
    404: { title: `Page not found | ${name}`, description: "This page doesn't exist." },
  }[page.id];
  Object.assign(meta, (c.pages && c.pages[page.id]) || {});
  const ogTitle = page.id === "home" ? s.shareTitle : meta.title;
  const ogDesc = page.id === "home" ? s.shareDescription : meta.description;

  const person = {
    "@type": "Person",
    "@id": `${url}#person`,
    name,
    url,
    image: absUrl(p.photo),
    email: `mailto:${p.email}`,
    jobTitle: p.jobTitle,
    description: p.description,
    worksFor: p.currentEmployer ? { "@type": "Organization", name: p.currentEmployer } : undefined,
    alumniOf: p.school ? { "@type": "CollegeOrUniversity", name: p.school } : undefined,
    address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: p.countryCode },
    knowsLanguage: p.languages,
    knowsAbout: p.keywords,
    sameAs: [p.github, p.linkedin].filter(Boolean),
    hasCredential: ((c.certifications && c.certifications.items) || []).map((ct) => ({
      "@type": "EducationalOccupationalCredential",
      name: ct.title,
      credentialCategory: "certificate",
      recognizedBy: { "@type": "Organization", name: ct.issuer },
      ...(ct.url ? { url: ct.url } : {}),
    })),
  };
  const graph = [person, {
    "@type": page.id === "home" || page.id === "about" ? "ProfilePage" : "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: meta.title,
    description: meta.description,
    inLanguage: "en",
    mainEntity: { "@id": `${url}#person` },
    ...(page.path ? { breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: url },
      { "@type": "ListItem", position: 2, name: page.label, item: pageUrl },
    ] } } : {}),
  }];
  if (page.id === "projects") {
    graph.push({
      "@type": "ItemList",
      name: c.projects.title,
      itemListElement: c.projects.items.map((x, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "CreativeWork", name: x.title, description: plain(x.description), ...(x.image ? { image: absUrl(x.image) } : {}), ...((x.demo || x.link) ? { url: x.demo || x.link } : {}), author: { "@id": `${url}#person` } },
      })),
    });
  }

  const socials = `
            <li><a href="${esc(p.github)}" target="_blank" rel="noopener me" aria-label="GitHub">${icon("github")}</a></li>
            <li><a href="${esc(p.linkedin)}" target="_blank" rel="noopener me" aria-label="LinkedIn">${icon("linkedin")}</a></li>
            <li><a href="mailto:${esc(p.email)}" aria-label="Email">${icon("mail")}</a></li>`;
  const navLinks = NAV.map((pg) => `<a href="${to(pg.id)}"${pg.id === page.id ? ' aria-current="page" class="active"' : ""}>${pg.label}</a>`).join("\n        ");

  /* ---------- Sections ---------- */

  const hero = () => `
    <section class="hero" id="top" aria-labelledby="hero-title">
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="container hero-grid">
        <div class="hero-text reveal">
          <p class="eyebrow"><span class="dot"></span> ${p.roles.slice(0, 3).map((r, i) => `<span${i ? ' class="eb-alt"' : ""}>${esc(r)}</span>`).join("")}</p>
          <h1 id="hero-title"><span class="hero-hi">Hi, I'm <span class="grad hero-name">${esc(name)}</span></span>${p.headline ? ` <span class="hero-statement">${tt(p.headline)}</span>` : ""}</h1>
          <p class="hero-role">
            <span class="sr-only">${esc(p.roles.join(", "))}.</span>
            <span aria-hidden="true"><span class="typed" data-words="${esc(JSON.stringify(p.roles))}">${esc(p.roles[0] || "")}</span><span class="caret"></span></span>
          </p>
          <p class="lead">${rich(p.intro)}</p>
          <ul class="hero-meta" aria-label="At a glance">
            ${p.currentEmployer ? `<li>${icon("work")}<span>${esc(p.jobTitle.replace(/ Software/, ""))} at <strong>${esc(p.currentEmployer)}</strong></span></li>` : ""}
            <li>${icon("pin")}<span>${esc(p.city)}, ${esc(p.country)}</span></li>
            ${p.school ? `<li>${icon("grad")}<span>${esc(p.school)}</span></li>` : ""}
          </ul>
          <div class="hero-cta">
            <a href="${to("contact")}" class="btn">Let's talk ${icon("arrow")}</a>
            <a href="${to("projects")}" class="btn btn-ghost">View my work</a>
            ${p.cv ? `<a href="${esc(u(p.cv))}" class="btn btn-link" download>Download CV ${icon("download")}</a>` : ""}
          </div>
          <ul class="socials" aria-label="Social profiles">${socials}
            <li><a href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("whatsapp")}</a></li>
          </ul>
        </div>
        <div class="hero-photo reveal">
          <div class="photo-ring">
            <div class="photo-frame">
              <img src="${esc(u(p.photo))}" alt="${esc(name)}, ${esc(p.jobTitle)}" width="1138" height="1600" fetchpriority="high" decoding="async">
            </div>
          </div>
          <div class="float-card fc-1"><strong>${esc(c.heroCards.statValue)}</strong><span>${esc(c.heroCards.statLabel)}</span></div>
          <div class="float-card fc-2"><code>${esc(c.heroCards.code)}</code><span>${esc(c.heroCards.codeLabel)}</span></div>
          ${p.availability ? `<p class="avail"><span class="dot"></span> ${esc(p.availability)}</p>` : ""}
        </div>
      </div>
      ${(p.keywords || []).length ? `<div class="tech-strip" aria-label="Core technologies">
        <ul class="marquee-track">
          ${p.keywords.map((k) => `<li>${esc(k)}</li>`).join("")}
          ${p.keywords.map((k) => `<li aria-hidden="true">${esc(k)}</li>`).join("")}
        </ul>
      </div>` : ""}
      ${c.trusted.length ? `<div class="container">
        <div class="trusted reveal">
          <p>Experience with</p>
          <ul>${c.trusted.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </div>` : ""}
    </section>`;

  const stats = () => `
          <dl class="stats">
${list(c.about.stats, (st) => `            <div><dt>${esc(st.label)}</dt><dd><span class="count" data-to="${Number(st.value) || 0}">${Number(st.value) || 0}</span>${esc(st.suffix)}</dd></div>`)}
          </dl>`;

  const about = (teaser = false) => `
    <section class="section${teaser ? " section-alt" : " page-first"}" aria-labelledby="about-title">
      <div class="container about-grid">
        <div class="reveal about-text">
          <p class="section-tag">About me</p>
          ${H(first("about"), "about-title", tt(c.about.title))}
${list(teaser ? c.about.paragraphs.slice(0, 1) : c.about.paragraphs, (t) => `          <p>${rich(t)}</p>`)}
          <ul class="about-facts">
${list(c.about.facts, (f, i) => `            <li>${icon(FACT_ICONS[i] || "pin")} ${esc(f)}</li>`)}
          </ul>
          ${teaser ? `<a class="more-link" href="${to("about")}">More about me ${icon("arrow")}</a>` : ""}
        </div>
        <div class="about-side">
          ${(c.about.services || []).length ? `<div class="services">
${list(c.about.services, (sv) => `            <article class="service reveal">
              <div class="card-icon">${icon(sv.icon)}</div>
              <h3>${esc(sv.title)}</h3>
              <p>${esc(sv.text)}</p>
            </article>`)}
          </div>` : ""}
          <div class="reveal">${stats()}</div>
        </div>
      </div>
    </section>`;

  const education = () => list(c.experience.education, (ed) => `        <div class="edu reveal">
          <div class="card-icon">${icon("grad")}</div>
          <div>
            <h3>${esc(ed.degree)}</h3>
            <p>${esc(ed.school)} · ${esc(ed.period)}</p>
          </div>
        </div>`);

  const certs = c.certifications && c.certifications.items.length ? () => `
    <section class="section" aria-labelledby="certs-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Learning</p>
          ${H(2, "certs-title", tt(c.certifications.title))}
          <p class="section-sub">${esc(c.certifications.subtitle)}</p>
        </header>
        <div class="certs-grid">
${list(c.certifications.items, (ct) => `          <article class="cert reveal">
            ${ct.image ? `<a class="cert-media" href="${esc(u(ct.image))}" data-lightbox="${esc(ct.title)} — ${esc(ct.issuer)}"><img src="${esc(u(ct.image))}" alt="${esc(ct.issuer)} certificate: ${esc(ct.title)}" loading="lazy" width="1200" height="740"></a>` : ""}
            <div class="cert-body">
              <p class="cert-issuer">${esc(ct.issuer)} · ${esc(ct.date)}</p>
              <h3>${esc(ct.title)}</h3>
              ${ct.url ? `<a class="project-link" href="${esc(ct.url)}" target="_blank" rel="noopener">Verify on ${esc(ct.issuer)} ↗</a>` : ""}
            </div>
          </article>`)}
        </div>
      </div>
    </section>` : () => "";

  const languages = (teaser = false) => `
        <div class="marquee reveal" aria-label="Programming languages">
          <ul class="marquee-track">
            ${c.skills.programmingLanguages.map((l) => `<li>${esc(l)}</li>`).join("")}
            ${c.skills.programmingLanguages.map((l) => `<li aria-hidden="true">${esc(l)}</li>`).join("")}
          </ul>
        </div>
        ${teaser ? `<div class="center reveal"><a class="more-link" href="${to("skills")}">Explore my skills in 3D ${icon("arrow")}</a></div>` : ""}`;

  const skills = () => `
    <section class="section section-alt page-first" aria-labelledby="skills-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Tech stack</p>
          ${H(1, "skills-title", tt(c.skills.title))}
          <p class="section-sub">${esc(c.skills.subtitle)}</p>
        </header>
        <div class="universe reveal">
          <div class="universe-head">
            <div>
              <p class="universe-kicker">Interactive · Built with Three.js</p>
              <h2>Skill universe</h2>
            </div>
            <p class="universe-help"><span class="universe-count"></span><span>Drag to rotate · Hover or tap a skill · Pick a field</span></p>
          </div>
          <div class="universe-stage" role="img" aria-label="Interactive 3D network of my skills, grouped by field">
            <canvas></canvas>
            <div class="universe-labels" aria-hidden="true"></div>
            <div class="universe-tip" aria-hidden="true"></div>
            <div class="universe-loading" aria-hidden="true"><span></span>Loading 3D…</div>
          </div>
          <div class="universe-legend" role="group" aria-label="Highlight a field"></div>
        </div>
        <div class="skills-grid">
${list(c.skills.groups, (g) => `          <article class="card reveal">
            <div class="card-icon">${icon(g.icon)}</div>
            <h3>${esc(g.title)}</h3>
            ${tags(g.items, "tags")}
          </article>`)}
        </div>
        ${languages()}
      </div>
    </section>`;

  const experience = () => `
    <section class="section page-first" aria-labelledby="exp-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Career</p>
          ${H(1, "exp-title", tt(c.experience.title))}
        </header>
        <ol class="timeline">
${list(c.experience.items, (x) => `          <li class="reveal">
            <time class="tl-date"${x.startDate ? ` datetime="${esc(x.startDate)}"` : ""}>${esc(x.period)}</time>
            <article class="tl-body">
              <div class="tl-head">
                ${x.logo
                  ? `<img class="co-logo" src="${esc(u(x.logo))}" alt="${esc(x.company.split("·")[0].trim())} logo" width="44" height="44" loading="lazy">`
                  : `<span class="co-logo" style="--co:${esc(x.logoColor || "#6e6e73")}" aria-hidden="true">${esc(x.logoText || "")}</span>`}
                <h2 class="tl-title">${esc(x.role)} <span>${esc(x.company)}</span></h2>
              </div>
              <ul>
${list(x.bullets, (b) => `                <li>${rich(b)}</li>`)}
              </ul>
              ${tags(x.tags)}
              ${(x.gallery || []).length ? `<div class="tl-gallery">${x.gallery.map((g, gi) => `<a href="${esc(u(g))}" data-lightbox="${esc(x.role)} — photo ${gi + 1}"><img src="${esc(u(g))}" alt="${esc(x.role)} at ${esc(x.company.split("·")[0].trim())}, photo ${gi + 1}" loading="lazy"></a>`).join("")}</div>` : ""}
            </article>
          </li>`)}
        </ol>
${education()}
      </div>
    </section>`;

  const projectCard = (pr, i, h = 3) => {
    const primary = pr.demo || pr.link || pr.repo || "";
    return `          <article class="project reveal${pr.image ? " has-image" : ""}" data-cat="${esc((pr.categories || []).join(" "))}" data-index="${i}">
            ${pr.image ? `<div class="project-media">
              <img src="${esc(u(pr.image))}" alt="Screenshot of ${esc(pr.title)}" loading="lazy" decoding="async" width="1280" height="800">
              ${pr.demo ? `<span class="live-badge">Live demo</span>` : ""}
            </div>` : ""}
            <div class="project-body">
              <div class="project-head"><span class="badge">${esc(pr.badge)}</span><span class="year">${esc(pr.year)}</span></div>
              <h${h}>${esc(pr.title)}</h${h}>
              <p>${rich(pr.description)}</p>
              ${tags(pr.tags)}
              <div class="project-actions">
                <button type="button" class="project-open" aria-haspopup="dialog">Details ${icon("arrow")}</button>
                ${pr.demo ? `<a class="project-link" href="${esc(pr.demo)}" target="_blank" rel="noopener">Live demo ↗</a>` : ""}
                ${(pr.repo || pr.link) ? `<a class="project-link" href="${esc(pr.repo || pr.link)}" target="_blank" rel="noopener">${icon("github")} Code</a>` : ""}
              </div>
            </div>
          </article>`;
  };
  // Full project data for the details dialog, embedded so it works on every page
  const projectData = (items) => `<script type="application/json" id="projects-data">${JSON.stringify(items.map((x) => ({ ...x, image: x.image ? u(x.image) : "", gallery: (x.gallery || []).map((g) => u(g)) }))).replace(/</g, "\\u003c")}</script>`;
  const projectDialog = () => `
    <dialog class="project-dialog" aria-labelledby="pd-title">
      <form method="dialog"><button class="pd-close" aria-label="Close">✕</button></form>
      <div class="pd-media"></div>
      <div class="pd-body">
        <div class="project-head"><span class="badge pd-badge"></span><span class="year pd-year"></span></div>
        <h2 id="pd-title"></h2>
        <p class="pd-desc"></p>
        <ul class="pd-highlights"></ul>
        <ul class="tags sm pd-tags"></ul>
        <p class="pd-meta"></p>
        <div class="pd-actions"></div>
      </div>
    </dialog>`;

  const projects = (featured = false) => {
    const flagged = c.projects.items.filter((x) => x.featured);
    const items = featured ? (flagged.length ? flagged : c.projects.items).slice(0, 4) : c.projects.items;
    return `
    <section class="section section-alt${featured ? "" : " page-first"}" aria-labelledby="projects-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Portfolio</p>
          ${H(featured ? 2 : 1, "projects-title", tt(featured ? c.projects.featuredTitle || "Featured *work.*" : c.projects.title))}
          <p class="section-sub">${esc(c.projects.subtitle)}</p>
        </header>
        ${featured ? "" : `<div class="filters reveal" role="group" aria-label="Filter projects">
          <button type="button" class="chip active" data-filter="all" aria-pressed="true">All</button>
${list(c.projects.filters, (f) => `          <button type="button" class="chip" data-filter="${esc(f.id)}" aria-pressed="false">${esc(f.label)}</button>`)}
        </div>`}
        <div class="projects-grid${featured ? " featured-grid" : ""}">
${items.map((pr, i) => projectCard(pr, i, featured ? 3 : 2)).join("\n")}
        </div>
        <div class="swipe-hint" aria-hidden="true"><span>Swipe to see more →</span><span class="swipe-dots"></span></div>
        <div class="center reveal">
          ${featured
            ? `<a href="${to("projects")}" class="btn btn-ghost">See all ${c.projects.items.length} projects ${icon("arrow")}</a>`
            : `<a href="${esc(p.github)}?tab=repositories" target="_blank" rel="noopener" class="btn btn-ghost">${icon("github")} See all repositories</a>`}
        </div>
      </div>
      ${projectData(items)}
      ${projectDialog()}
    </section>`;
  };

  const cta = () => `
    <section class="cta-band" aria-label="Call to action">
      <div class="container cta-inner reveal">
        <div>
          <h2>${tt(c.cta.title)}</h2>
          <p>${esc(c.cta.text)}</p>
        </div>
        <a href="${to("contact")}" class="btn btn-light">${esc(c.cta.button)} ${icon("arrow")}</a>
      </div>
    </section>`;

  const contact = () => `
    <section class="section page-first" aria-labelledby="contact-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="section-tag">Contact</p>
          ${H(1, "contact-title", tt(c.contact.title))}
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
    </section>`;

  const notFound = () => `
    <section class="section page-first not-found" aria-labelledby="nf-title">
      <div class="container center">
        <p class="nf-code grad">404</p>
        ${H(1, "nf-title", "This page doesn't exist")}
        <p class="section-sub">But the rest of my portfolio does.</p>
        <div class="hero-cta"><a class="btn" href="${to("home")}">Back to the homepage ${icon("arrow")}</a><a class="btn btn-link" href="${to("projects")}">See my projects</a></div>
      </div>
    </section>`;

  const body = {
    home: () => hero() + about(true) + `
    <section class="section" aria-labelledby="teaser-title">
      <div class="container">
        <a class="universe-teaser reveal" href="${to("skills")}">
          <div>
            <p class="universe-kicker">Interactive · Built with Three.js</p>
            <h2 class="section-title" id="teaser-title">Explore my skills <em>in 3D.</em></h2>
            <p>${c.skills.groups.reduce((n, g) => n + g.items.length, 0)} skills across ${c.skills.groups.length} fields, laid out as a network you can rotate, hover and filter.</p>
            <span class="btn">Open the skill universe ${icon("arrow")}</span>
          </div>
          <ul class="teaser-orbit" aria-hidden="true">
${list(c.skills.groups, (g, i) => `            <li style="--i:${i};--n:${c.skills.groups.length}">${icon(g.icon)}<span>${esc(g.title)}</span></li>`)}
          </ul>
        </a>
        ${languages()}
      </div>
    </section>` + projects(true) + cta(),
    about: () => about() + `
    <section class="section section-alt" aria-label="Education">
      <div class="container">
${education()}
        <div class="center reveal"><a class="more-link" href="${to("experience")}">See my experience ${icon("arrow")}</a></div>
      </div>
    </section>` + certs() + cta(),
    skills: () => skills() + cta(),
    experience: () => experience() + cta(),
    projects: () => projects() + cta(),
    contact: () => contact(),
    404: () => notFound(),
  }[page.id]();

  return `<!doctype html>
<html lang="en" class="no-js" data-page="${page.id}" data-root="${esc(root)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ${base ? `<base href="${esc(base)}">` : ""}
  <script>
    document.documentElement.classList.replace("no-js", "js");
    let t = null; try { t = localStorage.getItem("theme"); } catch (e) {} document.documentElement.dataset.theme = t || "dark";
  </script>

  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta name="author" content="${esc(name)}">
  <meta name="robots" content="${page.id === "404" ? "noindex" : "index, follow, max-image-preview:large"}">
  <link rel="canonical" href="${esc(pageUrl)}">

  <meta property="og:type" content="${page.id === "home" ? "profile" : "website"}">
  <meta property="og:site_name" content="${esc(name)}">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(ogTitle)}">
  <meta property="og:description" content="${esc(ogDesc)}">
  <meta property="og:image" content="${esc(absUrl(p.photo))}">
  <meta property="og:image:alt" content="Portrait of ${esc(name)}">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(ogTitle)}">
  <meta name="twitter:description" content="${esc(ogDesc)}">
  <meta name="twitter:image" content="${esc(absUrl(p.photo))}">

  <meta name="theme-color" content="#07070b">
  <link rel="icon" href="${u("favicon.svg")}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${esc(u(p.photo))}">
  <link rel="manifest" href="${u("site.webmanifest")}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Apple devices use SF Pro from the system stack; Inter is the fallback elsewhere -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
  ${page.id === "home" ? `<link rel="preload" as="image" href="${esc(u(p.photo))}" fetchpriority="high">` : ""}
  <link rel="stylesheet" href="${u("style.css")}">

  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>
</head>
<body data-email="${esc(p.email)}" data-whatsapp="${esc(p.whatsapp)}" data-form-key="${esc(s.web3formsKey)}">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
${Object.entries(ICONS).map(([k, v]) => `    <symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("\n")}
  </svg>

  <a class="skip-link" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"><span></span></div>
  <div class="route-progress" aria-hidden="true"></div>
  <p class="sr-only" id="route-announcer" aria-live="polite"></p>

  <header class="nav">
    <div class="container nav-inner">
      <a href="${to("home")}" class="logo" aria-label="${esc(name)}, home"><span class="logo-mark">${esc(initials)}</span><span class="logo-text">${esc(name)}</span></a>
      <nav class="nav-links" id="nav-links" aria-label="Primary">
        ${navLinks}
        <div class="menu-extra">
          <a href="${to("contact")}" class="btn">Hire me</a>
          ${p.cv ? `<a href="${esc(u(p.cv))}" class="btn btn-ghost" download>Download CV</a>` : ""}
        </div>
      </nav>
      <div class="nav-actions">
        <button class="icon-btn theme-toggle" type="button" aria-label="Toggle dark and light theme">
          <svg class="ic-sun"><use href="#i-sun"/></svg><svg class="ic-moon"><use href="#i-moon"/></svg>
        </button>
        <a href="${to("contact")}" class="btn btn-sm nav-cta">Hire me</a>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main id="main" tabindex="-1">${body}
    <dialog class="lightbox" aria-label="Image viewer"><form method="dialog"><button class="pd-close" aria-label="Close">✕</button></form><img alt=""><p></p></dialog>
  </main>

  <div class="floating">
    <a class="to-top" href="#main" aria-label="Back to top">${icon("up")}</a>
    <a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon("whatsapp")}</a>
  </div>

  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <a href="${to("home")}" class="logo"><span class="logo-mark">${esc(initials)}</span><span class="logo-text">${esc(name)}</span></a>
        <p>${esc(p.jobTitle)}, based in ${esc(p.city)}, ${esc(p.country)}.</p>
      </div>
      <nav aria-label="Footer">
        ${NAV.map((pg) => `<a href="${to(pg.id)}">${pg.label}</a>`).join("")}
      </nav>
      <ul class="socials">${socials}
      </ul>
    </div>
    <div class="container footer-bottom">
      <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(name)}. All rights reserved.</p>
    </div>
  </footer>

  <script src="${u("main.js")}" defer></script>
  <script type="module" src="${u("scenes.js")}"></script>
</body>
</html>
`;
}

// Kept for the admin preview: renders the home page
export const render = (c, opts = {}) => renderPage(c, "home", opts);
