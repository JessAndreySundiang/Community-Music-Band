/** The helpers below need nothing more than an ISO date, `YYYY-MM-DD`. */
type Dated = { date: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Splits an ISO date into the parts the cards display, without going near a
 * Date object — so the month can never shift for a visitor in another time
 * zone. Returns null for anything that is not a plain ISO date.
 */
export function eventDateParts(
  date: string,
): { month: string; day: string; dayOfMonth: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const month = MONTHS[Number(match[2]) - 1];
  const dayOfMonth = Number(match[3]);
  if (!month || dayOfMonth < 1 || dayOfMonth > 31) return null;

  return { month, day: match[3], dayOfMonth };
}

/** Today in the visitor's own calendar, as `YYYY-MM-DD`. */
export function localIsoDate(today: Date = new Date()): string {
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

/**
 * The soonest event that has not happened yet, or undefined when everything
 * announced is in the past. ISO dates sort chronologically as plain strings,
 * so no date arithmetic is needed.
 */
export function nextUpcomingEvent<T extends Dated>(
  events: readonly T[],
  today: Date = new Date(),
): T | undefined {
  const iso = localIsoDate(today);

  return events
    .filter((event) => event.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}
