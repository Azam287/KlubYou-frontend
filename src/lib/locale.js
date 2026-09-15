// The studio's currency and time zone, and the two things they change: how
// money is written, and what "7am", "today" and "this month" mean.
//
// Why a module-level setting instead of an argument: every date rule in
// src/lib (the schedule, lessons, run windows, payouts, month totals) and every
// money label reads these, from ~60 call sites. Threading a zone through each
// function and component was the alternative, and one forgotten argument would
// quietly fall back to the browser's zone — the very bug a studio zone exists
// to fix. So AppDataContext applies the studio's settings here on every render
// (`applyStudioLocale`), before any child renders, and tests can do the same.
//
// Before this, times were whatever the viewer's browser said: a creator in
// London looking from India saw their 7am class at 11:30am.

export const DEFAULT_TIMEZONE = "Europe/London";
export const DEFAULT_CURRENCY = "GBP";

// The currencies offered. A symbol is written straight onto the number
// ("£40", "A$40"), which reads better on small cards than "GBP 40".
export const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian dollar" },
  { code: "AUD", symbol: "A$", name: "Australian dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand dollar" },
  { code: "INR", symbol: "₹", name: "Indian rupee" },
  { code: "SGD", symbol: "S$", name: "Singapore dollar" },
  { code: "AED", symbol: "AED ", name: "UAE dirham" },
  { code: "ZAR", symbol: "R", name: "South African rand" },
  { code: "CHF", symbol: "CHF ", name: "Swiss franc" },
  { code: "SEK", symbol: "kr ", name: "Swedish krona" },
];

let active = { timezone: DEFAULT_TIMEZONE, currency: DEFAULT_CURRENCY };

export function isTimezone(tz) {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const isCurrency = (code) => CURRENCIES.some((c) => c.code === code);

// Settings that aren't valid fall back to the defaults rather than throwing
// mid-render — a bad zone would otherwise take the whole dashboard down.
export function applyStudioLocale({ timezone, currency } = {}) {
  active = {
    timezone: isTimezone(timezone) ? timezone : DEFAULT_TIMEZONE,
    currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY,
  };
}

export const studioTimezone = () => active.timezone;
export const studioCurrency = () => active.currency;

/* ---------- money ---------- */

export const currencySymbol = (code = active.currency) =>
  (CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]).symbol;

const grouped = (n, digits) =>
  Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// "£40", "£12.50" — whole amounts drop the pence rather than rounding them away.
export function money(n) {
  const v = Number(n || 0);
  return `${currencySymbol()}${grouped(v, Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2)}`;
}

// "£40.00", for ledgers where the columns should line up.
export const money2 = (n) => `${currencySymbol()}${grouped(n, 2)}`;

/* ---------- time zones ---------- */

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const FALLBACK_ZONES = [
  "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Asia/Kolkata",
  "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
  "Africa/Johannesburg", "UTC",
];

// Every zone the browser knows, with a short list for the rare one that can't say.
export function timezoneList() {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  const list = all.length ? all : FALLBACK_ZONES;
  return list.includes("UTC") ? list : [...list, "UTC"];
}

const formatters = new Map();
function formatterFor(tz) {
  if (!formatters.has(tz)) {
    formatters.set(
      tz,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        weekday: "short",
      })
    );
  }
  return formatters.get(tz);
}

const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// The wall clock in the studio's zone at an instant: what getFullYear(),
// getMonth(), getDate(), getHours(), getMinutes() and getDay() gave for the
// browser's zone. `month` is 0–11, `weekday` 0 (Sunday)–6, as they were.
export function partsOf(date, tz = active.timezone) {
  const t = new Date(date);
  const out = {};
  for (const p of formatterFor(tz).formatToParts(t)) {
    if (p.type === "weekday") out.weekday = WEEKDAY[p.value];
    else if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month - 1,
    day: out.day,
    hour: out.hour % 24,
    minute: out.minute,
    second: out.second,
    weekday: out.weekday,
  };
}

// How far the zone's clock is ahead of UTC at an instant, in ms.
function offsetAt(t, tz) {
  const p = partsOf(t, tz);
  return Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}

// The instant a wall-clock time happens in the studio's zone — `new Date(y, m,
// d, h, min)` for that zone. Out-of-range values roll over the same way (day 0
// is the last day of the month before, month 12 is January next year), which
// is what the day and month arithmetic below relies on.
//
// A time that doesn't exist (skipped when the clocks go forward) lands an hour
// later; one that happens twice (clocks go back) takes the second.
export function zonedDate(year, month, day = 1, hour = 0, minute = 0, second = 0, tz = active.timezone) {
  const wall = Date.UTC(year, month, day, hour, minute, second);
  const guess = wall - offsetAt(wall, tz);
  const settled = wall - offsetAt(guess, tz);
  return new Date(guess === settled ? guess : Math.max(guess, settled));
}

// "GMT+1", "GMT+5:30" — the zone's current offset, for the picker.
export function offsetLabel(tz, at = new Date()) {
  try {
    const part = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    return part ? part.value : "";
  } catch {
    return "";
  }
}
