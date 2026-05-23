# World Cup Ticket Scout

A compliant ticket-price monitor for World Cup matches. It checks API-supported marketplaces, stores snapshots, and alerts you when a watched event drops below your target price.

This is intentionally a **monitor**, not an auto-buying bot. It does not bypass queues, captchas, login walls, rate limits, or ticketing security controls.

## What it does

- Tracks multiple match watches from a browser dashboard.
- Checks Ticketmaster Discovery API when configured.
- Checks SeatGeek API when configured.
- Keeps FIFA official resale/exchange marketplace links visible as the preferred buying path.
- Sends alerts to console, Telegram, and optionally email.
- Stores watchlists, snapshots, and alert history as local JSON files.
- Can run locally, on a VPS, or on a long-running host like Railway, Render, Fly.io, or an always-on Replit deployment.

## What it does not do

- It does not automatically purchase tickets.
- It does not scrape protected marketplace pages.
- It does not bypass bot protection, waiting rooms, captchas, account requirements, or purchasing limits.
- It does not guarantee that the listed price is all-in unless the provider explicitly indicates that.

## Providers included

### Ticketmaster

Uses the Ticketmaster Discovery API. Add `TICKETMASTER_API_KEY` in `.env`.

### SeatGeek

Uses the SeatGeek events API. Add `SEATGEEK_CLIENT_ID` and optionally `SEATGEEK_CLIENT_SECRET` in `.env`.

### FIFA official resale/exchange

The app includes the official FIFA resale/exchange URL in snapshots so you can quickly open the safest buy route. This MVP does not scrape FIFA's marketplace because no documented public price-feed API is exposed in the official resale page.

### StubHub placeholder

A placeholder adapter is included in `src/providers/stubhub.js`. StubHub uses OAuth and may require approved API access. Wire approved credentials there if you receive access.

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

Open:

```text
http://localhost:3333
```

## Configure API keys

Open `.env` and add any keys you have:

```bash
TICKETMASTER_API_KEY=your_ticketmaster_key
SEATGEEK_CLIENT_ID=your_seatgeek_client_id
SEATGEEK_CLIENT_SECRET=your_seatgeek_client_secret
```

Then restart:

```bash
npm start
```

## Telegram alerts

1. Open Telegram.
2. Message `@BotFather` and create a bot.
3. Copy the bot token into `.env`:

```bash
TELEGRAM_BOT_TOKEN=123456:abc...
```

4. Get your chat ID. The simplest path is to message your new bot once, then open:

```text
https://api.telegram.org/botYOUR_TOKEN/getUpdates
```

5. Put the chat ID in `.env`:

```bash
TELEGRAM_CHAT_ID=123456789
```

6. Restart and click **Test alert** in the dashboard.

## Email alerts

Add SMTP settings to `.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
ALERT_EMAIL_FROM=you@gmail.com
ALERT_EMAIL_TO=you@gmail.com
```

Then restart and click **Test alert**.

## Add a watch

Use the dashboard fields:

- **Name:** Friendly label, for example `USA group match - Kansas City`.
- **Search query:** Marketplace search, for example `FIFA World Cup 2026 USA`.
- **City / Venue:** Optional filters.
- **Date from / Date to:** Narrow the event date.
- **Quantity:** Your needed ticket count.
- **Max price:** Alert threshold.
- **Providers:** Select Ticketmaster, SeatGeek, FIFA, manual, or placeholders.
- **Manual URLs:** Add FIFA official resale page, Vivid Seats page, StubHub page, etc. These are saved as quick-open links unless you add a compliant provider adapter.

## Run one check from terminal

```bash
npm run check
```

## Deploy notes

Use a long-running host for the poller:

- Railway
- Render Web Service
- Fly.io
- VPS
- Replit always-on deployment

Vercel is not ideal for this exact version because the app uses a long-running interval and local JSON storage. For Vercel, split the project into:

- A hosted database such as Supabase.
- API routes.
- A scheduled cron endpoint.
- A static frontend.

## File overview

```text
src/index.js              Starts server and scheduler
src/server.js             Express API and dashboard routes
src/scheduler.js          Polling, snapshots, and alert threshold logic
src/providers/            Marketplace adapters
src/alerts/               Console, Telegram, and email alerts
public/                   Browser dashboard
data/watchlists.json      Saved watches
data/snapshots.json       Price snapshots
data/alerts.json          Alert history
```

## Safety/compliance boundary

This app is designed for price intelligence and alerting only. Do not modify it to bypass ticketing platform access controls, purchasing limits, queues, captchas, device checks, or other security mechanisms.
