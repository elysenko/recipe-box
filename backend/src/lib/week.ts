// Server-side ISO-week helper. Label format: "2026-W29".
function isoYearWeek(date: Date): [number, number] {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return [isoYear, week];
}

export function currentWeek(): string {
  const [y, w] = isoYearWeek(new Date());
  return `${y}-W${w < 10 ? `0${w}` : w}`;
}

// Basic validation for a week label like "2026-W29".
export function isValidWeek(label: string): boolean {
  return /^\d{4}-W\d{1,2}$/.test(label);
}
