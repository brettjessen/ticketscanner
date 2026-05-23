import { config } from '../config.js';
import { makeDateTimeBounds, normalizeListing } from '../normalizers.js';

export const seatgeekProvider = {
  id: 'seatgeek',
  label: 'SeatGeek',
  enabled() {
    return Boolean(config.seatgeek.clientId);
  },
  async search(watch) {
    if (!this.enabled()) {
      return {
        provider: this.id,
        status: 'skipped',
        message: 'Missing SEATGEEK_CLIENT_ID',
        listings: []
      };
    }

    const { from, to } = makeDateTimeBounds(watch);
    const params = new URLSearchParams({
      q: watch.query || 'FIFA World Cup',
      'taxonomies.name': 'sports',
      per_page: '50',
      client_id: config.seatgeek.clientId
    });

    if (config.seatgeek.clientSecret) params.set('client_secret', config.seatgeek.clientSecret);
    if (watch.city) params.set('venue.city', watch.city);
    if (from) params.set('datetime_utc.gte', from);
    if (to) params.set('datetime_utc.lte', to);

    const url = `https://api.seatgeek.com/2/events?${params.toString()}`;
    const response = await fetch(url, {
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`SeatGeek API error ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = await response.json();
    const events = data?.events || [];

    const listings = events.map((event) => {
      const stats = event.stats || {};
      return normalizeListing({
        provider: this.label,
        providerEventId: String(event.id),
        title: event.title || event.short_title,
        url: event.url,
        venue: event.venue?.name,
        city: event.venue?.city,
        start: event.datetime_utc || event.datetime_local,
        currency: watch.currency || 'USD',
        minPrice: stats.lowest_price || stats.lowest_sg_base_price || event.lowest_price,
        maxPrice: stats.highest_price,
        allInKnown: false,
        quantityAvailable: stats.listing_count ?? null,
        raw: {
          score: event.score,
          popularity: event.popularity,
          listing_count: stats.listing_count
        }
      });
    });

    return {
      provider: this.id,
      status: 'ok',
      message: `Found ${listings.length} SeatGeek events`,
      listings
    };
  }
};
