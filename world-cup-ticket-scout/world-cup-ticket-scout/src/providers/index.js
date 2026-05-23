import { ticketmasterProvider } from './ticketmaster.js';
import { seatgeekProvider } from './seatgeek.js';
import { fifaProvider } from './fifa.js';
import { manualProvider } from './manual.js';
import { stubhubProvider } from './stubhub.js';

const providers = [ticketmasterProvider, seatgeekProvider, fifaProvider, manualProvider, stubhubProvider];
const providerMap = Object.fromEntries(providers.map((provider) => [provider.id, provider]));

export function getProviders(providerIds = []) {
  const ids = providerIds.length ? providerIds : ['ticketmaster', 'seatgeek', 'fifa'];
  return ids.map((id) => providerMap[id]).filter(Boolean);
}

export function getProviderMetadata() {
  return providers.map((provider) => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled()
  }));
}
