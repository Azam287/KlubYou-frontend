// Date helpers for scheduled programmes.
//
// Class times used to be free text ("Thu 4 Sep · 7:00am"), which reads fine but
// can't be sorted or compared — so "which class is next?" was unanswerable.
// Classes now store an ISO `startsAt` and everything human-facing is formatted
// from it here.

// Every wall-clock reading here is in the studio's time zone (lib/locale.js),
// not the browser's: "7:00am", "today", "Monday" and "this month" mean the same
// thing to a creator wherever they happen to be looking from.

import { partsOf, zonedDate } from "./locale";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Mock data is generated relative to "now" rather than pinned to fixed dates:
// with hard-coded 2025 dates every demo class falls into the past and the
// upcoming-class card would never appear.
export function atOffset(days, hour = 7, minute = 0) {
  const p = partsOf(new Date());
  return zonedDate(p.year, p.month, p.day + days, hour, minute).toISOString();
}

/* ---------- days in the studio's zone ---------- */

// These replace getDay() / setHours(0,0,0,0) / setDate(+n) on a Date, which
// all answer in the browser's zone.

export const weekdayOf = (date) => partsOf(date).weekday;

// "2026-09-16": which calendar day an instant falls on, in the studio's zone.
export function dayKeyOf(date) {
  const p = partsOf(date);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export const sameDay = (a, b) => dayKeyOf(a) === dayKeyOf(b);

export function startOfDay(date) {
  const p = partsOf(date);
  return zonedDate(p.year, p.month, p.day);
}

// The same clock time `days` later — across a clock change, 7am stays 7am.
export function addDays(date, days) {
  const p = partsOf(date);
  return zonedDate(p.year, p.month, p.day + days, p.hour, p.minute, p.second);
}

// The day an instant falls on, at a given clock time ("07:00" on that day).
export function atClock(date, hour, minute = 0) {
  const p = partsOf(date);
  return zonedDate(p.year, p.month, p.day, hour, minute);
}

// Month boundaries: `months` from the month `date` is in (0 = this month).
export function startOfMonth(date, months = 0) {
  const p = partsOf(date);
  return zonedDate(p.year, p.month + months, 1);
}

export function isValidDate(iso) {
  if (!iso) return false;
  return !Number.isNaN(new Date(iso).getTime());
}

export function formatTime(iso) {
  if (!isValidDate(iso)) return "";
  const p = partsOf(iso);
  const ampm = p.hour >= 12 ? "pm" : "am";
  return `${p.hour % 12 || 12}:${String(p.minute).padStart(2, "0")}${ampm}`;
}

// "Thu 4 Sep · 7:00am" — the same shape the old free-text strings used, so
// nothing in the UI reads differently than it did before.
export function formatWhen(iso) {
  if (!isValidDate(iso)) return "TBC";
  const p = partsOf(iso);
  return `${DAYS[p.weekday]} ${p.day} ${MONTHS[p.month]} · ${formatTime(iso)}`;
}

// Short countdown for the upcoming-class card ("in 2 days", "in 3 hrs").
export function formatRelative(iso, now = Date.now()) {
  if (!isValidDate(iso)) return "";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr${hrs === 1 ? "" : "s"}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export function isFuture(iso, now = Date.now()) {
  return isValidDate(iso) && new Date(iso).getTime() > now;
}

export function monthsAgo(months, day = 1) {
  const p = partsOf(new Date());
  return zonedDate(p.year, p.month - months, day, 12).toISOString();
}

export function monthsAhead(months, day = 1) {
  return monthsAgo(-months, day);
}

// "Fri 18 Sep" — a day, without the time.
export function formatDay(iso) {
  const d = fromDayInput(iso);
  if (!d) return "—";
  const p = partsOf(d);
  return `${DAYS[p.weekday]} ${p.day} ${MONTHS[p.month]}`;
}

// "Feb 2025" — for join dates, where the day doesn't matter.
export function formatMonthYear(iso) {
  if (!isValidDate(iso)) return "—";
  const p = partsOf(iso);
  return `${MONTHS[p.month]} ${p.year}`;
}

// "6 Sep" — for ledger rows. Takes an instant or a picked "2026-09-06".
export function formatDayMonth(iso) {
  const d = fromDayInput(iso);
  if (!d) return "—";
  const p = partsOf(d);
  return `${p.day} ${MONTHS[p.month]}`;
}

export function sameMonth(iso, ref = new Date()) {
  if (!isValidDate(iso)) return false;
  const a = partsOf(iso);
  const b = partsOf(ref);
  return a.year === b.year && a.month === b.month;
}

// A renewal date reads differently depending on which side of today it falls,
// so the label is derived rather than stored — that's what let "active" members
// sit next to a renewal date already in the past.
export function formatRenewal(iso, now = Date.now()) {
  if (!isValidDate(iso)) return "—";
  const diff = new Date(iso).getTime() - now;
  if (diff < 0) return `Ended ${formatDayMonth(iso)}`;
  const days = Math.ceil(diff / 86400000);
  if (days <= 1) return "Tomorrow";
  if (days <= 30) return `in ${days} days`;
  return formatMonthYear(iso);
}

/* ---------- <input type="date"> / <input type="time"> bridging ---------- */

export function toDateInput(iso) {
  const d = fromDayInput(iso);
  return d ? dayKeyOf(d) : "";
}

export function toTimeInput(iso) {
  if (!isValidDate(iso)) return "";
  const p = partsOf(iso);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

// A bare "2026-09-14" from <input type="date"> is parsed as UTC midnight by
// `new Date`, which lands on the previous day for anyone west of UTC. Dates
// chosen in a date picker mean a calendar day in the studio's zone, so they're
// built as one.
export function fromDayInput(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return zonedDate(y, m - 1, d);
  }
  return isValidDate(value) ? new Date(value) : null;
}

// Returns null when the date is missing — callers treat that as "no time set
// yet" rather than inventing today's date.
export function fromDateTimeInputs(date, time) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "09:00").split(":").map(Number);
  const out = zonedDate(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  return Number.isNaN(out.getTime()) ? null : out.toISOString();
}
