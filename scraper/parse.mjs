import { parse } from 'node-html-parser';
import { dayLevel } from '../src/lib/capacities.mjs';

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})\s*-\s*/;
// Matches (PDF, 174 kB), (PNG, 233 kB), etc.
const FILE_SUFFIX_RE = /\s*\([A-Za-z]{2,5},\s*[\d\s]+kB\)\s*$/i;
const CANCELLED_RE = /kansellert/i;

function toISO(dd, mm, yyyy) {
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse the mooringplan HTML page and return cruise call entries.
 * @param {string} html
 * @returns {{ date: string; ships: string[]; count: number; pax: number | null; level: string }[]}
 */
export function parseMooringplan(html) {
  const root = parse(html);
  const anchors = root.querySelectorAll('a[href]');

  /** @type {Map<string, Set<string>>} */
  const byDate = new Map();

  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    if (!href.includes('.pdf') && !href.includes('/_f/')) continue;

    const raw = (a.textContent || '').trim();
    if (CANCELLED_RE.test(raw)) continue;

    const text = raw.replace(FILE_SUFFIX_RE, '').trim();
    if (!text.toLowerCase().startsWith('mooringplan')) continue;

    // Strip "Mooringplan - " prefix (case-insensitive, varying spaces)
    const afterPrefix = text.replace(/^mooringplan\s*-\s*/i, '');

    const dateMatch = afterPrefix.match(DATE_RE);
    if (!dateMatch) continue;

    const [fullMatch, dd, mm, yyyy] = dateMatch;
    const iso = toISO(dd, mm, yyyy);
    const shipsPart = afterPrefix.slice(fullMatch.length).trim();

    // Separator between ship names varies:
    // - Newer entries: \s-\s where the leading space may be a non-breaking space (U+00A0)
    // - Older entries: ", " (comma-space)
    // Using \s in regex covers both regular and non-breaking spaces.
    const ships = (/\s-\s/.test(shipsPart)
      ? shipsPart.split(/\s-\s/)
      : shipsPart.split(/,\s*/))
      .map(s => s.replace(/\s*\(.*?\)\s*$/, '').trim()) // strip trailing annotations like (Ny), (21.06.2025)
      .filter(Boolean);

    if (!byDate.has(iso)) byDate.set(iso, new Set());
    for (const ship of ships) {
      byDate.get(iso).add(ship);
    }
  }

  const calls = [];
  for (const [date, shipSet] of byDate) {
    const ships = [...shipSet];
    const count = ships.length;
    // Busyness is driven by total passengers in port (PAX); when any ship's
    // capacity is unknown it falls back to the ship-count rule.
    const { pax, level } = dayLevel(ships);
    calls.push({ date, ships, count, pax, level });
  }

  calls.sort((a, b) => a.date.localeCompare(b.date));
  return calls;
}
