# Changelog

All notable changes to Visit Ålesund are documented here.

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
