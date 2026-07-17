// POST /api/contact — contact-form handler for FixDNS.net.
//
// Flow: validate + sanitize inputs -> verify Cloudflare Turnstile server-side
// (§7) -> send the message via Forward Email SMTP (§6) as a first-party mail
// from noreply@fixdns.net to michal@fixdns.net, Reply-To the submitter.
//
// Runtime secrets (Cloudflare Pages -> encrypted env, set via wrangler):
//   TURNSTILE_SECRET_KEY   Turnstile secret (paired with the site key in the page)
//   SMTP_PASSWORD          Forward Email SMTP password (from Proton Pass)
// Optional overrides: SMTP_USERNAME, CONTACT_RECIPIENT.

// `cloudflare:sockets` is imported lazily inside sendMail so this module also
// loads under plain Node for unit-testing the pure validation/escaping logic.

const WEBSITE_NAME = 'FixDNS.net';
const SMTP_HOST = 'smtp.forwardemail.net';
const SMTP_PORT = 465; // implicit TLS
const FROM = 'noreply@fixdns.net';
const RECIPIENT = 'michal@fixdns.net';

const LIMITS = { name: 120, email: 254, subject: 160, message: 5000 };
// Deliberately conservative — one address, no display name, no CR/LF.
const EMAIL_RE = /^[^\s@<>"'\r\n]{1,64}@[^\s@<>"'\r\n.]+(\.[^\s@<>"'\r\n.]+)+$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.TURNSTILE_SECRET_KEY || !env.SMTP_PASSWORD) {
    return json({ ok: false, error: 'Contact form is not configured yet.' }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  const v = validate(data);
  if (!v.ok) return json({ ok: false, error: v.error }, v.status);
  const { name, email, subject, message, token } = v.fields;

  // --- Turnstile (server-side, §7) ----------------------------------------
  const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY,
    request.headers.get('CF-Connecting-IP'));
  if (!ok) {
    return json({ ok: false, error: 'Challenge failed. Please try again.' }, 403);
  }

  // --- send (§6) ----------------------------------------------------------
  try {
    await sendMail({
      username: env.SMTP_USERNAME || FROM,
      password: env.SMTP_PASSWORD,
      fromName: WEBSITE_NAME,
      from: FROM,
      to: env.CONTACT_RECIPIENT || RECIPIENT,
      replyTo: email,
      subject: `${WEBSITE_NAME}⎯${subject}`,
      html: buildBody(name, email, message),
    });
  } catch (err) {
    return json({ ok: false, error: 'Could not send right now. Please email michal@techguywithabeard.com directly.' }, 502);
  }

  return json({ ok: true });
}

export const onRequestGet = () =>
  new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });

// Pure input validation + sanitization (no I/O) — unit-tested.
export function validate(data) {
  const clean = (val) => (typeof val === 'string' ? val.trim() : '');
  const fields = {
    name: clean(data && data.name),
    email: clean(data && data.email),
    subject: clean(data && data.subject),
    message: clean(data && data.message),
    token: clean(data && (data.token || data['cf-turnstile-response'])),
  };
  if (!fields.name || !fields.email || !fields.subject || !fields.message) {
    return { ok: false, status: 400, error: 'Please fill in every field.' };
  }
  if (fields.name.length > LIMITS.name || fields.email.length > LIMITS.email ||
      fields.subject.length > LIMITS.subject || fields.message.length > LIMITS.message) {
    return { ok: false, status: 400, error: 'One of the fields is too long.' };
  }
  // Header-injection guard: nothing that lands in a mail header may contain CR/LF.
  if (/[\r\n]/.test(fields.email) || /[\r\n]/.test(fields.subject) || !EMAIL_RE.test(fields.email)) {
    return { ok: false, status: 400, error: 'Please enter a valid email address.' };
  }
  if (!fields.token) {
    return { ok: false, status: 400, error: 'Please complete the challenge.' };
  }
  return { ok: true, fields };
}

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await r.json();
    return out.success === true;
  } catch {
    return false;
  }
}

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Exact spec layout: tab after the labels, blank line before the message,
// preserved with white-space:pre. Every user value is HTML-escaped.
export function buildBody(name, email, message) {
  return `<div style="white-space:pre; font-family:system-ui, sans-serif;">Name:\t${escapeHtml(name)}
Email:\t${escapeHtml(email)}

${escapeHtml(message)}</div>`;
}

function b64(str) {
  // UTF-8 safe base64.
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Minimal SMTP-over-TLS client on Cloudflare's socket API (implicit TLS, 465).
async function sendMail({ username, password, from, fromName, to, replyTo, subject, html }) {
  const { connect } = await import('cloudflare:sockets');
  const socket = connect({ hostname: SMTP_HOST, port: SMTP_PORT }, { secureTransport: 'on' });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buffer = '';

  async function readReply() {
    while (true) {
      const lines = buffer.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        // Final line of an SMTP reply is "NNN " (space, not hyphen).
        if (/^\d{3} /.test(lines[i])) {
          const code = parseInt(lines[i].slice(0, 3), 10);
          buffer = lines.slice(i + 1).join('\r\n');
          return { code, text: lines.slice(0, i + 1).join('\n') };
        }
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('SMTP closed');
      buffer += dec.decode(value, { stream: true });
    }
  }
  const say = (cmd) => writer.write(enc.encode(cmd + '\r\n'));
  async function expect(cmd, codes) {
    if (cmd !== null) await say(cmd);
    const r = await readReply();
    if (!codes.includes(r.code)) throw new Error(`SMTP ${r.code}: ${r.text}`);
    return r;
  }

  try {
    await expect(null, [220]);
    await expect(`EHLO fixdns.net`, [250]);
    await expect('AUTH LOGIN', [334]);
    await expect(b64(username), [334]);
    await expect(b64(password), [235]);
    await expect(`MAIL FROM:<${from}>`, [250]);
    await expect(`RCPT TO:<${to}>`, [250, 251]);
    await expect('DATA', [354]);

    const headers = [
      `From: ${fromName} <${from}>`,
      `To: ${to}`,
      `Reply-To: ${replyTo}`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      `Message-ID: <${crypto.randomUUID()}@fixdns.net>`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    ].join('\r\n');
    // base64 body wrapped at 76 cols; base64 never starts a line with '.', so
    // no dot-stuffing needed. Terminate DATA with CRLF '.' CRLF.
    const body = b64(html).replace(/(.{76})/g, '$1\r\n');
    await expect(`${headers}\r\n\r\n${body}\r\n.`, [250]);
    await say('QUIT');
  } finally {
    try { await writer.close(); } catch { /* already closing */ }
  }
}
