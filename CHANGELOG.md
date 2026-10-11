# Changelog

All notable changes to Ålesund Today (formerly "Visit Ålesund") are documented here.

Newest first. Entries on the same date are grouped by theme.

## 2026-10-11 (open access and scanner blocking)

### Changed
- **The country restriction was removed from the site**, so visitors from abroad (most
  cruise passengers) can use it. In the logs, far more addresses were being refused than
  got in. The restriction on other services on the same proxy is unchanged. The privacy
  page no longer mentions it.
- **WordPress, admin and scanner probes** (`wp-*`, `.env`, `.git`, `phpinfo`, `_ignition`,
  admin/login paths, `/?rest_route=` and more) now all get the same plain `404`, and are
  throttled harder than normal visitors (`429` after a short allowance). Dotfiles used to
  answer `403`, which hints that something exists; they answer `404` now. These probes
  used to be turned away by the country block before reaching the web server.

## 2026-10-11 (privacy notice)

### Added
- **Privacy page** at `/privacy/` (English; Norwegian for Bokmål and Nynorsk readers)
  covering who is responsible, what is and isn't collected, the server request log and
  its purpose, how long it is kept (about two to three weeks, overwritten automatically),
  sharing, and visitors' rights including the complaint route to Datatilsynet.
- A **footer line** in all six languages ("No cookies or tracking. Server logs are used
  for aggregate usage statistics.") linking to the privacy page.

## 2026-10-11 (licence and privacy notes)

### Changed
- `LICENSE` now explicitly allows viewing the code and running a local copy solely to
  review or evaluate it (e.g. by the municipality or the port). Selling, republishing and
  any other use still need written permission.

### Added
- A **Privacy and security** section in the README (no cookies or tracking, nothing loaded
  from third parties by the page, what is and isn't logged, the hardening in place).

## 2026-10-11 (web server)

### Changed
- **Rate limits now apply per visitor.** nginx sits behind a reverse proxy and used to
  see every request as coming from the proxy, so all visitors shared a single limit
  (all of the last 399 logged requests came from one address). The real client address
  is now restored from `X-Forwarded-For`; limits are 10 requests/s with a burst of 40
  per visitor and answer `429`. Verified with a burst test: excess requests are refused
  and normal traffic recovers within seconds.
- **No access log**, since visitor IP addresses are personal data and nothing uses them.
- **Caching:** HTML and `schedule.json` were cached by browsers for 24 h / 1 h, so a
  returning visitor could see yesterday's page after the daily rebuild (and the service
  worker's "network-first" fetches were served from that cache). They are now revalidated
  on every visit. Cache headers are set once per path and only on successful responses —
  before, a missing hashed asset returned a 404 marked "cache for a year".
- `Vary: Accept-Encoding` is sent with compressed responses; JavaScript is compressed.

### Added
- **Security headers:** a strict Content-Security-Policy (verified against the live page
  with language switching, day selection, the ship drawer and the service worker: no
  violations), HSTS (6 months, without `includeSubDomains`) and a Permissions-Policy.
- A `LICENSE` file: all rights reserved (the source is public to read, not licensed for reuse).

## 2026-10-11 (arrival times and berths)

### Added
- **Berth and arrival/departure times.** The port's per-call mooring plan PDFs
  contain a table of vessel, berth ("bay"), ETA and ETD. The scraper now reads them,
  and the status card shows an "In port 07:00–17:00" summary plus one line per ship
  with its times and berth (e.g. `07:00–16:00 AIDAnova · Prestebrygga`).
  - Overnight stays are marked `22:00–06:30 (+1)`, and the summary window is hidden
    for those days (one window would wrongly suggest a ship is in port throughout).
  - PDFs are only downloaded for today and later, one at a time with a short delay.
    Results are cached in `schedule.json` keyed by the PDF link, so unchanged plans
    are never downloaded twice (a changed plan gets a new link). A PDF that cannot be
    read just leaves that day without times — it never fails the scrape.
  - New: `scraper/pdf.mjs` (pdf.js, no code evaluation), `src/lib/visits.ts`,
    and a new `in_port` string in all six languages.

### Changed
- Ship chips in the status card are now built with `textContent` instead of
  `innerHTML`, since ship names come from scraped data.

## 2026-10-11 (schedule not published yet)

### Added
- **"Schedule not available yet" for unpublished dates.** Future dates after the
  port's published schedule used to show as green "quiet". They now appear greyed out
  and struck through in the calendar (with a new legend entry), as a dashed card in the
  14-day strip, and as "Schedule not available yet" in the status card. "Best upcoming
  days" skips them. Today and past days without a ship still read "quiet".
- **Off-season notice** under the status card when no cruise call is scheduled today
  or later ("The port publishes its plan about a month ahead, so check back later").
  "Best upcoming days" shows its own message when nothing is published to rank.

### Changed
- **How "published" is decided.** Measured from the weekly `schedule.json` history, the
  port publishes its plan in monthly batches 4–8 weeks ahead and never back-fills gaps.
  The schedule therefore counts as published up to the **end of the month of the latest
  call** that lies within 70 days of the scrape (`src/lib/horizon.ts`). A single call far
  in the future (say, one early January call) is still shown, but does not make the
  unpublished weeks before it look "quiet". The server build and the in-page script share
  this one function.

## 2026-10-11 (appearance, language and sharing)

### Added
- **Dark mode**, following the device setting. Implemented by re-pointing the Tailwind
  colour variables once in `src/styles/global.css` instead of adding `dark:` classes
  everywhere, so classes added at runtime adapt too. The browser theme colour follows.
- **Default language from the browser.** First-time visitors get Norwegian (Bokmål or
  Nynorsk), German, Dutch or French when their browser prefers it; an explicit choice
  in the language menu always wins (`src/lib/lang.ts`).
- **Link previews:** Open Graph / Twitter tags, a canonical URL and a preview image
  (`public/og-image.png`).
- **Footer:** an "unofficial, independent project — not affiliated with Ålesund kommune
  or Ålesund Havn" note, a credit to MET Norway for the weather data (required by their
  open-data licence), and the author name now links to the GitHub profile. All translated.
- **New icons.** An original ship-on-waves icon replaces the default Astro favicon
  (SVG, PNG and ICO), and the home-screen / install icons now show the same ship with
  the app name. Icon links carry a `?v=3` cache-buster; bump it when the icons change.

### Fixed
- The weather request's `User-Agent` pointed at a repository that doesn't exist. Both
  the weather request and the scraper now identify themselves with this repository.

## 2026-10-11 (hosting and automation)

### Changed
- **Scraping, building and deploying now run on the server, not in GitHub Actions.**
  `deploy/vps-rebuild.sh` pulls this repository, scrapes the schedule and PDFs and builds
  the site inside a throwaway `node:22-alpine` container, then publishes into the folder
  nginx serves. It runs daily from cron. GitHub remains the code store only.
  - Publishing adds new files before deleting old ones, so a page and its hashed assets
    are never missing at the same time.
  - If the scrape fails, the last good schedule is used and the site is still published.
  - The script is wrapped in a function so its own `git reset` cannot corrupt a running run.
  - Optional Uptime Kuma push monitoring via `KUMA_PUSH_URL` in `rebuild.env`.
- The two GitHub Actions workflows (daily rebuild, weekly schedule refresh) were disabled, then deleted from the repository, and the deploy secrets were removed.


## 2026-07-09 (intro)

### Added
- A short, plain-language intro line at the top of the screen explaining what the
  app is for ("Big cruise ships can crowd Ålesund… Tap any day to see how busy it
  will be before you go."), translated into all six languages.

## 2026-07-09 (busyness model)

### Changed
- **Busyness level is now based on total passengers in port (PAX), not the number
  of ships.** A single mega-ship (e.g. MSC Euribia, 6,762 pax) now reads as "Very
  busy", while several small Hurtigruten/expedition ships can still be "Moderate"
  — so a day with 4 small ships is no longer automatically "very busy". The ship
  count is still shown everywhere as before.
  - Thresholds (total PAX): Moderate `<3,000`, Busy `3,000–5,999`, Very busy
    `≥6,000`. Days with no ships are Quiet.
  - **Fallback:** if any ship in port has an unknown capacity, that day's total
    PAX is treated as unknown and the level falls back to the original ship-count
    rule (1 → moderate, 2 → busy, 3+ → very busy).
  - Capacity data + the level logic now live in one shared module
    (`src/lib/capacities.mjs`), used by both the app and the build-time scraper,
    and `pax` is stored per day in `schedule.json`.
  - The calendar legend now shows PAX ranges (e.g. "Busy (3–6k pax)") instead of
    ship counts, and "Best upcoming days" ranks by PAX for consistency.

## 2026-07-09 (later)

### Fixed
- **Stale/broken page for returning visitors after a deploy.** The service worker
  cached *every* `/_astro/` asset response cache-first-forever, including error
  responses. If a returning browser fetched a new hashed asset during the redeploy
  window and hit a transient 404/403, that error got cached permanently and the
  page stayed broken until the cache was cleared. The SW now (a) only caches
  successful (`res.ok`) responses, so a transient error can never poison the
  cache, and (b) bumps the cache name `visit-alesund-v2` → `v3`, which makes every
  returning browser purge the old (possibly poisoned) cache on next load.

## 2026-07-09

### Added
- **Selectable days.** Tap any day in the calendar or the "Next 14 days" strip to
  preview that date. The top status card updates to the chosen date and shows an
  "It will be …" label with the busyness state, so it's clear you're looking at a
  different day than today. A "← Today" button resets the card. The chosen day is
  marked with a blue outline (distinct from the ring that marks today).
  - Rationale: 4 large cruise ships overload the city, but 4 small Hurtigruten
    ships bring far fewer passengers — so a "busy" day may still be fine to visit
    downtown. Being able to inspect a specific day helps you decide.
  - Day selection works for all six languages (the "It will be" / "← Today"
    strings are translated).

### Fixed
- The daily date-rollover refresh was rebuilding the wrong strip (the weather
  strip shared the same utility classes as the 14-day strip). The 14-day strip now
  has a stable `#weekview-strip` id and is targeted explicitly.
- The status card's ship-count line no longer says "today" (e.g. "1 cruise ship in
  port" instead of "…in port today"), since the card can now show any date.

## Before July 2026

- Static Astro + Tailwind site with a build-time scraper of the port's mooring plan,
  a 14-day strip, calendar, best days, weather strip, ship drawer, six languages and
  an installable PWA.
- Hosting moved from Netlify to a self-hosted server (nginx in Docker), with a hardened
  `nginx.conf` (rate limiting, bot blocking, security headers, per-path cache headers).
- Service worker switched to network-first for HTML so phones see fresh content;
  fixes for the date rolling over at midnight.
