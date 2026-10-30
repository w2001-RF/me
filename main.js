const EMAIL = "wassim.rifay@uit.ac.ma";
const WHATSAPP = "212631367496";

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

// Contact form: compose the message and open the visitor's email client or WhatsApp
const form = document.getElementById("contact-form");
const errorBox = document.getElementById("form-error");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const channel = e.submitter?.dataset.channel || "email";
  const { name, email, subject, message } = form.elements;

  [name, message].forEach((f) => f.classList.toggle("invalid", !f.value.trim()));
  if (!name.value.trim() || !message.value.trim()) {
    errorBox.textContent = "Please fill in your name and a message.";
    return;
  }
  if (email.value && !email.checkValidity()) {
    email.classList.add("invalid");
    errorBox.textContent = "Please enter a valid email address.";
    return;
  }
  email.classList.remove("invalid");
  errorBox.textContent = "";

  const subj = subject.value.trim() || `Portfolio contact from ${name.value.trim()}`;
  const body =
    `${message.value.trim()}\n\n— ${name.value.trim()}` + (email.value ? `\n${email.value.trim()}` : "");

  if (channel === "whatsapp") {
    const text = `Hello Wassim, I'm ${name.value.trim()}.\n*${subj}*\n\n${message.value.trim()}` +
      (email.value ? `\n\nEmail: ${email.value.trim()}` : "");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  } else {
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }
});
