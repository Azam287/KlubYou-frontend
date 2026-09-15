// Attendance: who came to a live class or lesson, and what that says.
//
// The only thing stored is one record per person per session —
//   { id, sessionId, memberId, at, via: "link" | "marked" }
// — written when a member goes through their link, or when the creator marks
// them by hand. Everything else (who was expected, the turn-up rate, who was
// late, who's gone quiet) is worked out here, so a figure can't disagree with
// the list of names beneath it.
//
// What a link can't see: how long anyone stayed. The redirect is the last thing
// KlubYou knows about; watch time would need Zoom or YouTube connected, and
// nothing here pretends otherwise.

import { addDays, occurrencesBetween, startOfDay } from "./schedule";
import { atClock, fromDayInput } from "./datetime";
import { planHasLesson, planHasProgramme, publishedOnly } from "./membership";
import { planOf, renews } from "./members";
import { parseSessionId, sessionIdOf } from "./sessions";

const MIN = 60000;

// The links open a quarter of an hour early, so people can settle in, and stay
// open for the hour a session counts as "on" everywhere else. The join page
// itself lives on its own domain; these are what the dashboard counts by.
export const JOIN_OPENS_MINS = 15;
export const SESSION_MINS = 60;
// Coming in more than five minutes after the start counts as late.
export const LATE_MINS = 5;
// How far back the Attendance page looks.
export const HISTORY_WEEKS = 4;
// Someone with access who hasn't come for this long is worth a message.
export const QUIET_DAYS = 14;
// The join timeline's buckets, in minutes from the start.
export const TIMELINE_STEP = 5;

const time = (iso) => new Date(iso).getTime();

/* ---------- sessions ---------- */

// A session id → everything needed to show it, or null if what it belonged to
// is gone. Lessons are resolved even while paused: last week's attendance still
// happened.
export function sessionOf(sessionId, { programmes = [], lessons = [] } = {}) {
  const parsed = parseSessionId(sessionId);
  if (!parsed) return null;

  if (parsed.kind === "class") {
    const programme = programmes.find((p) => p.id === parsed.programmeId);
    const cls = programme?.classes?.find((c) => c.id === parsed.classId);
    if (!cls) return null;
    return {
      id: sessionId,
      kind: "programme",
      refId: cls.id,
      sourceId: programme.id,
      sourceName: programme.name,
      title: cls.title,
      startsAt: new Date(cls.startsAt).toISOString(),
      venueUrl: cls.venue?.url || "",
      cancelled: !cls.active,
      draft: programme.status !== "published",
    };
  }

  const lesson = lessons.find((l) => l.id === parsed.lessonId);
  if (!lesson) return null;
  const [h, m] = String(lesson.time || "00:00").split(":").map(Number);
  const repeating = (lesson.days || []).length > 0;
  return {
    id: sessionId,
    kind: repeating ? "lesson" : "oneoff",
    refId: lesson.id,
    sourceId: lesson.id,
    sourceName: repeating ? "Everyday lesson" : "One-off class",
    title: lesson.title,
    startsAt: atClock(fromDayInput(parsed.day), h || 0, m || 0).toISOString(),
    venueUrl: lesson.venueUrl || "",
    cancelled: false,
    draft: false,
  };
}

const withId = (entry) => ({ ...entry, id: sessionIdOf(entry) });

// Where a session stands right now.
export function phaseOf(session, now = new Date()) {
  const start = time(session.startsAt);
  const t = new Date(now).getTime();
  if (t < start) return "upcoming";
  if (t < start + SESSION_MINS * MIN) return "live";
  return "held";
}

/* ---------- who a session is for ---------- */

// A lesson that no published bundle mentions comes with every membership — the
// Everyday lessons page tells creators "anyone on your studio subscription can
// join everything on this page". One a bundle does name is for the plans that
// open that bundle.
function lessonOpenTo(member, lessonId, { plans = [], bundles = [], programmes = [], lessons = [] }) {
  const plan = planOf(member, plans);
  if (!plan) return false;
  const named = publishedOnly(bundles).some((b) => (b.lessons || []).includes(lessonId));
  if (!named) return true;
  // Asked as if the lesson were running: pausing it today doesn't change who
  // could come last week.
  const running = lessons.map((l) => (l.id === lessonId ? { ...l, active: true } : l));
  return planHasLesson(plan, bundles, programmes, running, lessonId);
}

// Whether a member had access to a session when it ran: they'd joined by the
// time it finished, their paid time hadn't run out before it started, and what
// they bought opens it.
export function canAttend(member, session, data = {}) {
  if (!member || member.plan === "none" || !session || session.draft) return false;
  const start = time(session.startsAt);
  if (member.joinedAt && time(member.joinedAt) > start + SESSION_MINS * MIN) return false;
  // Lapsed members had access up to their end date; one with no date never did here.
  if (renews(member, data) && member.renewsAt && time(member.renewsAt) < start) return false;
  if (member.status === "inactive" && !member.renewsAt) return false;

  if (session.kind === "programme") {
    if (member.plan === "programme") return member.programmeId === session.sourceId;
    const plan = planOf(member, data.plans);
    return !!plan && planHasProgramme(plan, data.bundles, data.programmes, data.lessons, session.sourceId);
  }
  return member.plan === "studio" && lessonOpenTo(member, session.refId, data);
}

/* ---------- recording ---------- */

// Adds one person's record for a session. Going through the link twice — a
// dropped connection, a second device — is still one attendance, and the
// first time in is the one kept.
export function withJoin(attendance, { id, sessionId, memberId, at, via = "link" }) {
  const list = attendance || [];
  if (list.some((r) => r.sessionId === sessionId && r.memberId === memberId)) return list;
  return [...list, { id, sessionId, memberId, at, via }];
}

// Marking by hand: present adds a record at the start time (there's no click to
// time it by), absent removes whatever is there — including a link join, for
// the person who clicked and never turned up.
export function withMark(attendance, { id, sessionId, memberId, present, at }) {
  const list = attendance || [];
  const without = list.filter((r) => !(r.sessionId === sessionId && r.memberId === memberId));
  if (!present) return without;
  return withJoin(without, { id, sessionId, memberId, at, via: "marked" });
}

export const recordsFor = (sessionId, attendance) => (attendance || []).filter((r) => r.sessionId === sessionId);

/* ---------- one session ---------- */

const minutesLate = (record, start) =>
  record.via === "link" ? Math.round((time(record.at) - start) / MIN) : null;

export function sessionReport(session, data = {}, now = new Date()) {
  const { members = [], attendance = [] } = data;
  const start = time(session.startsAt);
  const records = recordsFor(session.id, attendance);
  const recordOf = new Map(records.map((r) => [r.memberId, r]));

  // First time here: nothing of theirs earlier than this.
  const firstAt = new Map();
  for (const r of attendance) {
    const t = time(r.at);
    if (!firstAt.has(r.memberId) || t < firstAt.get(r.memberId)) firstAt.set(r.memberId, t);
  }

  const rows = [];
  for (const member of members) {
    const record = recordOf.get(member.id);
    const eligible = canAttend(member, session, data);
    if (!eligible && !record) continue;
    const late = record ? minutesLate(record, start) : null;
    rows.push({
      member,
      eligible,
      present: !!record,
      at: record?.at || null,
      via: record?.via || null,
      late: late !== null && late > LATE_MINS ? late : null,
      first: !!record && firstAt.get(member.id) === time(record.at),
    });
  }
  // Who came, in the order they arrived; then who didn't, by name.
  rows.sort((a, b) =>
    a.present !== b.present
      ? a.present
        ? -1
        : 1
      : a.present
        ? time(a.at) - time(b.at)
        : a.member.name.localeCompare(b.member.name)
  );

  const came = rows.filter((r) => r.present);
  const expected = rows.filter((r) => r.eligible).length;
  const cameOfExpected = came.filter((r) => r.eligible).length;

  // Link joins by five-minute step, from when the link opens to the end.
  const timeline = [];
  for (let m = -JOIN_OPENS_MINS; m < SESSION_MINS; m += TIMELINE_STEP) {
    timeline.push({
      from: m,
      count: came.filter((r) => {
        if (r.via !== "link") return false;
        const off = (time(r.at) - start) / MIN;
        return off >= m && off < m + TIMELINE_STEP;
      }).length,
    });
  }

  return {
    session,
    phase: phaseOf(session, now),
    rows,
    came: came.length,
    expected,
    rate: expected ? Math.round((cameOfExpected / expected) * 100) : null,
    late: came.filter((r) => r.late !== null).length,
    onTime: came.filter((r) => r.via === "link" && r.late === null).length,
    marked: came.filter((r) => r.via === "marked").length,
    firstTimers: came.filter((r) => r.first).length,
    timeline,
    peak: timeline.reduce((best, b) => (b.count > (best?.count || 0) ? b : best), null),
  };
}

// "7:02am · 2 min late"-style label for when someone joined, relative to the start.
export function arrivalLabel(row) {
  if (!row.present) return row.eligible ? "Didn't come" : "—";
  if (row.via === "marked") return "Marked by you";
  if (row.late) return `${row.late} min late`;
  return "On time";
}

/* ---------- across sessions ---------- */

// Every session held (or on now) in the last few weeks, newest first. Drafts
// are left out — nobody can have been at a class that was never on sale — and
// sessions with attendance are kept even if their lesson has since been paused.
export function recentSessions(data = {}, now = new Date(), weeks = HISTORY_WEEKS) {
  const until = new Date(now);
  const from = addDays(startOfDay(until), -weeks * 7);
  const seen = new Map();
  for (const e of occurrencesBetween(from, new Date(until.getTime() + 1), data)) {
    if (e.cancelled || e.draft) continue;
    const s = withId(e);
    seen.set(s.id, s);
  }
  for (const r of data.attendance || []) {
    if (seen.has(r.sessionId)) continue;
    const s = sessionOf(r.sessionId, data);
    if (s && !s.draft && time(s.startsAt) >= from.getTime() && time(s.startsAt) <= until.getTime()) seen.set(s.id, s);
  }
  return [...seen.values()].sort((a, b) => time(b.startsAt) - time(a.startsAt));
}

// Every past session of the same lesson, or of the same programme, oldest
// first — the "is it growing?" view of one session.
export function historyOf(session, data = {}, now = new Date(), limit = 8) {
  return recentSessions(data, now, HISTORY_WEEKS * 2)
    .filter((s) => (session.kind === "programme" ? s.sourceId === session.sourceId && s.kind === "programme" : s.refId === session.refId && s.kind !== "programme"))
    .slice(0, limit)
    .reverse()
    .map((s) => {
      const r = sessionReport(s, data, now);
      return { session: s, came: r.came, expected: r.expected, rate: r.rate };
    });
}

// The headline figures for the Attendance page, from the sessions listed on it.
export function attendanceSummary(reports) {
  const held = reports.filter((r) => r.phase !== "upcoming");
  const came = held.reduce((t, r) => t + r.came, 0);
  const expected = held.reduce((t, r) => t + r.expected, 0);
  const cameOfExpected = held.reduce((t, r) => t + r.rows.filter((x) => x.present && x.eligible).length, 0);
  return {
    sessions: held.length,
    came,
    average: held.length ? Math.round((came / held.length) * 10) / 10 : 0,
    rate: expected ? Math.round((cameOfExpected / expected) * 100) : null,
    late: held.reduce((t, r) => t + r.late, 0),
  };
}

// Members who could have come to something in the last fortnight and didn't —
// the people a creator most wants to check in on. Longest gap first.
export function quietMembers(data = {}, now = new Date(), days = QUIET_DAYS) {
  const t = new Date(now).getTime();
  const since = t - days * 86400000;
  const sessions = recentSessions(data, now, Math.ceil(days / 7)).filter(
    (s) => time(s.startsAt) >= since && phaseOf(s, now) === "held"
  );
  const lastAt = new Map();
  for (const r of data.attendance || []) {
    const at = time(r.at);
    if (at > (lastAt.get(r.memberId) || 0)) lastAt.set(r.memberId, at);
  }
  return (data.members || [])
    .filter((m) => !(lastAt.get(m.id) >= since))
    .filter((m) => sessions.some((s) => canAttend(m, s, data)))
    .map((m) => ({ member: m, lastAt: lastAt.has(m.id) ? new Date(lastAt.get(m.id)).toISOString() : null }))
    .sort((a, b) => (a.lastAt ? time(a.lastAt) : 0) - (b.lastAt ? time(b.lastAt) : 0));
}

// When a member last came to anything.
export function lastAttendedOf(member, attendance) {
  let last = 0;
  for (const r of attendance || []) if (r.memberId === member?.id) last = Math.max(last, time(r.at));
  return last ? new Date(last).toISOString() : null;
}

// Session filter values for the Attendance page: "all" · "lessons" ·
// "programmes" · "lesson:<id>" · "programme:<id>".
export function matchesSessionFilter(session, value) {
  if (!value || value === "all") return true;
  if (value === "lessons") return session.kind !== "programme";
  if (value === "programmes") return session.kind === "programme";
  if (value.startsWith("lesson:")) return session.kind !== "programme" && session.refId === value.slice(7);
  if (value.startsWith("programme:")) return session.kind === "programme" && session.sourceId === value.slice(10);
  return true;
}
