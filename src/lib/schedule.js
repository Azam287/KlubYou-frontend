// The studio timetable.
//
// Nothing here is stored. Every entry is derived from what already exists —
// a live programme's classes and the everyday lessons — because a schedule
// that's written down separately is a second copy of the truth, and the two
// drift the moment a class moves.

import { addDays, atClock, dayKeyOf, fromDayInput, isValidDate, sameDay, startOfDay, weekdayOf } from "./datetime";
import { currentSession, repeats } from "./everyday";
import { isLive } from "./programme";

// How close two entries have to be to count as clashing. Anything starting
// within the half hour is a conflict a creator wants to see.
const CLASH_MINS = 30;

// Days are the studio's days (lib/datetime.js), whatever zone the browser is in.
export { addDays, sameDay, startOfDay };

// Monday-first week containing `date`.
export function startOfWeek(date) {
  const d = startOfDay(date);
  const back = (weekdayOf(d) + 6) % 7;
  return addDays(d, -back);
}

const entry = (startsAt, fields) => ({ startsAt: new Date(startsAt).toISOString(), ...fields });

// Every class a live programme holds inside the range. Draft programmes are
// included — the creator is planning them, and hiding them would make the
// timetable disagree with the programme page.
function programmeEntries(programmes, from, to) {
  const out = [];
  for (const p of programmes || []) {
    if (!isLive(p)) continue;
    for (const c of p.classes || []) {
      if (!isValidDate(c.startsAt)) continue;
      const t = new Date(c.startsAt).getTime();
      if (t < from.getTime() || t >= to.getTime()) continue;
      out.push(
        entry(c.startsAt, {
          id: `${p.id}:${c.id}`,
          refId: c.id,
          title: c.title,
          venueUrl: c.venue?.url || "",
          cancelled: !c.active,
          kind: "programme",
          sourceId: p.id,
          sourceName: p.name,
          draft: p.status !== "published",
        })
      );
    }
  }
  return out;
}

// Everyday lessons, expanded across the range: a repeating one appears on each
// of its days, a one-off on its date.
function lessonEntries(lessons, from, to) {
  const out = [];
  for (const l of lessons || []) {
    if (l.active === false) continue;
    const [h, m] = String(l.time || "").split(":").map(Number);
    if (Number.isNaN(h)) continue;

    if (!repeats(l)) {
      const day = fromDayInput(l.date);
      if (!day) continue;
      const at = atClock(day, h, m || 0);
      if (at >= from && at < to) {
        out.push(
          entry(at, {
            id: `${l.id}:${l.date}`,
            refId: l.id,
            title: l.title,
            venueUrl: l.venueUrl || "",
            cancelled: false,
            kind: "oneoff",
            sourceId: l.id,
            sourceName: "One-off class",
          })
        );
      }
      continue;
    }

    for (let cursor = startOfDay(from); cursor < to; cursor = addDays(cursor, 1)) {
      if (!l.days.includes(weekdayOf(cursor))) continue;
      const at = atClock(cursor, h, m || 0);
      if (at < from || at >= to) continue;
      out.push(
        entry(at, {
          id: `${l.id}:${dayKeyOf(at)}`,
          refId: l.id,
          title: l.title,
          venueUrl: l.venueUrl || "",
          cancelled: false,
          kind: "lesson",
          sourceId: l.id,
          sourceName: "Everyday lesson",
        })
      );
    }
  }
  return out;
}

// Everything happening between two instants, soonest first, with clashes
// marked. `to` is exclusive.
export function occurrencesBetween(from, to, { programmes, lessons } = {}) {
  const all = [...programmeEntries(programmes, from, to), ...lessonEntries(lessons, from, to)].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
  );
  // Two things starting within half an hour of each other can't both be taught.
  return all.map((e, i) => {
    const near = (other) =>
      other &&
      !other.cancelled &&
      !e.cancelled &&
      Math.abs(new Date(other.startsAt) - new Date(e.startsAt)) < CLASH_MINS * 60000;
    return { ...e, clash: near(all[i - 1]) || near(all[i + 1]) };
  });
}

// The same week split into seven days, so the page can render empty ones too.
export function weekOf(date, data) {
  const from = startOfWeek(date);
  const to = addDays(from, 7);
  const entries = occurrencesBetween(from, to, data);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    days: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(from, i);
      const now = new Date();
      return {
        date: day.toISOString(),
        today: sameDay(day, now),
        // A day that has been and gone can't be acted on, and shouldn't look
        // like it can.
        past: day < startOfDay(now),
        entries: entries.filter((e) => sameDay(e.startsAt, day)),
      };
    }),
    total: entries.filter((e) => !e.cancelled).length,
    // The one thing on this page worth chasing: sessions nobody can join.
    missingLinks: entries.filter((e) => !e.cancelled && !e.venueUrl).length,
  };
}

// What's on next, across everything — the one line a creator wants at the top.
export const NEXT_UP_DAYS = 90;

export function nextUp(data, now = new Date()) {
  // Looking only a fortnight ahead used to report "nothing scheduled" for a
  // programme that starts in three weeks, which simply wasn't true.
  const ahead = occurrencesBetween(now, addDays(now, NEXT_UP_DAYS), data);
  return ahead.find((e) => !e.cancelled) || null;
}

// Anything running right this minute, so the page can say so.
export function liveNow({ programmes, lessons } = {}, now = new Date()) {
  const fromProgrammes = occurrencesBetween(addDays(now, -1), now, { programmes }).filter(
    (e) => !e.cancelled && now - new Date(e.startsAt) < 60 * 60000
  );
  const fromLessons = (lessons || []).filter((l) => currentSession(l, now));
  return [
    ...fromProgrammes,
    ...fromLessons.map((l) => ({
      id: `${l.id}:now`,
      refId: l.id,
      sourceId: l.id,
      startsAt: currentSession(l, now),
      title: l.title,
      venueUrl: l.venueUrl,
      kind: repeats(l) ? "lesson" : "oneoff",
      sourceName: repeats(l) ? "Everyday lesson" : "One-off class",
      cancelled: false,
    })),
  ];
}
