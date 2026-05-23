const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

function fmtDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function fmtPrice(listing, fallbackCurrency = 'USD') {
  if (!listing || listing.minPrice == null) return 'No price feed';
  return `${listing.currency || fallbackCurrency} ${Number(listing.minPrice).toLocaleString()}`;
}

async function loadHealth() {
  const health = await api('/api/health');
  $('#providers').innerHTML = health.providers.map((provider) => `
    <span class="providerPill ${provider.enabled ? 'enabled' : 'disabled'}">
      ${provider.label}: ${provider.enabled ? 'ready' : 'not configured'}
    </span>
  `).join('');

  const status = health.status || {};
  $('#scannerStatus').innerHTML = `
    <p class="muted">Running: <strong>${status.running ? 'yes' : 'no'}</strong></p>
    <p class="muted">Last run: <strong>${status.lastRun ? fmtDate(status.lastRun) : 'none yet'}</strong></p>
    <p class="muted">Summary: ${status.lastRunSummary ? JSON.stringify(status.lastRunSummary) : 'No checks completed yet.'}</p>
  `;
}

async function loadWatchlist() {
  const watches = await api('/api/watchlists');
  $('#watchlist').innerHTML = watches.length ? watches.map((watch) => `
    <div class="item">
      <div class="itemTop">
        <div>
          <h3>${watch.name}</h3>
          <p class="muted">${watch.query}${watch.city ? ` · ${watch.city}` : ''}${watch.venue ? ` · ${watch.venue}` : ''}</p>
        </div>
        <span class="badge ${watch.enabled ? 'good' : 'warn'}">${watch.enabled ? 'enabled' : 'paused'}</span>
      </div>
      <p>Alert under <span class="price">${watch.currency || 'USD'} ${Number(watch.maxPrice || 0).toLocaleString()}</span> for ${watch.quantity || 1} ticket(s)</p>
      <p class="muted">Providers: ${(watch.providers || []).join(', ') || 'default'}</p>
      <div class="actions">
        <button class="secondary" data-toggle="${watch.id}">${watch.enabled ? 'Pause' : 'Enable'}</button>
        <button class="danger" data-delete="${watch.id}">Delete</button>
      </div>
    </div>
  `).join('') : '<p class="muted">No watches yet.</p>';

  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/api/watchlists/${button.dataset.delete}`, { method: 'DELETE' });
      await refresh();
    });
  });

  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', async () => {
      const watch = watches.find((item) => item.id === button.dataset.toggle);
      await api(`/api/watchlists/${watch.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...watch, enabled: !watch.enabled })
      });
      await refresh();
    });
  });
}

async function loadSnapshots() {
  const snapshots = await api('/api/snapshots?limit=20');
  $('#snapshots').innerHTML = snapshots.length ? snapshots.map((snapshot) => {
    const cheap = snapshot.cheapest;
    const listings = (snapshot.listings || []).filter((listing) => listing.url || listing.minPrice != null).slice(0, 4);
    return `
      <div class="item">
        <div class="itemTop">
          <div>
            <h3>${snapshot.watchName}</h3>
            <p class="muted">Checked ${fmtDate(snapshot.checkedAt)}</p>
          </div>
          <span class="badge ${cheap && cheap.minPrice <= snapshot.maxPrice ? 'good' : 'warn'}">${cheap ? fmtPrice(cheap, snapshot.currency) : 'No price'}</span>
        </div>
        <p class="muted">${snapshot.providerResults.map((result) => `${result.provider}: ${result.status}`).join(' · ')}</p>
        ${listings.map((listing) => `
          <div class="snapshotListing">
            <strong>${listing.title}</strong>
            <span>${listing.provider} · <span class="price">${fmtPrice(listing, snapshot.currency)}</span></span>
            <span class="muted">${[listing.venue, listing.city, fmtDate(listing.start)].filter(Boolean).join(' · ')}</span>
            ${listing.url ? `<a href="${listing.url}" target="_blank" rel="noreferrer">Open marketplace</a>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }).join('') : '<p class="muted">No snapshots yet. Click Check now.</p>';
}

async function refresh() {
  await Promise.all([loadHealth(), loadWatchlist(), loadSnapshots()]);
}

$('#watchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const providers = [...event.currentTarget.elements.providers.selectedOptions].map((option) => option.value);
  const payload = Object.fromEntries(formData.entries());
  payload.providers = providers;
  payload.quantity = Number(payload.quantity || 1);
  payload.maxPrice = Number(payload.maxPrice || 0);
  await api('/api/watchlists', { method: 'POST', body: JSON.stringify(payload) });
  event.currentTarget.reset();
  await refresh();
});

$('#checkNowBtn').addEventListener('click', async () => {
  $('#checkNowBtn').disabled = true;
  try {
    await api('/api/check-now', { method: 'POST' });
    await refresh();
  } finally {
    $('#checkNowBtn').disabled = false;
  }
});

$('#testAlertBtn').addEventListener('click', async () => {
  $('#testAlertBtn').disabled = true;
  try {
    await api('/api/test-alert', { method: 'POST' });
  } finally {
    $('#testAlertBtn').disabled = false;
  }
});

refresh().catch((error) => {
  console.error(error);
  alert(`Failed to load dashboard: ${error.message}`);
});
