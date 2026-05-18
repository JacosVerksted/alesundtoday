import type { DayInfo } from './schedule.js';
import { getRange } from './schedule.js';
import { estimateCapacity } from './ships.js';

export interface BestDay extends DayInfo {
  estimatedVisitors: number;
  reason: string;
}

export function getBestDays(
  fromDateISO: string,
  opts: { maxDaysAhead?: number; count?: number } = {}
): BestDay[] {
  const { maxDaysAhead = 90, count = 5 } = opts;

  // Start from tomorrow
  const startDate = new Date(fromDateISO + 'T12:00:00Z');
  startDate.setUTCDate(startDate.getUTCDate() + 1);
  const startISO = startDate.toISOString().slice(0, 10);

  const candidates = getRange(startISO, maxDaysAhead);

  // Score each day (lower = better)
  const scored = candidates.map((day, idx) => {
    const estimatedVisitors = day.ships.reduce(
      (sum, ship) => sum + estimateCapacity(ship),
      0
    );
    const recencyBonus = idx * 0.01;
    const score = day.count * 1000 + estimatedVisitors / 100 + recencyBonus;
    return { day, score, estimatedVisitors };
  });

  scored.sort((a, b) => a.score - b.score);

  // Pick results with a minimum 3-day spacing between selected dates
  const selected: typeof scored = [];
  for (const candidate of scored) {
    if (selected.length >= count) break;
    const tooClose = selected.some(
      (s) =>
        Math.abs(
          (new Date(s.day.date).getTime() - new Date(candidate.day.date).getTime()) /
            86400000
        ) < 3
    );
    if (!tooClose) selected.push(candidate);
  }

  return selected.map(({ day, estimatedVisitors }) => ({
    ...day,
    estimatedVisitors,
    reason:
      day.count === 0
        ? 'No cruise ships'
        : day.count === 1
          ? `1 ship (~${estimatedVisitors.toLocaleString()} visitors)`
          : `${day.count} ships (~${estimatedVisitors.toLocaleString()} visitors)`,
  }));
}
