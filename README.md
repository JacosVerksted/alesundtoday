https://alesundtoday.jacosverksted.no/

# Visit Ålesund

**Is today a good day to visit Ålesund?**

Ålesund is one of Norway's most beautiful cities — but on busy cruise ship days, the narrow streets and harbour front can be packed with thousands of extra visitors. A single large ship can bring more than 4,000 passengers into a city of 50,000 people.

This app helps you plan your visit. Check any date to see which cruise ships are in port, when, how crowded it's likely to be, and which upcoming days are the quietest.

> Unofficial, independent project — not affiliated with Ålesund kommune or Ålesund Havn. Schedules may change; check with the port.

## Features

**Planning**
- **Today's status** at a glance: a colour-coded level from quiet (green) to very busy (red), the number of ships in port, and a chip per ship (tap for capacity and an estimate of the visitors it adds).
- **Arrival and departure times and berths** for every ship, read from the port's mooring plan: an "In port 07:00–17:00" summary and one line per ship (`07:00–16:00 AIDAnova · Prestebrygga`). Overnight stays are marked `(+1)`.
- **Pick any day.** Tap a day in the calendar or the 14-day strip to preview it in the status card ("It will be …"); "← Today" returns.
- **14-day strip** and a **two-month calendar** with a legend (quiet, moderate under 3k passengers, busy 3–6k, very busy 6k+).
- **Best upcoming days**: the quietest days in the next 90 days, ranked by expected passengers, at least three days apart.
- **Weather**: 7-day forecast from MET Norway (Yr), fetched when the site is built.
- **Live webcam** link to the port's harbour camera.
- **Share** button: the device's share sheet where available, otherwise it copies the link.

**Unpublished and off-season dates**
- The port publishes its plan in monthly batches, roughly 4–8 weeks ahead. Future dates beyond what is published are **not** shown as "quiet": they are greyed out and struck through in the calendar, shown as a dashed card in the 14-day strip, and read "Schedule not available yet" in the status card. "Best upcoming days" skips them.
- When no cruise call is scheduled from today onwards, an **off-season notice** appears under the status card.

**Everywhere**
- **Six languages**: English, Norwegian (Bokmål and Nynorsk), German, Dutch and French. First-time visitors get their browser's language; the menu choice always wins and is remembered.
- **Dark mode** that follows the device setting.
- **Installable as an app** (PWA) on Android, iOS ("Add to Home Screen" hint) and desktop, with a service worker so a returning visitor still gets the page when offline.
- **Date rollover**: if a page stays open past midnight, it repaints itself for the new day.
- **Link previews** (Open Graph / Twitter tags and a preview image) and a canonical URL.

## How the busyness level works

Level is based on the **total passenger capacity (PAX) in port** that day, not the number of ships — one mega-ship can outweigh several small coastal vessels:

| Total PAX in port | Level |
| --- | --- |
| no ships | Quiet |
| under 3,000 | Moderate |
| 3,000–5,999 | Busy |
| 6,000 or more | Very busy |

If any ship's capacity is unknown, that day falls back to a ship-count rule (1 → moderate, 2 → busy, 3 or more → very busy). Capacities are maximum passenger capacities and live in `src/lib/capacities.mjs`; the visitor estimate in the ship drawer uses 2,500 for unknown ships. The same module is used by the app and the scraper.

**Adding a ship:** add its name and maximum capacity to `CAPACITY` in `src/lib/capacities.mjs`. Names are matched case- and punctuation-insensitively.

## How the data works

1. **`scraper/scrape.mjs`** fetches the port's mooring plan page ([Ålesund Havn](https://alesund.havn.no/skipstrafikk/mooringplan-cruise/)). Each link reads `Mooringplan - DD.MM.YYYY - Ship1 - Ship2`; `scraper/parse.mjs` turns those into one entry per day (ships, count, PAX, level).
2. For **today and later**, it downloads each day's PDF and `scraper/pdf.mjs` reads the table (vessel, berth, ETA, ETD — local Norwegian time) into `visits`. Downloads are sequential and spaced out, capped per run, and cached by PDF link inside `schedule.json`, so unchanged plans are not fetched again. A PDF that can't be read only means that day has no times.
3. The result is written to **`public/schedule.json`**:
   ```json
   { "generated": "…", "source": "…",
     "calls": [{ "date": "2026-10-21", "ships": ["AIDAnova", "Sky Princess"], "count": 2,
                 "pax": null, "level": "busy",
                 "visits": [{ "ship": "AIDAnova", "bay": "Prestebrygga",
                              "eta": "2026-10-21T07:00", "etd": "2026-10-21T16:00" }],
                 "pdfs": ["https://…pdf"] }] }
   ```
   `pax` is `null` when any ship's capacity is unknown; `visits` and `pdfs` exist only for days whose PDFs were read.
4. **`src/lib/horizon.ts`** decides how far the schedule is *published*: up to the end of the month of the latest call within 70 days of the scrape. Later future dates get the `unknown` level. The server build and the in-page script share this function.
5. Astro builds a static site from `schedule.json`; the page also fetches `/schedule.json` in the browser to preview other days.

## Project structure

```
src/pages/index.astro        page, all translations (T), client script
src/components/              StatusCard, WeekView, Calendar, BestDays, WeatherStrip,
                             ShipDrawer, LangSwitcher
src/lib/                     schedule.ts (days + levels), horizon.ts, visits.ts, lang.ts,
                             bestDays.ts, ships.ts, capacities.mjs (shared with scraper)
src/styles/global.css        Tailwind + dark-mode colour overrides
scraper/                     scrape.mjs, parse.mjs, pdf.mjs
public/                      schedule.json, sw.js, manifest, icons, og-image.png
deploy/                      vps-rebuild.sh, nginx.conf
```

Stack: [Astro](https://astro.build) (static output), Tailwind CSS 4, Node.js scraper (`node-html-parser`, `pdfjs-dist`). No server-side code at runtime.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run scrape     # refresh public/schedule.json (downloads PDFs for upcoming days)
npm run dev        # dev server on http://localhost:4321
npm run build      # static site into dist/
```

Dark mode and other colours: the Tailwind colour variables are re-pointed in one place (`src/styles/global.css`), so a new colour utility needs a matching override there. Tailwind is told to ignore the docs, `deploy/` and `scraper/` when looking for class names.

## Deployment and operations

The site is plain static files in an `nginx:alpine` container on a self-hosted server; GitHub is the code store only.

- **`deploy/vps-rebuild.sh`** does everything: pulls `main`, scrapes, builds inside a throwaway `node:22-alpine` container (no Node on the host, memory capped), and publishes into the folder nginx serves — adding new files before deleting old ones so assets are never missing. If the scrape fails it publishes the last good schedule. It is wrapped in a function so its own `git reset` cannot corrupt a running run.
- **Schedule:** run daily from cron, for example `30 4 * * * /bin/bash <path>/deploy/vps-rebuild.sh`. A `git push` does **not** deploy by itself — run the script (or wait for the next cron run) to publish a change.
- **Configuration** (environment or a `rebuild.env` next to the script's base folder): `BASE` (working folder, holds `src/`, `dist/`, `rebuild.log`, `schedule.last-good.json`), `DIST_DIR` (publish somewhere else for a dry run), `KUMA_PUSH_URL` (optional Uptime Kuma push monitor, pinged on success or failure).
- **`deploy/nginx.conf`**:
  - *Caching:* hashed assets are cached for a year; `sw.js` is never cached; HTML, `schedule.json` and everything else is revalidated on each visit (cheap `304` replies via ETag). The header is only added to successful responses, so a 404 can never be cached as "immutable".
  - *Rate limiting per visitor* (10 requests/s, burst 40, 16 connections; answers `429`). nginx sits behind a reverse proxy, so the real client address is restored from `X-Forwarded-For` for requests coming from Docker's private ranges.
  - *No access log:* visitor IP addresses are personal data and nothing needs them.
  - *Security headers:* strict Content-Security-Policy (the page has no inline scripts or styles), HSTS (without `includeSubDomains`), Permissions-Policy, `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options`. If you add something that loads from another origin or uses inline code, the CSP must be updated too.
  - *Also:* gzip with `Vary`, bot and scanner blocking, only `GET`/`HEAD` allowed.
- **Changing the nginx config:** the server mounts its own copy of this file. Overwrite it in place (`cat new > nginx.conf`; a `mv` would leave the container looking at the old file), check with `docker exec <container> nginx -t`, then `docker exec <container> nginx -s reload` — a reload drops no connections.
- The site runs as a plain `nginx:alpine` container with `dist/` and `nginx.conf` mounted read-only. TLS, the domain, routing and any access restrictions are handled by a reverse proxy on the server and are not part of this repository.
- **Service worker (`public/sw.js`):** hashed `/_astro/` assets are cache-first (only successful responses are cached); HTML and `schedule.json` are network-first. Bump the cache name on any deploy that changes assets in a way that must purge old caches.
- There are no GitHub Actions workflows: deploying and refreshing the schedule happen only on the server.

## Privacy and security

This is a static site: no backend, no database, no accounts and no forms. The app itself collects no personal data.

- **No tracking.** No cookies, analytics, advertising or fingerprinting. The only thing the page stores in the browser is the chosen language (`localStorage`), which never leaves the device.
- **No third parties when the page is used.** No external scripts, fonts, images or embeds are loaded, and the page only ever requests its own files (enforced by the Content-Security-Policy). The weather is fetched from MET Norway when the site is *built*, not from visitors' browsers. Links to Ålesund Havn, MET Norway and GitHub are ordinary links.
- **Logging.** The site's own web server writes no access log. The reverse proxy in front of it is shared server infrastructure outside this repository and keeps its own request log (time, client address, path, status; request headers are dropped) in size-limited rotating files. The app never reads these logs.
- **Hardening.** Strict Content-Security-Policy, HSTS, Permissions-Policy, `nosniff`, no referrer; per-visitor rate limiting; only `GET`/`HEAD` accepted; files are served from a read-only mount; no secrets or credentials in the repository or its history.
- **Data.** Only public information is used (the port's published mooring plans and MET Norway's forecast). Requests to the port are one run per day with an identifying user-agent.
- **Unofficial.** Not affiliated with or endorsed by Ålesund kommune or Ålesund Havn.

## Data sources and credits

- Cruise schedule and mooring plans: [Ålesund Havn](https://alesund.havn.no/skipstrafikk/mooringplan-cruise/) — public information, read once a day with an identifying user-agent; the site links back to the source.
- Weather: [MET Norway](https://www.met.no/en) Locationforecast, used under MET Norway's open data licence (credit required, shown in the footer).
- Unofficial and independent: not affiliated with, or endorsed by, Ålesund kommune or Ålesund Havn.

## Licence

Copyright © 2026 JacosVerksted. All rights reserved. The source is public so it can be read and reviewed — anyone, including Ålesund kommune and Ålesund Havn, may view it and run a local copy to evaluate it. Any other use, including selling or republishing it, needs written permission. See [LICENSE](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

Made in Norway 🇳🇴 by [JacosVerksted](https://github.com/JacosVerksted)
