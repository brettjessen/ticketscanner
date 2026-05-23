import { config } from '../config.js';
import { makeDateTimeBounds, normalizeListing } from '../normalizers.js';

export const ticketmasterProvider = {
  id: 'ticketmaster',
  label: 'Ticketmaster',
  enabled() {
    return Boolean(config.ticketmaster.apiKey);
  },
  async search(watch) {
    if (!this.enabled()) {
      return {
        provider: this.id,
        status: 'skipped',
        message: 'Missing TICKETMASTER_API_KEY',
        listings: []
      };
    }

    const { from, to } = makeDateTimeBounds(watch);
    const params = new URLSearchParams({
      apikey: config.ticketmaster.apiKey,
      keyword: watch.query || 'FIFA World Cup',
      classificationName: 'sports',
      size: '50',
      sort: 'date,asc'
    });

    if (watch.city) params.set('city', watch.city);
    if (from) params.set('startDateTime', from);
    if (to) params.set('endDateTime', to);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    const response = await fetch(url, {
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Ticketmaster API error ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = await response.json();
    const events = data?._embedded?.events || [];

    const listings = events.map((event) => {
      const venue = event?._embedded?.venues?.[0] || {};
      const priceRange = Array.isArray(event.priceRanges) ? event.priceRanges[0] : null;
      const date = event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null;
      return normalizeListing({
        provider: this.label,
        providerEventId: event.id,
        title: event.name,
        url: event.url,
        venue: venue.name,
        city: venue.city?.name,
        start: date,
        currency: priceRange?.currency || watch.currency || 'USD',
        minPrice: priceRange?.min,
        maxPrice: priceRange?.max,
        allInKnown: Boolean(event.allInclusivePricing),
        raw: {
          source: 'Ticketmaster Discovery API',
          locale: event.locale,
          status: event?.dates?.status?.code
        }
      });
    });

    return {
      provider: this.id,
      status: 'ok',
      message: `Found ${listings.length} Ticketmaster events`,
      listings
    };
  }
};
