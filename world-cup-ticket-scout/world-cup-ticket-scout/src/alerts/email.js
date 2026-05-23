import nodemailer from 'nodemailer';
import { config } from '../config.js';

export function emailEnabled() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from && config.smtp.to);
}

export async function sendEmailAlert(alert) {
  if (!emailEnabled()) return { skipped: true };

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  return transporter.sendMail({
    from: config.smtp.from,
    to: config.smtp.to,
    subject: alert.subject,
    text: alert.body
  });
}
