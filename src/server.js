import express from 'express';
import { nanoid } from 'nanoid';
import { config } from './config.js';
import { getProviderMetadata } from './providers/index.js';
import { publicPath, readJson, writeJson } from './storage.js';
import { getStatus, runCheck } from './scheduler.js';
import { sendAlert } from './alerts/index.js';

function validateWatch(input) {
  const errors = [];
  if (!input.name || !String(input.name).trim()) errors.push('name is required');
  if (!input.query || !String(input.query).trim()) errors.push('query is required');
  if (input.maxPrice != null && Number(input.maxPrice) < 0) errors.push('maxPrice must be positive');
  if (input.quantity != null && Number(input.quantity) < 1) errors.push('quantity must be at least 1');
  return errors;
}

function normalizeWatch(input, existing = {}) {
  const manualUrls = Array.isArray(input.manualUrls)
    ? input.manualUrls.map((value) => String(value).trim()).filter(Boolean)
    : String(input.manualUrls || '').split('\n').map((value) => value.trim()).filter(Boolean);

  const providers = Array.isArray(input.providers)
    ? input.providers
    : String(input.providers || '').split(',').map((value) => value.trim()).filter(Boolean);

  return {
    id: existing.id || nanoid(10),
    name: String(input.name || existing.name || '').trim(),
    query: String(input.query || existing.query || '').trim(),
    city: String(input.city ?? existing.city ?? '').trim(),
    venue: String(input.venue ?? existing.venue ?? '').trim(),
    dateFrom: String(input.dateFrom ?? existing.dateFrom ?? '').trim(),
    dateTo: String(input.dateTo ?? existing.dateTo ?? '').trim(),
    currency: String(input.currency ?? existing.currency ?? 'USD').trim() || 'USD',
    quantity: Number(input.quantity ?? existing.quantity ?? 2),
    maxPrice: Number(input.maxPrice ?? existing.maxPrice ?? 0),
    enabled: input.enabled ?? existing.enabled ?? true,
    providers: providers.length ? providers : (existing.providers || ['ticketmaster', 'seatgeek', 'fifa']),
    manualUrls,
    notes: String(input.notes ?? existing.notes ?? '').trim()
  };
}

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(publicPath()));

  app.get('/api/health', async (_req, res) => {
    res.json({ ok: true, status: getStatus(), providers: getProviderMetadata() });
  });

  app.get('/api/providers', async (_req, res) => {
    res.json(getProviderMetadata());
  });

  app.get('/api/watchlists', async (_req, res) => {
    res.json(await readJson('watchlists', []));
  });

  app.post('/api/watchlists', async (req, res) => {
    const watch = normalizeWatch(req.body || {});
    const errors = validateWatch(watch);
    if (errors.length) return res.status(400).json({ errors });

    const watchlists = await readJson('watchlists', []);
    watchlists.unshift(watch);
    await writeJson('watchlists', watchlists);
    res.status(201).json(watch);
  });

  app.put('/api/watchlists/:id', async (req, res) => {
    const watchlists = await readJson('watchlists', []);
    const index = watchlists.findIndex((watch) => watch.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Watch not found' });

    const next = normalizeWatch(req.body || {}, watchlists[index]);
    const errors = validateWatch(next);
    if (errors.length) return res.status(400).json({ errors });

    watchlists[index] = next;
    await writeJson('watchlists', watchlists);
    res.json(next);
  });

  app.delete('/api/watchlists/:id', async (req, res) => {
    const watchlists = await readJson('watchlists', []);
    const next = watchlists.filter((watch) => watch.id !== req.params.id);
    await writeJson('watchlists', next);
    res.json({ deleted: watchlists.length - next.length });
  });

  app.get('/api/snapshots', async (req, res) => {
    const snapshots = await readJson('snapshots', []);
    const watchId = req.query.watchId;
    const limit = Math.min(Number(req.query.limit || 50), 500);
    const filtered = watchId ? snapshots.filter((snapshot) => snapshot.watchId === watchId) : snapshots;
    res.json(filtered.slice(0, limit));
  });

  app.get('/api/alerts', async (req, res) => {
    const alerts = await readJson('alerts', []);
    const limit = Math.min(Number(req.query.limit || 50), 300);
    res.json(alerts.slice(0, limit));
  });

  app.post('/api/check-now', async (_req, res) => {
    const summary = await runCheck();
    res.json(summary);
  });

  app.post('/api/test-alert', async (_req, res) => {
    const alert = await sendAlert({
      type: 'test',
      subject: 'Ticket Scout test alert',
      body: `This is a test alert from ${config.baseUrl}.`
    });
    res.json(alert);
  });

  return app;
}
