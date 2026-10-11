/** One ship's stay, from the port's mooring plan PDF. Times are local Norwegian time. */
export interface Visit {
  ship: string;
  /** Berth, e.g. "Storneskaia" */
  bay: string;
  /** "YYYY-MM-DDTHH:MM" */
  eta: string;
  etd: string;
}

const hhmm = (iso: string) => iso.slice(11, 16);

function dayDiff(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/** "09:00–19:00", or "22:00–06:00 (+1)" when the ship leaves on a later day. */
export function timeRange(eta: string, etd: string): string {
  const d = dayDiff(eta, etd);
  return `${hhmm(eta)}–${hhmm(etd)}${d > 0 ? ` (+${d})` : ''}`;
}

/**
 * First arrival to last departure across the day's visits, e.g. "07:00–19:00".
 * Empty for overnight stays: a single window would wrongly suggest a ship is there throughout.
 */
export function portWindow(visits: Visit[]): string {
  if (visits.length === 0 || visits.some((v) => dayDiff(v.eta, v.etd) > 0)) return '';
  const first = visits.reduce((m, v) => (v.eta < m ? v.eta : m), visits[0].eta);
  const last = visits.reduce((m, v) => (v.etd > m ? v.etd : m), visits[0].etd);
  return timeRange(first, last);
}
