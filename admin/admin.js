// Portfolio admin: edits data/content.json and uploads the photo/CV by committing to the GitHub repo.
// The token never leaves this browser except in requests to api.github.com.
import { render, ICON_NAMES } from "../src/template.mjs";

const CONTENT_PATH = "data/content.json";
const DEFAULTS = { owner: "w2001-RF", repo: "me", branch: "main" };

const SECTIONS = {
  profile: "Profile",
  site: "Site & SEO",
  heroCards: "Hero cards",
  trusted: "Experience with",
  about: "About",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  hire: "Work with me & rate",
  cta: "Call to action",
  certifications: "Certifications",
  contact: "Contact",
};
// Arrays edited as one comma-separated field
const CSV_KEYS = new Set(["tags", "items", "keywords", "languages", "categories", "programmingLanguages"]);
const LONG_KEYS = new Set(["description", "intro", "text", "subtitle", "shareDescription", "paragraphs", "bullets"]);
const READONLY_KEYS = new Set(["photo", "cv"]);
const HELP = {
  paragraphs: "Use **double asterisks** for bold text.",
  bullets: "Use **double asterisks** for bold text.",
  whatsapp: "Digits only, with country code (used for wa.me links).",
  categories: "Comma-separated filter ids, e.g. ai, web, 3d.",
  startDate: "YYYY-MM, used for search engines.",
  photo: "Change it in the Photo & CV panel above.",
  cv: "Change it in the Photo & CV panel above.",
  web3formsKey: "Public key from web3forms.com for the contact form.",
  roles: "Rotating titles shown under your name.",
  link: "Optional URL (GitHub, demo…).",
  price: "Hourly rate as a number, e.g. 25.",
  currency: "Currency code: EUR, USD, MAD…",
  title: "Wrap words in *single asterisks* for the italic accent.",
  headline: "Wrap words in *single asterisks* for the italic accent.",
};

const $ = (id) => document.getElementById(id);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

let content = null;
let contentSha = null;
let dirty = false;
let token = sessionStorage.getItem("gh_token") || store.get("gh_token") || "";
const staged = { photo: null, cv: null };

const cfg = () => ({ owner: $("cfg-owner").value.trim(), repo: $("cfg-repo").value.trim(), branch: $("cfg-branch").value.trim() || "main" });

// ---------- UI helpers ----------
function setStatus(text, kind = "") {
  const el = $("status");
  el.textContent = text;
  el.className = `status ${kind}`;
}
let toastTimer;
function toast(msg, error = false) {
  const el = $("toast");
  el.textContent = msg;
  el.className = `toast show${error ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = "toast"), error ? 7000 : 3500);
}
function markDirty() {
  dirty = true;
  setStatus("Unsaved changes", "dirty");
  $("btn-save").disabled = !token;
}
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== false) el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...children.filter((c) => c !== null && c !== undefined));
  return el;
};

// ---------- base64 ----------
const bytesToB64 = (bytes) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const textToB64 = (text) => bytesToB64(new TextEncoder().encode(text));
const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
const fileToB64 = async (file) => bytesToB64(new Uint8Array(await file.arrayBuffer()));

// ---------- GitHub API ----------
async function gh(path, opts = {}) {
  const { owner, repo } = cfg();
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || `GitHub error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
async function getFile(path) {
  try {
    return await gh(`contents/${path}?ref=${encodeURIComponent(cfg().branch)}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}
async function putFile(path, b64, message, sha) {
  return gh(`contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: b64, branch: cfg().branch, ...(sha ? { sha } : {}) }),
  });
}

// ---------- Load ----------
async function load() {
  setStatus("Loading content…");
  try {
    if (token) {
      const file = await getFile(CONTENT_PATH);
      if (!file) throw new Error(`${CONTENT_PATH} not found on branch "${cfg().branch}"`);
      content = JSON.parse(b64ToText(file.content));
      contentSha = file.sha;
      setStatus(`Connected to ${cfg().owner}/${cfg().repo} (${cfg().branch})`, "ok");
    } else {
      const res = await fetch(`../${CONTENT_PATH}?v=${Date.now()}`);
      if (!res.ok) throw new Error("Could not load content.json");
      content = await res.json();
      contentSha = null;
      setStatus("Read-only: connect with a GitHub token to save changes");
    }
    dirty = false;
    $("btn-save").disabled = true;
    staged.photo = staged.cv = null;
    renderEditor();
    renderFiles();
  } catch (e) {
    setStatus(e.message, "error");
    toast(e.status === 401 ? "The token is invalid or expired." : e.message, true);
  }
}

// ---------- Files panel ----------
function renderFiles() {
  const p = content.profile;
  $("photo-preview").src = staged.photo ? URL.createObjectURL(staged.photo) : `../${p.photo}?v=${Date.now()}`;
  $("photo-path").textContent = p.photo;
  $("photo-staged").textContent = staged.photo ? `New photo ready: ${staged.photo.name}. It uploads when you save.` : "";
  $("cv-link").href = staged.cv ? URL.createObjectURL(staged.cv) : `../${p.cv}`;
  $("cv-link").textContent = p.cv;
  $("cv-staged").textContent = staged.cv ? `New CV ready: ${staged.cv.name}. It uploads when you save.` : "";
}
$("photo-input").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast("Please choose an image under 5 MB.", true);
  staged.photo = f;
  renderFiles();
  markDirty();
});
$("cv-input").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.type !== "application/pdf") return toast("The CV must be a PDF file.", true);
  if (f.size > 20 * 1024 * 1024) return toast("Please choose a PDF under 20 MB.", true);
  staged.cv = f;
  renderFiles();
  markDirty();
});

// ---------- Generic editor ----------
function renderEditor() {
  const editor = $("editor");
  const nav = $("section-nav");
  editor.innerHTML = "";
  nav.innerHTML = "";
  nav.append(h("a", { href: "#connect-panel" }, "GitHub connection"), h("a", { href: "#files-panel" }, "Photo & CV"));
  for (const [key, label] of Object.entries(SECTIONS)) {
    if (!(key in content)) continue;
    const panel = h("section", { class: "panel", id: `sec-${key}` }, h("h2", {}, label));
    panel.append(fieldFor(content, key, label, true));
    editor.append(panel);
    nav.append(h("a", { href: `#sec-${key}` }, label));
  }
}

function fieldFor(parent, key, label = humanize(String(key)), top = false) {
  const value = parent[key];
  const help = HELP[key] ? h("span", { class: "help" }, HELP[key]) : null;

  if (Array.isArray(value)) {
    if (CSV_KEYS.has(key) && value.every((v) => typeof v === "string")) {
      return h("label", {}, label, h("input", {
        value: value.join(", "),
        oninput: (e) => { parent[key] = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); markDirty(); },
      }), help ?? h("span", { class: "help" }, "Comma-separated."));
    }
    return arrayField(parent, key, label, help, top);
  }
  if (value && typeof value === "object") {
    const box = top ? h("div", { class: "fields" }) : h("fieldset", { class: "obj" }, h("legend", {}, label));
    for (const k of Object.keys(value)) box.append(fieldFor(value, k));
    return box;
  }
  if (typeof value === "number") {
    return h("label", {}, label, h("input", { type: "number", value, oninput: (e) => { parent[key] = Number(e.target.value); markDirty(); } }), help);
  }
  if (typeof value === "boolean") {
    return h("label", { class: "check" }, h("input", { type: "checkbox", checked: value, onchange: (e) => { parent[key] = e.target.checked; markDirty(); } }), label);
  }
  if (key === "icon") {
    const sel = h("select", { onchange: (e) => { parent[key] = e.target.value; markDirty(); } },
      ...ICON_NAMES.map((n) => h("option", { value: n, selected: n === value }, n)));
    return h("label", {}, label, sel);
  }
  const long = LONG_KEYS.has(key) || String(value).length > 90;
  const input = long
    ? h("textarea", { rows: Math.min(8, Math.max(3, Math.ceil(String(value).length / 90))) })
    : h("input", { readonly: READONLY_KEYS.has(key) });
  input.value = value ?? "";
  input.addEventListener("input", (e) => { parent[key] = e.target.value; markDirty(); });
  return h("label", {}, label, input, help);
}

// Empty copy of an item, used as a template when adding to a list
const blank = (v) =>
  Array.isArray(v) ? [] : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : typeof v === "number" ? 0 : typeof v === "boolean" ? false : "";

function arrayField(parent, key, label, help, top) {
  const arr = parent[key];
  const wrap = h("div", { class: "arr" });
  const objects = arr.length ? typeof arr[0] === "object" : key === "items" || key === "groups" || key === "stats";
  const rerender = () => wrap.replaceWith(arrayField(parent, key, label, help, top));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; markDirty(); rerender(); };
  const remove = (i) => { if (!confirm("Remove this entry?")) return; arr.splice(i, 1); markDirty(); rerender(); };
  const ctrl = (i) => h("span", { class: "ctrl" },
    h("button", { type: "button", class: "icon-btn", title: "Move up", onclick: (e) => { e.preventDefault(); move(i, -1); } }, "↑"),
    h("button", { type: "button", class: "icon-btn", title: "Move down", onclick: (e) => { e.preventDefault(); move(i, 1); } }, "↓"),
    h("button", { type: "button", class: "icon-btn del", title: "Remove", onclick: (e) => { e.preventDefault(); remove(i); } }, "✕"));

  const addBtn = h("button", {
    type: "button", class: "btn btn-ghost btn-xs",
    onclick: () => { arr.push(arr.length ? blank(arr[0]) : ""); markDirty(); rerender(); },
  }, "+ Add");
  wrap.append(h("div", { class: "arr-head" }, h("span", {}, top ? "" : label, help ? h("span", { class: "help" }, " ", help.textContent) : ""), addBtn));

  arr.forEach((item, i) => {
    if (objects) {
      const title = item.title || item.role || item.label || item.degree || item.id || `Item ${i + 1}`;
      const details = h("details", { class: "item" }, h("summary", {}, h("span", { class: "title" }, title), ctrl(i)));
      const fields = h("div", { class: "fields" });
      for (const k of Object.keys(item)) fields.append(fieldFor(item, k));
      details.append(fields);
      wrap.append(details);
    } else {
      const long = LONG_KEYS.has(key) || String(item).length > 90;
      const input = long ? h("textarea", { rows: 3 }) : h("input");
      input.value = item;
      input.addEventListener("input", (e) => { arr[i] = e.target.value; markDirty(); });
      wrap.append(h("div", { class: "arr-row" }, input, ctrl(i)));
    }
  });
  return wrap;
}

// ---------- Save ----------
async function save() {
  if (!token) return toast("Connect with a GitHub token first.", true);
  const btn = $("btn-save");
  btn.disabled = true;
  try {
    const p = content.profile;
    if (staged.photo) {
      setStatus("Uploading photo…");
      const extn = (staged.photo.name.split(".").pop() || "jpg").toLowerCase().replace("jpeg", "jpg");
      const path = `assets/profile-${Date.now()}.${extn}`;
      await putFile(path, await fileToB64(staged.photo), "Update profile photo via admin");
      p.photo = path;
    }
    if (staged.cv) {
      setStatus("Uploading CV…");
      const path = p.cv && p.cv.startsWith("assets/") ? p.cv : "assets/CV.pdf";
      const existing = await getFile(path);
      await putFile(path, await fileToB64(staged.cv), "Update CV via admin", existing?.sha);
      p.cv = path;
    }
    setStatus("Saving content…");
    const res = await putFile(CONTENT_PATH, textToB64(JSON.stringify(content, null, 2) + "\n"), "Update portfolio content via admin", contentSha);
    contentSha = res.content.sha;
    staged.photo = staged.cv = null;
    dirty = false;
    renderEditor();
    renderFiles();
    setStatus("Saved. The live site updates in about a minute.", "ok");
    toast("Saved! GitHub is rebuilding your site (about 1 minute).");
  } catch (e) {
    btn.disabled = false;
    const msg = e.status === 409 || /sha/i.test(e.message)
      ? "The content changed on GitHub since you loaded it. Reload the page, then redo your edits."
      : e.status === 401 || e.status === 403
        ? "GitHub refused the token. Check it has Contents: Read and write on this repository."
        : e.message;
    setStatus(msg, "error");
    toast(msg, true);
  }
}

// ---------- Preview ----------
function preview() {
  const data = structuredClone(content);
  const base = new URL("../", location.href).href;
  if (staged.photo) data.profile.photo = URL.createObjectURL(staged.photo);
  const html = render(data, { base });
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank");
}

function download() {
  const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" })), download: "content.json" });
  a.click();
}

// ---------- Connection ----------
function initConnection() {
  const saved = JSON.parse(store.get("gh_cfg") || "null") || DEFAULTS;
  $("cfg-owner").value = saved.owner;
  $("cfg-repo").value = saved.repo;
  $("cfg-branch").value = saved.branch;
  $("cfg-token").value = token ? "••••••••" : "";
  $("cfg-remember").checked = !!store.get("gh_token");

  $("btn-connect").addEventListener("click", () => {
    const t = $("cfg-token").value.trim();
    if (t && !t.startsWith("••")) token = t;
    if (!token) return toast("Paste a GitHub token first.", true);
    if (dirty && !confirm("Reloading from GitHub discards your unsaved changes. Continue?")) return;
    store.set("gh_cfg", JSON.stringify(cfg()));
    sessionStorage.setItem("gh_token", token);
    if ($("cfg-remember").checked) store.set("gh_token", token);
    else store.del("gh_token");
    $("cfg-token").value = "••••••••";
    load();
  });
  $("btn-logout").addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem("gh_token");
    store.del("gh_token");
    $("cfg-token").value = "";
    toast("Token removed from this browser.");
    load();
  });
}

$("btn-save").addEventListener("click", save);
$("btn-preview").addEventListener("click", () => content && preview());
$("btn-download").addEventListener("click", () => content && download());
window.addEventListener("beforeunload", (e) => { if (dirty) e.preventDefault(); });

initConnection();
load();
