/**
 * Date helpers.
 *
 * Everything here formats deterministically instead of using
 * `toLocaleDateString()`. Locale-aware formatting can produce a different
 * string on the server than in the browser, which shows up as a React
 * hydration mismatch — one of the most common bugs in a Next.js app that
 * renders dates.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Whole days from today to `date`. Negative means in the past. */
export function daysUntil(date: Date): number {
  return Math.round((startOfDay(date).getTime() - today().getTime()) / MS_PER_DAY);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** `YYYY-MM-DD`, the format `<input type="date">` expects. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type DueStatus = "none" | "overdue" | "today" | "soon" | "later";

export function dueStatus(date: Date | null | undefined): DueStatus {
  if (!date) return "none";
  const diff = daysUntil(date);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "soon";
  return "later";
}

export function describeDue(date: Date | null | undefined): string {
  if (!date) return "";
  const diff = daysUntil(date);
  if (diff === 0) return "due today";
  if (diff === 1) return "due tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  return `in ${diff} days`;
}

export function describeAge(date: Date | null | undefined): string {
  if (!date) return "";
  const diff = Math.abs(daysUntil(date));
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  if (diff < 30) return `${diff} days ago`;
  const months = Math.round(diff / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
