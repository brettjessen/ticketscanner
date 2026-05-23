import { config } from '../config.js';

export function telegramEnabled() {
  return Boolean(config.telegram.token && config.telegram.chatId);
}

export async function sendTelegramAlert(alert) {
  if (!telegramEnabled()) return { skipped: true };

  const text = `${alert.subject}\n\n${alert.body}`.slice(0, 3900);
  const response = await fetch(`https://api.telegram.org/bot${config.telegram.token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text,
      disable_web_page_preview: false
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram alert failed ${response.status}: ${body.slice(0, 180)}`);
  }

  return response.json();
}
