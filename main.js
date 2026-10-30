const EMAIL = "rifaywassim@gmail.com";
const WHATSAPP = "212631367496";
const CONTACT_API = "https://wassim-portfolio-api.vercel.app/api/contact";

document.getElementById("year").textContent = new Date().getFullYear();

// Navbar: border on scroll + mobile menu
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 10), { passive: true });
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  })
);

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Contact form: "Send message" posts to the Resend-backed API, WhatsApp opens a prefilled chat
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
    const res = await fetch(CONTACT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        subject: subject.value,
        message: message.value,
        website: website.value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "The message could not be sent.");
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
