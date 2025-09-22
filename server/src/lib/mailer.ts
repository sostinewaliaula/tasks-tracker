import '../loadEnv';
import nodemailer from 'nodemailer';

console.log('[MAILER] SMTP_HOST:', process.env.SMTP_HOST, 'SMTP_PORT:', process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  return transporter.sendMail({
    from: from || process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
