import dotenv from 'dotenv';

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: toNumber(process.env.PORT, 3333),
  pollIntervalMinutes: Math.max(1, toNumber(process.env.POLL_INTERVAL_MINUTES, 15)),
  baseUrl: process.env.BASE_URL || 'http://localhost:3333',
  fifaResaleUrl: process.env.FIFA_RESALE_URL || 'https://fwc26-resale-usd.tickets.fifa.com/',
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY || ''
  },
  seatgeek: {
    clientId: process.env.SEATGEEK_CLIENT_ID || '',
    clientSecret: process.env.SEATGEEK_CLIENT_SECRET || ''
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || ''
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.ALERT_EMAIL_FROM || '',
    to: process.env.ALERT_EMAIL_TO || ''
  }
};
