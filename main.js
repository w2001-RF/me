// Contact details come from data/content.json (rendered into <body data-*> at build time)
const { email: EMAIL, whatsapp: WHATSAPP, formKey: WEB3FORMS_KEY = "25ae6517-5af4-4602-92ca-dad5e70ff928" } = document.body.dataset;

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

// Theme toggle: light by default, the visitor's choice is remembered
document.querySelector(".theme-toggle").addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
});

// Navbar: background on scroll, scroll progress, back-to-top, mobile menu
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const progress = document.querySelector(".progress span");
const toTop = document.querySelector(".to-top");

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  nav.classList.toggle("scrolled", y > 10);
  toTop.classList.toggle("show", y > 600);
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// The phone menu covers the screen, so the page behind it must not scroll
const setMenu = (open) => {
  nav.classList.toggle("open", open);
  root.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
const closeMenu = () => setMenu(false);
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && closeMenu());

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
    const open = ul.classList.toggle("expanded");
    btn.setAttribute("aria-expanded", open);
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

// Highlight the nav link of the section in view
const navLinks = [...document.querySelectorAll(".nav-links > a")];
const sectionObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    }),
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

// Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
// Fallback for pages opened on an anchor (e.g. /#projects): reveal whatever is already on screen
const revealInView = () =>
  document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("visible");
  });
window.addEventListener("load", () => setTimeout(revealInView, 100));
window.addEventListener("hashchange", () => setTimeout(revealInView, 600));

// Typing effect for the hero role
const typed = document.querySelector(".typed");
if (typed && !reduceMotion) {
  const words = JSON.parse(typed.dataset.words);
  let w = 0;
  let i = words[0].length;
  let deleting = true;
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
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2600);
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
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }),
  { threshold: 0.6 }
);
document.querySelectorAll(".count").forEach((el) => countObserver.observe(el));

// Spotlight that follows the cursor on cards
document.querySelectorAll(".card, .project").forEach((card) =>
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  })
);

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
    track.scrollTo({ left: 0 });
    updateDots();
  })
);

// Contact form: "Send message" posts to Web3Forms, WhatsApp opens a prefilled chat
const form = document.getElementById("contact-form");
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
    errorBox.textContent = emailMissing
      ? "Please add your email so I can reply to you."
      : "Please enter a valid email address.";
    return;
  }
  email.classList.remove("invalid");
  errorBox.textContent = "";

  const subj = subject.value.trim() || `Portfolio contact from ${name.value.trim()}`;

  if (channel === "whatsapp") {
    const text = `Hello Wassim, I'm ${name.value.trim()}.\n*${subj}*\n\n${message.value.trim()}` +
      (email.value ? `\n\nEmail: ${email.value.trim()}` : "");
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
        from_name: "Wassim Rifay Portfolio",
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
    errorBox.innerHTML = "";
    errorBox.append(
      `${err.message === "Failed to fetch" ? "The message could not be sent." : err.message} You can also `,
      Object.assign(document.createElement("a"), { href: mailto, textContent: "send it from your email app" }),
      " or use WhatsApp."
    );
  } finally {
    sendBtn.disabled = false;
    label.textContent = "Send message";
  }
});
