// Naming a live session, and the link members use to get into it.
//
// A creator hosts wherever they like — Zoom, Google Meet, YouTube — but members
// never see that address. They get a KlubYou link, which redirects to it and
// marks them present on the way through. That redirect is the only moment the
// app can see who came, so every class and lesson has one.
//
// Nothing here imports another rule module: members.js and attendance.js both
// read these names, and neither may import the other. Only the studio's clock
// (locale.js, which imports nothing) is read, to say which day a session is on.

import { partsOf } from "./locale";

// One session of something live.
//   class:<programmeId>:<classId>  a class in a live programme — it happens once
//   lesson:<lessonId>:<yyyy-mm-dd> one day's run of an everyday lesson or one-off
// A lesson's id alone isn't enough: "Sunrise Flow" happens every morning, and
// Tuesday's attendance isn't Wednesday's.
export const dayKey = (date) => {
  const p = partsOf(date);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
};

export const classSessionId = (programmeId, classId) => `class:${programmeId}:${classId}`;
export const lessonSessionId = (lessonId, day) => `lesson:${lessonId}:${dayKey(day)}`;

// A schedule entry (lib/schedule.js) → its session id.
export const sessionIdOf = (entry) =>
  entry.kind === "programme" ? classSessionId(entry.sourceId, entry.refId) : lessonSessionId(entry.refId, entry.startsAt);

export function parseSessionId(id) {
  const [kind, a, b] = String(id || "").split(":");
  if (kind === "class" && a && b) return { kind, programmeId: a, classId: b };
  if (kind === "lesson" && a && /^\d{4}-\d{2}-\d{2}$/.test(b || "")) return { kind, lessonId: a, day: b };
  return null;
}

// Whether a session belongs to a live programme or to a lesson — for counting a
// member's classes without resolving every session.
export const isClassOf = (sessionId, programmeId) => String(sessionId).startsWith(`class:${programmeId}:`);

// The dashboard page for one session's attendance.
export const attendancePathOf = (sessionId) => `/dashboard/attendance/${encodeURIComponent(sessionId)}`;

/* ---------- the members' link ---------- */

// What a link points at. A lesson has **one link for every session** — the same
// link every morning is the promise the Everyday lessons page makes — and which
// session a click counts towards is worked out from when it happens. A class has
// its own.
export const lessonTarget = (lessonId) => ({ kind: "lesson", lessonId });
export const classTarget = (programmeId, classId) => ({ kind: "class", programmeId, classId });
export const targetOfEntry = (entry) =>
  entry.kind === "programme" ? classTarget(entry.sourceId, entry.refId) : lessonTarget(entry.refId);

// Where the links live. The page behind them — sign in, check access, mark
// present, redirect — is its own site, not part of this dashboard; the
// dashboard only hands the links out and reads back who came. Change the
// domain here and every link in the app follows.
export const JOIN_DOMAIN = "join.klubyou.co";

// "join.klubyou.co/maya/el1", "join.klubyou.co/maya/morning-vinyasa/c2". Built
// from ids, not titles, so renaming a class doesn't break a link already sent.
export const joinPathOf = (target) =>
  target.kind === "class" ? `/${target.programmeId}/${target.classId}` : `/${target.lessonId}`;

export const joinLinkOf = (handle, target) => `${JOIN_DOMAIN}/${handle}${joinPathOf(target)}`;

// Each member's own copy of the link. The `m` is what tells a click apart from
// everyone else's. (In the prototype it's their id; a real one would be an
// unguessable token, so a forwarded link can't mark someone else present.)
export const personalLinkOf = (link, memberId) => `${link}?m=${memberId}`;

/* ---------- where it's hosted ---------- */

// "Google Meet", "Zoom", "YouTube" — or the site's own name for anything else.
export function hostNameOf(url) {
  const v = String(url || "").toLowerCase();
  if (!v) return "";
  if (v.includes("zoom.")) return "Zoom";
  if (v.includes("meet.google")) return "Google Meet";
  if (v.includes("youtu")) return "YouTube";
  if (v.includes("teams.microsoft") || v.includes("teams.live")) return "Microsoft Teams";
  if (v.includes("vimeo")) return "Vimeo";
  return v.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

// Stored links are often pasted without a scheme ("zoom.us/j/8841"), which a
// browser would treat as a path on this site.
export const hostHref = (url) => (/^https?:\/\//i.test(url || "") ? url : `https://${url}`);
