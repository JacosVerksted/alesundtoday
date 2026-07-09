# Changelog

All notable changes to Visit Ålesund are documented here.

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
