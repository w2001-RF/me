// Site behaviour + client-side router.
// Every page is a real static HTML file (works without JS, good for SEO). With JS, internal links are
// intercepted: the next page is fetched, its <header>/<main>/<footer> are swapped in and the URL is
// updated with the History API, so navigation feels like a single-page app.

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
// Contact details come from data/content.json (rendered into <body data-*> at build time)
const { email: EMAIL, whatsapp: WHATSAPP, formKey: WEB3FORMS_KEY = "" } = document.body.dataset;
// Absolute path of the site root, e.g. "/me/" on GitHub Pages or "/" locally
const ROOT = new URL(root.dataset.root || "./", location.href).pathname;

/* =================================================================== Global (once) */

// Theme toggle: light by default, the visitor's choice is remembered
document.addEventListener("click", (e) => {
  if (!e.target.closest(".theme-toggle")) return;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch (err) {}
});

// Phone menu (covers the screen, so the page behind it must not scroll)
const setMenu = (open) => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;
  nav.classList.toggle("open", open);
  root.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
const closeMenu = () => setMenu(false);
document.addEventListener("click", (e) => {
  if (e.target.closest(".nav-toggle")) setMenu(!document.querySelector(".nav").classList.contains("open"));
  else if (e.target.closest(".nav-links a")) closeMenu();
});
document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && closeMenu());

// Nav background, scroll progress bar and back-to-top button
const onScroll = () => {
  const y = scrollY;
  const max = root.scrollHeight - innerHeight;
  document.querySelector(".nav")?.classList.toggle("scrolled", y > 10);
  document.querySelector(".to-top")?.classList.toggle("show", y > 600);
  const bar = document.querySelector(".progress span");
  if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
};
addEventListener("scroll", onScroll, { passive: true });

/* =================================================================== Per page */

let cleanups = [];
const onCleanup = (fn) => cleanups.push(fn);

function initPage() {
  document.getElementById("year").textContent = new Date().getFullYear();
  onScroll();

  // Reveal on scroll (content is never hidden, it only glides into place)
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }),
    { threshold: 0.12 }
  );
  document.querySelectorAll("main .reveal").forEach((el) => revealObserver.observe(el));
  onCleanup(() => revealObserver.disconnect());

  // Typing effect for the hero role
  const typed = document.querySelector(".typed");
  if (typed && !reduceMotion) {
    const words = JSON.parse(typed.dataset.words);
    let w = 0;
    let i = words[0].length;
    let deleting = true;
    let timer;
    const tick = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 35 : 70;
      if (!deleting && i === word.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && i === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        delay = 300;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 2600);
    onCleanup(() => clearTimeout(timer));
  }

  // Count-up stats
  const countObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countObserver.unobserve(e.target);
        const el = e.target;
        const to = Number(el.dataset.to);
        if (reduceMotion) return;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / 1400, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1 && el.isConnected) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { threshold: 0.6 }
  );
  document.querySelectorAll(".count").forEach((el) => countObserver.observe(el));
  onCleanup(() => countObserver.disconnect());

  // Spotlight + 3D tilt that follow the mouse
  document.querySelectorAll(".card, .project").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".project, .skills-grid .card, .photo-frame").forEach((el) => {
      const max = el.classList.contains("photo-frame") ? 10 : 5;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add("tilt");
        el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(1.02)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
        setTimeout(() => el.classList.remove("tilt"), 200);
      });
    });
  }

  // Phones: show the first two bullets of each job, with a "Show more" toggle
  document.querySelectorAll(".tl-body > ul:not(.tags)").forEach((ul) => {
    const extra = ul.children.length - 2;
    if (extra < 1) return;
    ul.classList.add("collapsible");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "more-btn";
    const label = () => (btn.textContent = ul.classList.contains("expanded") ? "Show less" : `Show ${extra} more`);
    label();
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", ul.classList.toggle("expanded"));
      label();
    });
    ul.after(btn);
  });

  // Phones: projects carousel dots
  const track = document.querySelector(".projects-grid");
  const dots = document.querySelector(".swipe-dots");
  const updateDots = () => {
    if (!track || !dots) return;
    const cards = [...track.querySelectorAll(".project:not(.hidden)")];
    if (dots.children.length !== cards.length) dots.replaceChildren(...cards.map(() => document.createElement("span")));
    const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    const i = Math.min(cards.length - 1, Math.round(track.scrollLeft / step));
    [...dots.children].forEach((d, j) => d.classList.toggle("on", j === i));
  };
  track?.addEventListener("scroll", updateDots, { passive: true });
  updateDots();

  // Project filters
  const chips = document.querySelectorAll(".chip");
  const projects = document.querySelectorAll(".project");
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => {
        c.classList.toggle("active", c === chip);
        c.setAttribute("aria-pressed", c === chip);
      });
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat.split(" ").includes(f);
        p.classList.toggle("hidden", !show);
        if (show) p.classList.add("visible");
      });
      track?.scrollTo({ left: 0 });
      updateDots();
    })
  );

  initProjectDialog();
  initLightbox();
  initContactForm();
}

// Certificates and experience photos open in a full-size viewer (plain links without JS)
function initLightbox() {
  const box = document.querySelector(".lightbox");
  if (!box) return;
  const img = box.querySelector("img");
  const caption = box.querySelector("p");
  document.querySelectorAll("a[data-lightbox]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      img.src = a.href;
      img.alt = a.dataset.lightbox;
      caption.textContent = a.dataset.lightbox;
      box.showModal();
      root.classList.add("dialog-open");
    })
  );
  box.addEventListener("close", () => document.querySelector("dialog[open]") || root.classList.remove("dialog-open"));
  box.addEventListener("click", (e) => e.target !== img && box.close());
  onCleanup(() => box.open && box.close());
}

const make = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids);
  return el;
};

// Project details dialog: flies out of its card in 3D, with a coverflow gallery and a tech-stack sphere
function initProjectDialog() {
  const dialog = document.querySelector(".project-dialog");
  const dataEl = document.getElementById("projects-data");
  if (!dialog || !dataEl) return;
  const items = JSON.parse(dataEl.textContent);
  const $ = (sel) => dialog.querySelector(sel);
  let stopFx = () => {};
  let fromCard = null;
  let closing = false;

  const open = (i, card) => {
    const x = items[i];
    if (!x) return;
    stopFx();
    const shots = [x.image, ...(x.gallery || [])].filter(Boolean);
    const stops = [coverflow(dialog, $(".pd-media"), shots, x.title), tagSphere($(".pd-tags"), x.tags || [])];
    stopFx = () => stops.forEach((stop) => stop && stop());
    $(".pd-badge").textContent = x.badge || "";
    $(".pd-year").textContent = x.year || "";
    $("#pd-title").textContent = x.title;
    $(".pd-desc").innerHTML = "";
    $(".pd-desc").append(...richNodes(x.details || x.description || ""));
    $(".pd-highlights").replaceChildren(...(x.highlights || []).map((h, k) => {
      const li = make("li", {}, ...richNodes(h));
      li.style.setProperty("--delay", `${300 + k * 90}ms`);
      return li;
    }));
    const metaBits = [x.role, x.language, x.stars ? `★ ${x.stars}` : "", x.updated ? `Updated ${x.updated}` : ""].filter(Boolean);
    $(".pd-meta").textContent = metaBits.join(" · ");
    const actions = $(".pd-actions");
    actions.replaceChildren();
    if (x.demo) actions.append(make("a", { className: "btn", href: x.demo, target: "_blank", rel: "noopener", textContent: "Open live demo ↗" }));
    if (x.repo || x.link) actions.append(make("a", { className: "btn btn-ghost", href: x.repo || x.link, target: "_blank", rel: "noopener", textContent: "View the code on GitHub" }));
    fromCard = card;
    dialog.showModal();
    dialog.scrollTop = 0;
    root.classList.add("dialog-open");
    if (!reduceMotion && card) fly(dialog, card, false);
  };

  // Closing flies the dialog back into the card it came from
  const close = async () => {
    if (closing || !dialog.open) return;
    closing = true;
    let anim = null;
    if (!reduceMotion && fromCard?.isConnected && fromCard.offsetParent) {
      anim = fly(dialog, fromCard, true);
      await anim.finished.catch(() => {});
    }
    dialog.close();
    anim?.cancel();
    closing = false;
  };
  $(".pd-close").addEventListener("click", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) root.classList.remove("dialog-open");
    stopFx();
    stopFx = () => {};
  });
  dialog.addEventListener("click", (e) => e.target === dialog && close()); // click on backdrop
  document.querySelectorAll(".project").forEach((card) => {
    const i = Number(card.dataset.index);
    card.querySelector(".project-open")?.addEventListener("click", () => open(i, card));
    card.querySelector(".project-media")?.addEventListener("click", () => open(i, card));
  });
  onCleanup(() => {
    stopFx();
    if (dialog.open) dialog.close();
  });
}

// Moves the dialog between its own position and the card's, turning it in 3D on the way
function fly(el, card, reverse) {
  const a = card.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2);
  const dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const s = Math.max(Math.min(a.width / b.width, 1), 0.2);
  const turn = dx > 0 ? -32 : 32;
  const away = { transform: `translate(${dx}px, ${dy}px) perspective(1400px) rotateY(${turn}deg) rotateX(12deg) scale(${s})`, opacity: 0 };
  const home = { transform: "none", opacity: 1 };
  return el.animate(reverse ? [home, away] : [away, home], {
    duration: reverse ? 420 : 720,
    easing: reverse ? "cubic-bezier(.55, 0, .75, .2)" : "cubic-bezier(.16, .9, .22, 1)",
    fill: reverse ? "forwards" : "none",
  });
}

// 3D coverflow of screenshots: drag or swipe, arrow keys, click a side shot to bring it forward,
// click the front shot to zoom. The front shot tilts toward the pointer with a moving glare.
function coverflow(dialog, media, shots, title) {
  media.replaceChildren();
  media.hidden = !shots.length;
  if (!shots.length) return null;
  const n = shots.length;
  const stage = make("div", { className: "pd-stage" });
  const slides = shots.map((src, j) => {
    const slide = make("button", { type: "button", className: "pd-slide", ariaLabel: `Screenshot ${j + 1} of ${n}, open full size` },
      make("img", { src, alt: `${title}, screenshot ${j + 1}`, decoding: "async", loading: j < 3 ? "eager" : "lazy", draggable: false }),
      make("span", { className: "pd-glare" }));
    stage.append(slide);
    return slide;
  });
  const counter = make("p", { className: "pd-count", ariaLive: "polite" });
  const dots = make("div", { className: "pd-dots" });
  const prev = make("button", { type: "button", className: "pd-nav pd-prev", ariaLabel: "Previous screenshot", textContent: "‹" });
  const next = make("button", { type: "button", className: "pd-nav pd-next", ariaLabel: "Next screenshot", textContent: "›" });
  media.append(stage);
  if (n > 1) media.append(counter, prev, next, dots);

  let active = 0;
  const place = (shift = 0) =>
    slides.forEach((slide, k) => {
      const d = k - active + shift;
      slide.style.setProperty("--d", d.toFixed(3));
      slide.style.setProperty("--ad", Math.abs(d).toFixed(3));
      slide.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
    });
  const go = (j) => {
    active = (j + n) % n;
    place();
    slides.forEach((slide, k) => {
      slide.classList.toggle("on", k === active);
      slide.tabIndex = k === active ? 0 : -1;
    });
    [...dots.children].forEach((dot, k) => dot.classList.toggle("on", k === active));
    counter.textContent = `${active + 1} / ${n}`;
  };
  shots.forEach((_, j) => {
    const dot = make("button", { type: "button", ariaLabel: `Show screenshot ${j + 1}` });
    dot.addEventListener("click", () => go(j));
    dots.append(dot);
  });
  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));

  // Drag / swipe: the whole carousel follows the finger, then snaps to the nearest shot
  let startX = null;
  let moved = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (n < 2 || e.button > 0) return;
    startX = e.clientX;
    moved = 0;
  });
  stage.addEventListener("pointermove", (e) => {
    if (startX !== null) {
      moved = e.clientX - startX;
      if (Math.abs(moved) > 6) {
        if (!stage.classList.contains("dragging")) {
          stage.classList.add("dragging");
          stage.setPointerCapture(e.pointerId);
        }
        place(Math.max(-1.5, Math.min(1.5, moved / (stage.clientWidth * 0.45))));
      }
      return;
    }
    if (!finePointer || reduceMotion) return;
    const slide = slides[active];
    const r = slide.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return untilt();
    slide.classList.add("tilting");
    slide.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
    slide.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    slide.style.setProperty("--gx", `${px * 100}%`);
    slide.style.setProperty("--gy", `${py * 100}%`);
  });
  const untilt = () => slides.forEach((slide) => {
    slide.classList.remove("tilting");
    slide.style.removeProperty("--rx");
    slide.style.removeProperty("--ry");
  });
  const release = () => {
    if (startX === null) return;
    stage.classList.remove("dragging");
    const steps = Math.round(-moved / (stage.clientWidth * 0.45));
    startX = null;
    go(active + (Math.abs(moved) > 40 && !steps ? -Math.sign(moved) : steps));
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", untilt);

  slides.forEach((slide, k) =>
    slide.addEventListener("click", () => {
      if (Math.abs(moved) > 6) return; // that was a drag
      if (k !== active) return go(k);
      const box = document.querySelector(".lightbox");
      if (!box) return;
      box.querySelector("img").src = shots[k];
      box.querySelector("img").alt = `${title}, screenshot ${k + 1}`;
      box.querySelector("p").textContent = `${title} · ${k + 1} / ${n}`;
      box.showModal();
    })
  );
  const onKey = (e) => {
    if (n < 2 || e.target.closest("input, textarea")) return;
    if (e.key === "ArrowLeft") go(active - 1);
    else if (e.key === "ArrowRight") go(active + 1);
  };
  dialog.addEventListener("keydown", onKey);
  go(0);
  return () => dialog.removeEventListener("keydown", onKey);
}

// Tech-stack tags spread over a slowly spinning sphere; drag to spin it, release and it coasts
function tagSphere(list, tags) {
  list.replaceChildren(...tags.map((t) => make("li", { textContent: t })));
  const box = list.closest(".pd-stack");
  if (box) box.hidden = !tags.length;
  list.classList.remove("sphere");
  if (reduceMotion || tags.length < 3) return null;
  list.classList.add("sphere");

  // Even spread on the sphere (golden-angle spiral)
  const pts = [...list.children].map((li, i) => {
    const y = 1 - ((i + 0.5) / tags.length) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.39996;
    return { li, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
  });
  const BASE = 0.006;
  let vx = 0.002;
  let vy = BASE;
  let hover = false;
  let drag = null;
  let frame = 0;
  const spin = (ax, ay) => {
    const [cx, sx, cy, sy] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay)];
    pts.forEach((p) => {
      const x = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y = p.y * cx - z1 * sx;
      p.z = p.y * sx + z1 * cx;
      p.x = x;
      p.y = y;
    });
  };
  const draw = () => {
    const R = Math.min(list.clientWidth, list.clientHeight) / 2 - 26;
    pts.forEach(({ li, x, y, z }) => {
      const depth = (z + 1) / 2; // 0 = back, 1 = front
      li.style.transform = `translate(-50%, -50%) translate3d(${(x * R).toFixed(1)}px, ${(y * R).toFixed(1)}px, 0) scale(${(0.68 + depth * 0.42).toFixed(3)})`;
      li.style.opacity = (0.28 + depth * 0.72).toFixed(2);
      li.style.zIndex = String(Math.round(depth * 100));
    });
  };
  const tick = () => {
    if (!drag) {
      const target = hover ? BASE * 0.25 : BASE;
      vy += (target - vy) * 0.03;
      vx += (0.0015 - vx) * 0.03;
    }
    spin(vx, vy);
    draw();
    frame = requestAnimationFrame(tick);
  };
  list.onpointerenter = () => (hover = true);
  list.onpointerleave = () => (hover = false);
  list.onpointerdown = (e) => {
    drag = { x: e.clientX, y: e.clientY };
    list.setPointerCapture(e.pointerId);
    list.classList.add("grabbing");
  };
  list.onpointermove = (e) => {
    if (!drag) return;
    vy = (e.clientX - drag.x) * 0.006;
    vx = -(e.clientY - drag.y) * 0.006;
    drag = { x: e.clientX, y: e.clientY };
  };
  list.onpointerup = list.onpointercancel = () => {
    drag = null;
    list.classList.remove("grabbing");
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

// Escaped text with **bold** as DOM nodes
function richNodes(text) {
  return String(text).split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? Object.assign(document.createElement("strong"), { textContent: part }) : document.createTextNode(part)));
}

// Contact form: "Send message" posts to Web3Forms, WhatsApp opens a prefilled chat
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const errorBox = document.getElementById("form-error");
  const successBox = document.getElementById("form-success");
  const sendBtn = document.getElementById("send-email");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const channel = e.submitter?.dataset.channel || "email";
    const { name, email, subject, message, website } = form.elements;
    successBox.textContent = "";

    [name, message].forEach((f) => f.classList.toggle("invalid", !f.value.trim()));
    if (!name.value.trim() || !message.value.trim()) {
      errorBox.textContent = "Please fill in your name and a message.";
      return;
    }
    const emailMissing = channel === "email" && !email.value.trim();
    if (emailMissing || (email.value && !email.checkValidity())) {
      email.classList.add("invalid");
      errorBox.textContent = emailMissing ? "Please add your email so I can reply to you." : "Please enter a valid email address.";
      return;
    }
    email.classList.remove("invalid");
    errorBox.textContent = "";

    const subj = subject.value.trim() || `Portfolio contact from ${name.value.trim()}`;

    if (channel === "whatsapp") {
      const text = `Hello, I'm ${name.value.trim()}.\n*${subj}*\n\n${message.value.trim()}` + (email.value ? `\n\nEmail: ${email.value.trim()}` : "");
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      return;
    }

    const label = sendBtn.querySelector("span");
    sendBtn.disabled = true;
    label.textContent = "Sending…";
    try {
      if (!WEB3FORMS_KEY) throw new Error("The message could not be sent.");
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `[Portfolio] ${subj}`,
          from_name: "Portfolio contact form",
          name: name.value.trim(),
          email: email.value.trim(),
          message: message.value.trim(),
          botcheck: website.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error("The message could not be sent.");
      form.reset();
      successBox.textContent = "Thanks! Your message has been sent. I'll get back to you soon.";
    } catch (err) {
      const body = `${message.value.trim()}\n\n— ${name.value.trim()}\n${email.value.trim()}`;
      const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      errorBox.replaceChildren(
        `${err.message === "Failed to fetch" ? "The message could not be sent." : err.message} You can also `,
        Object.assign(document.createElement("a"), { href: mailto, textContent: "send it from your email app" }),
        " or use WhatsApp."
      );
    } finally {
      sendBtn.disabled = false;
      label.textContent = "Send message";
    }
  });
}

function teardownPage() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  document.dispatchEvent(new CustomEvent("page:unmount"));
}

/* =================================================================== Router */

const cache = new Map();

function internalUrl(a) {
  if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith(ROOT)) return null;
  const rest = url.pathname.slice(ROOT.length);
  // Only pages: skip the admin, assets and any file with an extension
  if (/^(admin|assets|src|data)\//.test(rest) || (/\.[a-z0-9]+$/i.test(rest) && !rest.endsWith(".html"))) return null;
  return url;
}

function fetchPage(url) {
  const key = url.pathname;
  if (!cache.has(key)) {
    const req = fetch(url.pathname, { headers: { Accept: "text/html" } }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    req.catch(() => cache.delete(key));
    cache.set(key, req);
  }
  return cache.get(key);
}

const HEAD_SELECTORS = [
  'meta[name="description"]', 'meta[name="robots"]', 'link[rel="canonical"]',
  'meta[property="og:type"]', 'meta[property="og:url"]', 'meta[property="og:title"]', 'meta[property="og:description"]',
  'meta[name="twitter:title"]', 'meta[name="twitter:description"]', 'script[type="application/ld+json"]',
];

let navId = 0;
async function navigate(href, { push = true, replace = false, scroll = 0 } = {}) {
  const url = new URL(href, location.href);
  const id = ++navId;
  root.classList.add("route-loading");
  let html;
  try {
    html = await fetchPage(url);
  } catch {
    location.href = url.href; // let the browser handle it (e.g. the 404 page)
    return;
  }
  if (id !== navId) return; // a newer navigation started meanwhile
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc.querySelector("main")) {
    location.href = url.href;
    return;
  }

  const swap = () => {
    if (push) history[replace ? "replaceState" : "pushState"]({ scroll: 0 }, "", url.href);
    teardownPage();
    closeMenu();
    // Header, main, footer and floating buttons are rendered for this page's depth, so swap them whole
    for (const sel of ["header.nav", "main", "footer.footer", ".floating"]) {
      const next = doc.querySelector(sel);
      document.querySelector(sel)?.replaceWith(document.adoptNode(next));
    }
    document.title = doc.title;
    for (const sel of HEAD_SELECTORS) {
      const next = doc.head.querySelector(sel);
      const cur = document.head.querySelector(sel);
      if (next && cur) cur.replaceWith(document.adoptNode(next));
    }
    root.dataset.page = doc.documentElement.dataset.page;
    root.dataset.root = doc.documentElement.dataset.root;

    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView();
    else scrollTo({ top: scroll, behavior: "instant" });

    initPage();
    document.dispatchEvent(new CustomEvent("page:mount"));
    // Accessibility: move focus to the new content and announce the page
    document.querySelector("main h1")?.setAttribute("tabindex", "-1");
    (document.querySelector("main h1") || document.querySelector("main"))?.focus({ preventScroll: true });
    document.getElementById("route-announcer").textContent = doc.title;
  };

  if (document.startViewTransition && !reduceMotion) await document.startViewTransition(swap).updateCallbackDone;
  else swap();
  root.classList.remove("route-loading");
}

if ("pushState" in history) {
  // The <head> stays across navigations, so its relative links must not depend on the current URL
  document.head.querySelectorAll("link[href]").forEach((l) => l.setAttribute("href", l.href));
  history.scrollRestoration = "manual";
  history.replaceState({ scroll: scrollY }, "");

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    const url = internalUrl(a);
    if (!url) return;
    if (url.pathname === location.pathname) {
      if (url.hash) return; // same-page anchor: let the browser scroll
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
      return;
    }
    e.preventDefault();
    history.replaceState({ ...history.state, scroll: scrollY }, "");
    navigate(url.href);
  });

  // Prefetch pages on hover/touch so navigation is instant
  const prefetch = (e) => {
    const url = internalUrl(e.target.closest?.("a[href]"));
    if (url && url.pathname !== location.pathname) fetchPage(url).catch(() => {});
  };
  document.addEventListener("pointerover", prefetch, { passive: true });
  document.addEventListener("touchstart", prefetch, { passive: true });

  addEventListener("popstate", (e) => navigate(location.href, { push: false, scroll: e.state?.scroll || 0 }));
}

/* =================================================================== Start */

initPage();
// Old one-page links such as /#projects now open the matching page
const legacy = { "#about": "about/", "#skills": "skills/", "#experience": "experience/", "#projects": "projects/", "#contact": "contact/" };
if (root.dataset.page === "home" && legacy[location.hash]) navigate(ROOT + legacy[location.hash], { replace: true });
