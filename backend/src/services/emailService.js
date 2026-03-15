// src/services/emailService.js
const nodemailer = require('nodemailer')
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../config/env')

const isConfigured = !!(EMAIL_USER && EMAIL_PASS)

let transporter = null

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: EMAIL_PORT || 587,
    secure: false,          // use STARTTLS, not SSL
    requireTLS: true,       // force upgrade to TLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,     // must be Gmail App Password (16 chars, no spaces)
    },
    tls: {
      rejectUnauthorized: false, // avoids cert issues in dev
    },
  })

  // Verify on startup — prints result to terminal so you know instantly
  transporter.verify((err) => {
    if (err) {
      console.error(`❌  Email transporter error: ${err.message}`)
      console.error('    → Check EMAIL_USER and EMAIL_PASS in .env')
      console.error('    → EMAIL_PASS must be a Gmail App Password (myaccount.google.com/apppasswords)')
      console.error('    → Remove all spaces from the app password')
    } else {
      console.log(`✅  Email transporter ready (${EMAIL_USER})`)
    }
  })
}

// ── Core send — never throws, always falls back to terminal ──────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    printFallback(to, subject, text || html)
    return
  }
  try {
    await transporter.sendMail({
      from: EMAIL_FROM || `"SkillX" <${EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    })
    console.log(`✅  Email sent → ${to} | ${subject}`)
  } catch (err) {
    console.error(`❌  Email send failed: ${err.message}`)
    printFallback(to, subject, text || html)
  }
}

function printFallback(to, subject, body) {
  const clean = (body || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 400)
  console.log('\n' + '─'.repeat(55))
  console.log('📧  EMAIL FALLBACK (not sent — copy OTP from here)')
  console.log(`    To:      ${to}`)
  console.log(`    Subject: ${subject}`)
  console.log(`    Body:    ${clean}`)
  console.log('─'.repeat(55) + '\n')
}

// ── Templates ─────────────────────────────────────────────────────────────────
const sendVerificationEmail = (email, otp) =>
  sendEmail({
    to: email,
    subject: 'Your SkillX verification code',
    text: `Your SkillX verification code is: ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0f0e0c;border-radius:16px">
        <div style="margin-bottom:28px">
          <span style="background:#ff7d11;color:#000;font-weight:800;font-size:14px;padding:6px 14px;border-radius:8px;letter-spacing:-0.5px">SkillX</span>
        </div>
        <h2 style="color:#f0ede8;font-size:22px;margin:0 0 8px">Verify your email</h2>
        <p style="color:#9e9a92;font-size:15px;margin:0 0 28px">Enter this code to activate your account:</p>
        <div style="background:#1e1c18;border:1px solid rgba(255,125,17,0.25);border-radius:14px;padding:28px;text-align:center">
          <span style="letter-spacing:12px;font-size:42px;font-weight:800;color:#ff7d11;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#56524a;font-size:13px;margin-top:20px">Expires in 10 minutes. If you didn't sign up for SkillX, ignore this email.</p>
      </div>
    `,
  })

const sendPasswordResetEmail = (email, otp) =>
  sendEmail({
    to: email,
    subject: 'Reset your SkillX password',
    text: `Your SkillX password reset code is: ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0f0e0c;border-radius:16px">
        <div style="margin-bottom:28px">
          <span style="background:#ff7d11;color:#000;font-weight:800;font-size:14px;padding:6px 14px;border-radius:8px">SkillX</span>
        </div>
        <h2 style="color:#f0ede8;font-size:22px;margin:0 0 8px">Reset your password</h2>
        <p style="color:#9e9a92;font-size:15px;margin:0 0 28px">Use this code to set a new password:</p>
        <div style="background:#1e1c18;border:1px solid rgba(255,125,17,0.25);border-radius:14px;padding:28px;text-align:center">
          <span style="letter-spacing:12px;font-size:42px;font-weight:800;color:#ff7d11;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#56524a;font-size:13px;margin-top:20px">Expires in 10 minutes.</p>
      </div>
    `,
  })

const sendSessionRequestEmail = (teacherEmail, learnerName, skillName, scheduledAt) =>
  sendEmail({
    to: teacherEmail,
    subject: `New session request from ${learnerName}`,
    text: `${learnerName} wants to learn ${skillName} with you on ${new Date(scheduledAt).toLocaleString()}.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#0f0e0c;border-radius:16px">
        <div style="margin-bottom:28px">
          <span style="background:#ff7d11;color:#000;font-weight:800;font-size:14px;padding:6px 14px;border-radius:8px">SkillX</span>
        </div>
        <h2 style="color:#f0ede8;font-size:22px;margin:0 0 8px">New session request</h2>
        <p style="color:#9e9a92;font-size:15px;margin:0 0 20px">
          <strong style="color:#f0ede8">${learnerName}</strong> wants to learn
          <strong style="color:#ff7d11">${skillName}</strong> with you.
        </p>
        <p style="color:#9e9a92;font-size:14px;margin:0 0 28px">
          📅 ${new Date(scheduledAt).toLocaleString()}
        </p>
        <a href="${process.env.CLIENT_URL}/sessions"
          style="background:#ff7d11;color:#000;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;display:inline-block">
          View request →
        </a>
      </div>
    `,
  })

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSessionRequestEmail,
}