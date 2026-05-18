import rawSchedule from '../../public/schedule.json';

export type BusynessLevel = 'quiet' | 'moderate' | 'busy' | 'very-busy';

export interface CruiseCall {
  date: string;
  ships: string[];
  count: number;
  level: BusynessLevel;
}

export interface DayInfo extends CruiseCall {
  isToday: boolean;
  isPast: boolean;
}

const callMap = new Map<string, CruiseCall>(
  rawSchedule.calls.map((c) => [c.date, c as CruiseCall])
);

export const generatedAt: string = rawSchedule.generated;

function todayISO(): string {
  // Use local date (not UTC) so Norwegian users see the correct day
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeQuiet(date: string, todayStr: string): DayInfo {
  return {
    date,
    ships: [],
    count: 0,
    level: 'quiet',
    isToday: date === todayStr,
    isPast: date < todayStr,
  };
}

export function getDay(dateISO: string): DayInfo {
  const todayStr = todayISO();
  const call = callMap.get(dateISO);
  if (!call) return makeQuiet(dateISO, todayStr);
  return {
    ...call,
    isToday: dateISO === todayStr,
    isPast: dateISO < todayStr,
  };
}

export function getRange(startISO: string, days: number): DayInfo[] {
  const result: DayInfo[] = [];
  const d = new Date(startISO + 'T12:00:00Z');
  for (let i = 0; i < days; i++) {
    const iso = d.toISOString().slice(0, 10);
    result.push(getDay(iso));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return result;
}

export function getMonth(year: number, month: number): DayInfo[] {
  // month is 1-based; returns all days in that calendar month
  const result: DayInfo[] = [];
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const d = new Date(start);
  while (d < end) {
    const iso = d.toISOString().slice(0, 10);
    result.push(getDay(iso));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return result;
}

export function getToday(): DayInfo {
  return getDay(todayISO());
}
