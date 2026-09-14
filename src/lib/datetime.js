// Date helpers for scheduled programmes.
//
// Class times used to be free text ("Thu 4 Sep · 7:00am"), which reads fine but
// can't be sorted or compared — so "which class is next?" was unanswerable.
// Classes now store an ISO `startsAt` and everything human-facing is formatted
// from it here.

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Mock data is generated relative to "now" rather than pinned to fixed dates:
// with hard-coded 2025 dates every demo class falls into the past and the
// upcoming-class card would never appear.
export function atOffset(days, hour = 7, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function isValidDate(iso) {
  if (!iso) return false;
  return !Number.isNaN(new Date(iso).getTime());
}

export function formatTime(iso) {
  if (!isValidDate(iso)) return "";
  const d = new Date(iso);
  const minutes = d.getMinutes();
  const ampm = d.getHours() >= 12 ? "pm" : "am";
  const hour = d.getHours() % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")}${ampm}`;
}

// "Thu 4 Sep · 7:00am" — the same shape the old free-text strings used, so
// nothing in the UI reads differently than it did before.
export function formatWhen(iso) {
  if (!isValidDate(iso)) return "TBC";
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${formatTime(iso)}`;
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
  const d = new Date();
  d.setMonth(d.getMonth() - months, day);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function monthsAhead(months, day = 1) {
  return monthsAgo(-months, day);
}

// "Feb 2025" — for join dates, where the day doesn't matter.
export function formatMonthYear(iso) {
  if (!isValidDate(iso)) return "—";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "6 Sep" — for ledger rows.
export function formatDayMonth(iso) {
  if (!isValidDate(iso)) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function sameMonth(iso, ref = new Date()) {
  if (!isValidDate(iso)) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
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
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toTimeInput(iso) {
  if (!isValidDate(iso)) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// A bare "2026-09-14" from <input type="date"> is parsed as UTC midnight by
// `new Date`, which lands on the previous day for anyone west of UTC. Dates
// chosen in a date picker mean a local calendar day, so they're built as one.
export function fromDayInput(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return isValidDate(value) ? new Date(value) : null;
}

// Returns null when the date is missing — callers treat that as "no time set
// yet" rather than inventing today's date.
export function fromDateTimeInputs(date, time) {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "09:00").split(":").map(Number);
  const out = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return Number.isNaN(out.getTime()) ? null : out.toISOString();
}
