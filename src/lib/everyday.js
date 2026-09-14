// Everyday lessons: what your studio subscription gets you.
//
// One shape covers both kinds, because a one-off is just a lesson that doesn't
// repeat — the difference is a field, not a concept, and splitting them into
// two features meant a creator had to classify their class before describing
// it. A lesson either runs on a set of weekdays (`days`), or once on a given
// date (`date`).
//
// The dividing line against a programme is commercial, not temporal: a
// programme is bought, everything here comes with the subscription.

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKENDS = [0, 6];

// How long a session counts as in progress, for the "Live now" state.
const SESSION_MINS = 60;

export const DAY_OPTIONS = EVERY_DAY.map((day) => ({
  day,
  short: DAY_SHORT[day],
  initial: DAY_INITIAL[day],
}));

const normalise = (days) => [...new Set(days || [])].sort((a, b) => a - b);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export const repeats = (item) => normalise(item?.days).length > 0;
export const isPaused = (item) => item?.active === false;
export const needsLink = (item) => !item?.venueUrl;

// "Every day" / "Weekdays" / "Mon, Wed, Fri" / "Once" — the common patterns get
// their own name so a card doesn't spell out seven abbreviations for the default.
export function patternLabel(item) {
  const set = normalise(item?.days);
  if (!set.length) return "Once";
  if (set.length === 7) return "Every day";
  if (same(set, WEEKDAYS)) return "Weekdays";
  if (same(set, WEEKENDS)) return "Weekends";
  return set.map((d) => DAY_SHORT[d]).join(", ");
}

export function daysLabel(days) {
  return patternLabel({ days });
}

// "7:00am" from the stored "07:00". The time is a wall-clock string, not a
// timestamp: an everyday lesson happens at 7am every day, not at one instant.
export function timeLabel(time) {
  if (!time) return "—";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return "—";
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")}${ampm}`;
}

const timeParts = (time) => {
  const [h, m] = String(time || "").split(":").map(Number);
  return Number.isNaN(h) ? null : [h, m || 0];
};

// The one date a non-repeating lesson runs on, as a timestamp.
function onceAt(item) {
  const parts = timeParts(item?.time);
  if (!parts || !item?.date) return null;
  const [y, mo, d] = String(item.date).split("-").map(Number);
  if (!y) return null;
  return new Date(y, mo - 1, d, parts[0], parts[1], 0, 0);
}

// The next time it actually runs. Derived on every render rather than stored —
// a stored "next session" is wrong the moment it passes.
export function nextRun(item, now = new Date()) {
  if (!item || isPaused(item)) return null;
  const parts = timeParts(item.time);
  if (!parts) return null;

  if (!repeats(item)) {
    const at = onceAt(item);
    return at && at.getTime() > now.getTime() ? at.toISOString() : null;
  }

  const days = normalise(item.days);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(parts[0], parts[1], 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > now.getTime()) return d.toISOString();
  }
  return null;
}

// A session that started within the last hour is happening right now. This is
// what the "Live now" state reads off, instead of a stored mode that nothing
// ever changed back.
export function currentSession(item, now = new Date()) {
  if (!item || isPaused(item) || !item.venueUrl) return null;
  const parts = timeParts(item.time);
  if (!parts) return null;
  const started = repeats(item)
    ? (() => {
        const d = new Date(now);
        d.setHours(parts[0], parts[1], 0, 0);
        return normalise(item.days).includes(d.getDay()) ? d : null;
      })()
    : onceAt(item);
  if (!started) return null;
  const elapsed = now.getTime() - started.getTime();
  return elapsed >= 0 && elapsed < SESSION_MINS * 60000 ? started.toISOString() : null;
}

// A one-off whose date has passed, and which isn't running now.
export function isOver(item, now = new Date()) {
  if (repeats(item)) return false;
  const at = onceAt(item);
  return !!at && at.getTime() <= now.getTime() && !currentSession(item, now);
}

export function runsPerWeek(item) {
  return normalise(item?.days).length;
}

// Adding or removing one day, kept here so the card and the form agree.
export function toggleDay(days, day) {
  const set = normalise(days);
  return set.includes(day) ? set.filter((d) => d !== day) : normalise([...set, day]);
}

// Sort order for the page: whatever runs soonest first, finished things last.
export function byNextRun(a, b, now = new Date()) {
  const rank = (x) => {
    if (currentSession(x, now)) return 0;
    const next = nextRun(x, now);
    return next ? new Date(next).getTime() : Number.MAX_SAFE_INTEGER;
  };
  return rank(a) - rank(b);
}
