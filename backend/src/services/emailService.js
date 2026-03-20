// src/services/emailService.js
// Uses Resend HTTP API — no SMTP ports needed. Works on Render free tier.
// Sign up at resend.com, get API key, set RESEND_API_KEY in Render env vars.

const { Resend } = require('resend')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM   = process.env.EMAIL_FROM || 'SkillX <onboarding@resend.dev>'

const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) { printFallback(to, subject, text || html); return }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, text })
    if (error) { console.error(`[Email] ${error.message}`); printFallback(to, subject, text || html) }
  } catch (err) {
    console.error(`[Email] Failed: ${err.message}`)
    printFallback(to, subject, text || html)
  }
}

function printFallback(to, subject, body) {
  const clean = (body || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)
  console.log(`\n${'─'.repeat(50)}\n📧 EMAIL (not sent)\n   To: ${to}\n   Subject: ${subject}\n   Body: ${clean}\n${'─'.repeat(50)}\n`)
}

const base = (content) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0f0e0c;border-radius:16px">
    <div style="margin-bottom:24px">
      <span style="background:#3b82f6;color:#fff;font-weight:800;font-size:14px;padding:6px 14px;border-radius:8px">SkillX</span>
    </div>
    ${content}
    <p style="color:#56524a;font-size:12px;margin-top:24px">You are receiving this because you use SkillX.</p>
  </div>
`

const sendSessionRequestEmail = (teacherEmail, learnerName, skillName, scheduledAt) =>
  sendEmail({
    to: teacherEmail, subject: `New session request from ${learnerName}`,
    text: `${learnerName} wants to learn ${skillName} on ${new Date(scheduledAt).toLocaleString()}.`,
    html: base(`
      <h2 style="color:#f0ede8;font-size:20px;margin:0 0 8px">New session request</h2>
      <p style="color:#9e9a92;font-size:15px;margin:0 0 20px">
        <strong style="color:#f0ede8">${learnerName}</strong> wants to learn
        <strong style="color:#3b82f6">${skillName}</strong>.
      </p>
      <p style="color:#9e9a92;font-size:14px;margin:0 0 28px">📅 ${new Date(scheduledAt).toLocaleString()}</p>
      <a href="${process.env.CLIENT_URL}/sessions" style="background:#3b82f6;color:#fff;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;display:inline-block">View request →</a>
    `),
  })

const sendSessionAcceptedEmail = (learnerEmail, teacherName, skillName, scheduledAt) =>
  sendEmail({
    to: learnerEmail, subject: `Your session with ${teacherName} is confirmed!`,
    text: `${teacherName} accepted your session for ${skillName} on ${new Date(scheduledAt).toLocaleString()}.`,
    html: base(`
      <h2 style="color:#f0ede8;font-size:20px;margin:0 0 8px">Session confirmed!</h2>
      <p style="color:#9e9a92;font-size:15px;margin:0 0 20px">
        <strong style="color:#f0ede8">${teacherName}</strong> accepted your request to learn
        <strong style="color:#3b82f6">${skillName}</strong>.
      </p>
      <p style="color:#9e9a92;font-size:14px;margin:0 0 28px">📅 ${new Date(scheduledAt).toLocaleString()}</p>
      <a href="${process.env.CLIENT_URL}/sessions" style="background:#3b82f6;color:#fff;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;display:inline-block">View session →</a>
    `),
  })

const sendSessionCancelledEmail = (email, cancellerName, skillName, reason) =>
  sendEmail({
    to: email, subject: `Session cancelled`,
    text: `${cancellerName} cancelled the ${skillName} session.${reason ? ` Reason: ${reason}` : ''}`,
    html: base(`
      <h2 style="color:#f0ede8;font-size:20px;margin:0 0 8px">Session cancelled</h2>
      <p style="color:#9e9a92;font-size:15px;margin:0 0 12px">
        <strong style="color:#f0ede8">${cancellerName}</strong> cancelled the
        <strong style="color:#3b82f6">${skillName}</strong> session.
      </p>
      ${reason ? `<p style="color:#9e9a92;font-size:14px;margin:0 0 20px">Reason: ${reason}</p>` : ''}
      <a href="${process.env.CLIENT_URL}/sessions" style="background:#3b82f6;color:#fff;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;display:inline-block">View sessions →</a>
    `),
  })

module.exports = { sendEmail, sendSessionRequestEmail, sendSessionAcceptedEmail, sendSessionCancelledEmail }