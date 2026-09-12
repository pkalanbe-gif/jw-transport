// TEMPORARY diagnostic: verifies the Gmail SMTP login works after rotating the
// app password. Sends nothing and never echoes the credentials — only whether
// the handshake succeeded. Delete once the mail flow is confirmed.
const nodemailer = require('nodemailer');

exports.handler = async () => {
  const user = process.env.EMAIL_USER || '';
  if (!user || !process.env.EMAIL_PASS) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'EMAIL_USER or EMAIL_PASS not set' }) };
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: process.env.EMAIL_PASS }
  });
  try {
    await transporter.verify();
    return { statusCode: 200, body: JSON.stringify({ ok: true, account: user }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, account: user, error: String(e.message || e).slice(0, 300) }) };
  }
};
