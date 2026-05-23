import { getProviders } from './providers/index.js';
import { appendJson, readJson } from './storage.js';
import { listingKey, sortListings } from './normalizers.js';
import { sendAlert } from './alerts/index.js';

let running = false;
let lastRun = null;
let lastRunSummary = null;
const alertDedup = new Set();

function isCheapEnough(watch, listing) {
  if (!watch.maxPrice || listing.minPrice == null) return false;
  return Number(listing.minPrice) <= Number(watch.maxPrice);
}

function buildAlert(watch, listing) {
  const priceText = listing.minPrice == null
    ? 'Price unavailable'
    : `${listing.currency || watch.currency || 'USD'} ${listing.minPrice}`;

  return {
    type: 'price_threshold',
    watchId: watch.id,
    listingKey: listingKey(listing),
    subject: `Ticket price alert: ${watch.name}`,
    body: [
      `${listing.title}`,
      `Provider: ${listing.provider}`,
      `Price: ${priceText}`,
      listing.venue ? `Venue: ${listing.venue}` : null,
      listing.city ? `City: ${listing.city}` : null,
      listing.start ? `Date: ${listing.start}` : null,
      watch.quantity ? `Desired quantity: ${watch.quantity}` : null,
      watch.maxPrice ? `Your max price: ${watch.currency || listing.currency || 'USD'} ${watch.maxPrice}` : null,
      listing.allInKnown ? 'All-in pricing: known/indicated by provider' : 'All-in pricing: not confirmed',
      listing.url ? `Open: ${listing.url}` : null
    ].filter(Boolean).join('\n')
  };
}

export async function checkWatch(watch) {
  const selectedProviders = getProviders(watch.providers || []);
  const providerResults = [];
  const listings = [];

  for (const provider of selectedProviders) {
    try {
      const result = await provider.search(watch);
      providerResults.push({ provider: provider.id, status: result.status, message: result.message });
      listings.push(...(result.listings || []));
    } catch (error) {
      providerResults.push({ provider: provider.id, status: 'error', message: error.message });
    }
  }

  const sorted = sortListings(listings);
  const cheapest = sorted.find((listing) => listing.minPrice != null) || null;

  const snapshot = {
    id: `${watch.id}-${Date.now()}`,
    watchId: watch.id,
    watchName: watch.name,
    checkedAt: new Date().toISOString(),
    query: watch.query,
    maxPrice: watch.maxPrice,
    currency: watch.currency || 'USD',
    providerResults,
    cheapest,
    listings: sorted.slice(0, 100)
  };

  await appendJson('snapshots', snapshot, 500);

  for (const listing of sorted) {
    if (!isCheapEnough(watch, listing)) continue;
    const dedupKey = `${watch.id}:${listingKey(listing)}`;
    if (alertDedup.has(dedupKey)) continue;
    alertDedup.add(dedupKey);
    await sendAlert(buildAlert(watch, listing));
  }

  return snapshot;
}

export async function runCheck({ includeDisabled = false } = {}) {
  if (running) return { status: 'already_running', lastRun, lastRunSummary };
  running = true;
  const startedAt = new Date().toISOString();
  const watchlists = await readJson('watchlists', []);
  const active = watchlists.filter((watch) => includeDisabled || watch.enabled !== false);
  const snapshots = [];

  try {
    for (const watch of active) {
      snapshots.push(await checkWatch(watch));
    }

    lastRun = new Date().toISOString();
    lastRunSummary = {
      status: 'ok',
      startedAt,
      finishedAt: lastRun,
      watchesChecked: active.length,
      snapshots: snapshots.length
    };
    return lastRunSummary;
  } finally {
    running = false;
  }
}

export function startScheduler(intervalMinutes) {
  setTimeout(() => runCheck().catch((error) => console.error('Initial ticket check failed:', error)), 1000);
  const timer = setInterval(() => {
    runCheck().catch((error) => console.error('Scheduled ticket check failed:', error));
  }, intervalMinutes * 60 * 1000);
  return timer;
}

export function getStatus() {
  return { running, lastRun, lastRunSummary };
}
