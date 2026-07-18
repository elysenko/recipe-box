// ISO-week helpers. Week label format: "2026-W29". Days MON..SUN.
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Returns [isoYear, isoWeek] for a given date (ISO 8601, Monday-based).
function isoYearWeek(date: Date): [number, number] {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return [isoYear, week];
}

export function formatWeek(year: number, week: number): string {
  return `${year}-W${pad(week)}`;
}

export function currentWeek(): string {
  const [y, w] = isoYearWeek(new Date());
  return formatWeek(y, w);
}

export function parseWeek(label: string): { year: number; week: number } {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(label);
  if (!m) {
    const [y, w] = isoYearWeek(new Date());
    return { year: y, week: w };
  }
  return { year: parseInt(m[1], 10), week: parseInt(m[2], 10) };
}

// Monday (as a Date) of a given ISO week.
export function mondayOfWeek(label: string): Date {
  const { year, week } = parseWeek(label);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function weeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  return isoYearWeek(dec28)[1];
}

export function shiftWeek(label: string, delta: number): string {
  let { year, week } = parseWeek(label);
  week += delta;
  while (week < 1) {
    year -= 1;
    week += weeksInYear(year);
  }
  let max = weeksInYear(year);
  while (week > max) {
    week -= max;
    year += 1;
    max = weeksInYear(year);
  }
  return formatWeek(year, week);
}

// Date for a specific day within a week label.
export function dateForDay(label: string, day: Day): Date {
  const monday = mondayOfWeek(label);
  const idx = DAYS.indexOf(day);
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + idx);
  return d;
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function weekRangeLabel(label: string): string {
  const start = mondayOfWeek(label);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return `${shortDate(start)} – ${shortDate(end)}`;
}
