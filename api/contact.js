// Vercel serverless function: receives the portfolio contact form and sends it through Resend.
// Env vars (set in Vercel project settings):
//   RESEND_API_KEY  required
//   CONTACT_TO      inbox that receives messages (default rifaywassim@gmail.com)
//   CONTACT_FROM    verified sender (default Resend's test sender onboarding@resend.dev)

const ALLOWED_ORIGINS = [
  "https://w2001-rf.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
];

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ALLOWED_ORIGINS.includes(origin)) return res.status(403).json({ error: "Forbidden origin" });

  const { name = "", email = "", subject = "", message = "", website = "" } = req.body || {};

  // Honeypot field: real visitors never fill it, bots usually do
  if (website) return res.status(200).json({ ok: true });

  const clean = {
    name: String(name).trim().slice(0, 100),
    email: String(email).trim().slice(0, 200),
    subject: String(subject).trim().slice(0, 150),
    message: String(message).trim().slice(0, 5000),
  };
  if (!clean.name || !clean.message) return res.status(400).json({ error: "Name and message are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email))
    return res.status(400).json({ error: "A valid email address is required." });

  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "Email service is not configured." });

  const subjectLine = `[Portfolio] ${clean.subject || `New message from ${clean.name}`}`;
  const html = `
    <h2 style="margin:0 0 12px">New message from your portfolio</h2>
    <p><strong>Name:</strong> ${escapeHtml(clean.name)}<br>
       <strong>Email:</strong> <a href="mailto:${escapeHtml(clean.email)}">${escapeHtml(clean.email)}</a><br>
       <strong>Subject:</strong> ${escapeHtml(clean.subject || "(none)")}</p>
    <p style="white-space:pre-wrap;border-left:3px solid #6366f1;padding-left:12px">${escapeHtml(clean.message)}</p>`;
  const text = `Name: ${clean.name}\nEmail: ${clean.email}\nSubject: ${clean.subject || "(none)"}\n\n${clean.message}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO || "rifaywassim@gmail.com"],
        reply_to: clean.email,
        subject: subjectLine,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ error: "The message could not be sent. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend request failed", err);
    return res.status(502).json({ error: "The message could not be sent. Please try again later." });
  }
}
