/**
 * How far ahead the port's schedule is actually published.
 *
 * The port publishes its mooring plan in monthly batches, roughly 4–8 weeks ahead
 * (observed from the weekly schedule history: the latest call jumps to the end of
 * each next month, and nothing is ever back-filled into an earlier gap).
 *
 * So: the schedule is known up to the end of the month of the latest call — but only
 * counting calls within MAX_LEAD_DAYS of when it was scraped. A single call far in the
 * future (e.g. an early-published January call) is still shown as a call, but does not
 * make the empty weeks before it look "published and quiet".
 */
const MAX_LEAD_DAYS = 70;

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function endOfMonth(iso: string): string {
  const y = parseInt(iso.slice(0, 4), 10);
  const m = parseInt(iso.slice(5, 7), 10); // 1-based; day 0 of next month = last day of this one
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** Last date (YYYY-MM-DD) the schedule is considered published for. */
export function computeHorizon(callDates: string[], generatedISO: string): string {
  const generated = generatedISO.slice(0, 10);
  const limit = addDays(generated, MAX_LEAD_DAYS);
  let last = '';
  for (const d of callDates) if (d <= limit && d > last) last = d;
  return last ? endOfMonth(last) : generated;
}
