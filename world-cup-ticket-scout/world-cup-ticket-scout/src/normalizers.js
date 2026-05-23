export function makeDateTimeBounds(watch) {
  const from = watch.dateFrom ? `${watch.dateFrom}T00:00:00Z` : undefined;
  const to = watch.dateTo ? `${watch.dateTo}T23:59:59Z` : undefined;
  return { from, to };
}

export function toMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
}

export function lowerClean(value) {
  return String(value || '').toLowerCase().trim();
}

export function includesLoose(haystack, needle) {
  if (!needle) return true;
  return lowerClean(haystack).includes(lowerClean(needle));
}

export function normalizeListing(input) {
  return {
    provider: input.provider,
    providerEventId: input.providerEventId || null,
    title: input.title || 'Untitled event',
    url: input.url || null,
    venue: input.venue || null,
    city: input.city || null,
    start: input.start || null,
    currency: input.currency || 'USD',
    minPrice: toMoney(input.minPrice),
    maxPrice: toMoney(input.maxPrice),
    allInKnown: Boolean(input.allInKnown),
    section: input.section || null,
    quantityAvailable: input.quantityAvailable ?? null,
    raw: input.raw || null
  };
}

export function sortListings(listings) {
  return [...listings].sort((a, b) => {
    const aPrice = a.minPrice ?? Number.POSITIVE_INFINITY;
    const bPrice = b.minPrice ?? Number.POSITIVE_INFINITY;
    if (aPrice !== bPrice) return aPrice - bPrice;
    return String(a.start || '').localeCompare(String(b.start || ''));
  });
}

export function listingKey(listing) {
  return [listing.provider, listing.providerEventId, listing.title, listing.minPrice, listing.url].join('|');
}
