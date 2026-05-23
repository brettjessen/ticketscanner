import { config } from '../config.js';
import { normalizeListing } from '../normalizers.js';

export const fifaProvider = {
  id: 'fifa',
  label: 'FIFA Official Resale',
  enabled() {
    return Boolean(config.fifaResaleUrl);
  },
  async search(watch) {
    // FIFA has an official resale/exchange site, but no public price-feed API is documented.
    // This provider deliberately avoids scraping or bypassing bot protection. It adds the official
    // resale link into each snapshot so the dashboard can keep FIFA as the preferred buy route.
    const urls = new Set([config.fifaResaleUrl, ...(watch.manualUrls || [])].filter(Boolean));
    const listings = [...urls].map((url, index) => normalizeListing({
      provider: this.label,
      providerEventId: `official-resale-${index + 1}`,
      title: `${watch.name || watch.query || 'World Cup'} official resale marketplace`,
      url,
      venue: watch.venue || null,
      city: watch.city || null,
      start: watch.dateFrom || null,
      currency: watch.currency || 'USD',
      minPrice: null,
      maxPrice: null,
      allInKnown: true,
      raw: {
        note: 'Price not fetched: official FIFA resale/exchange site has no documented public price-feed API in this MVP.'
      }
    }));

    return {
      provider: this.id,
      status: 'ok',
      message: 'Added official FIFA resale link. No scraping performed.',
      listings
    };
  }
};
