import { appendJson } from '../storage.js';
import { sendConsoleAlert } from './console.js';
import { sendTelegramAlert, telegramEnabled } from './telegram.js';
import { sendEmailAlert, emailEnabled } from './email.js';

export async function sendAlert(alert) {
  const record = {
    ...alert,
    createdAt: new Date().toISOString(),
    channels: []
  };

  await sendConsoleAlert(alert);
  record.channels.push('console');

  if (telegramEnabled()) {
    await sendTelegramAlert(alert);
    record.channels.push('telegram');
  }

  if (emailEnabled()) {
    await sendEmailAlert(alert);
    record.channels.push('email');
  }

  await appendJson('alerts', record, 300);
  return record;
}
