import { config } from './config.js';
import { createServer } from './server.js';
import { startScheduler } from './scheduler.js';

const app = createServer();

app.listen(config.port, () => {
  console.log(`World Cup Ticket Scout running at http://localhost:${config.port}`);
  console.log(`Polling every ${config.pollIntervalMinutes} minute(s).`);
});

startScheduler(config.pollIntervalMinutes);
