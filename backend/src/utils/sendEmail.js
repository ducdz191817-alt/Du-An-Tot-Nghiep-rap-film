require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, html, text }) {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  const smtpPass = smtpPassRaw.replace(/\s+/g, ''); // Strip all spaces from app password
  const smtpSecure = (process.env.SMTP_SECURE || process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

  if (!smtpUser || !smtpPass) {
    console.log('\n======================================================');
    console.log('⚠️ [SMTP CHƯA ĐƯỢC CẤU HÌNH TRONG .ENV]');
    console.log('------------------------------------------------------');
    console.log(`📬 Gửi tới Email: ${to}`);
    console.log(`📌 Tiêu đề: ${subject}`);
    if (text) console.log(`🔗 Link / Content:\n${text}`);
    console.log('👉 Hướng dẫn: Thêm SMTP_USER và SMTP_PASS vào file backend/.env để gửi email thực sự vào hộp thư Gmail.');
    console.log('======================================================\n');
    return { skipped: true };
  }

  const transporterOptions = (smtpHost && smtpHost.includes('gmail')) || (!smtpHost && smtpUser.endsWith('@gmail.com'))
    ? {
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      }
    : {
        host: smtpHost || 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      };

  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Nova Cinema <${smtpUser}>`,
    to,
    subject,
    text: text || 'Vui lòng xem email bằng trình duyệt hỗ trợ HTML.',
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = sendEmail;
