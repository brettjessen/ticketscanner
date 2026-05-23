import { normalizeListing } from '../normalizers.js';

export const manualProvider = {
  id: 'manual',
  label: 'Manual URLs',
  enabled() {
    return true;
  },
  async search(watch) {
    const urls = watch.manualUrls || [];
    const listings = urls.map((url, index) => normalizeListing({
      provider: this.label,
      providerEventId: `manual-${index + 1}`,
      title: `${watch.name || watch.query || 'Event'} marketplace link`,
      url,
      venue: watch.venue || null,
      city: watch.city || null,
      start: watch.dateFrom || null,
      currency: watch.currency || 'USD',
      minPrice: null,
      maxPrice: null,
      raw: {
        note: 'Manual marketplace link. Add a compliant API provider to fetch prices.'
      }
    }));

    return {
      provider: this.id,
      status: 'ok',
      message: `Loaded ${listings.length} manual links`,
      listings
    };
  }
};
