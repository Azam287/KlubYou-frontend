// Attendance: members' links, who a session is for, the records, what's worked
// out from them, and the pages. See src/lib/attendance.js and lib/sessions.js.
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import AttendancePage from "../src/components/dashboard/attendance/AttendancePage.jsx";
import SessionAttendancePage from "../src/components/dashboard/attendance/SessionAttendancePage.jsx";
import LessonCard from "../src/components/dashboard/classes/LessonCard.jsx";
import ClassRow from "../src/components/dashboard/programmes/ClassRow.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import {
  initialAttendance as ATT,
  initialBundles as B,
  initialEverydayLessons as L,
  initialMembers as M,
  initialProgrammes as P,
  initialStudio as S,
  initialStudioPlans as PL,
} from "../src/data/mockData";
import {
  LATE_MINS,
  attendanceSummary,
  canAttend,
  historyOf,
  matchesSessionFilter,
  phaseOf,
  quietMembers,
  recentSessions,
  sessionOf,
  sessionReport,
  withJoin,
  withMark,
} from "../src/lib/attendance";
import {
  JOIN_DOMAIN,
  attendancePathOf,
  classSessionId,
  classTarget,
  joinLinkOf,
  lessonSessionId,
  lessonTarget,
  parseSessionId,
  personalLinkOf,
  sessionIdOf,
} from "../src/lib/sessions";
import { averageAttendance } from "../src/lib/stats";

const noop = () => {};
const MIN = 60000;
const data = { members: M, plans: PL, bundles: B, programmes: P, lessons: L, attendance: ATT };
const m = (id) => M.find((x) => x.id === id);
const now = new Date();
const iso = (t) => new Date(t).toISOString();
const inProviders = (el, path = "/") =>
  clean(renderToString(
    <ToastProvider><AppDataProvider><PageHeaderProvider>
      <MemoryRouter initialEntries={[path]}>{el}</MemoryRouter>
    </PageHeaderProvider></AppDataProvider></ToastProvider>));
const R = (el) => clean(renderToString(<ToastProvider><MemoryRouter>{el}</MemoryRouter></ToastProvider>));

/* ---- naming sessions and links ---- */
const vinyasa = P.find((p) => p.id === "morning-vinyasa");
const heldClass = vinyasa.classes.find((c) => new Date(c.startsAt) < now);
ok("a class's session is the class", parseSessionId(classSessionId("morning-vinyasa", "c1")).classId === "c1");
ok("a lesson's session is one day of it", parseSessionId(lessonSessionId("el1", new Date(2026, 8, 15, 7))).day === "2026-09-15");
ok("anything else isn't a session", parseSessionId("lesson:el1") === null && parseSessionId("nope") === null);
ok("a schedule entry names its session", sessionIdOf({ kind: "programme", sourceId: "p", refId: "c" }) === "class:p:c"
  && sessionIdOf({ kind: "lesson", refId: "el1", startsAt: iso(new Date(2026, 0, 2, 7)) }) === "lesson:el1:2026-01-02");
ok("a lesson has one link for every session", joinLinkOf("maya", lessonTarget("el1")) === `${JOIN_DOMAIN}/maya/el1`);
ok("a class has its own", joinLinkOf("maya", classTarget("morning-vinyasa", "c2")) === `${JOIN_DOMAIN}/maya/morning-vinyasa/c2`);
ok("links are built from ids, so a rename doesn't break one already sent", !joinLinkOf("maya", lessonTarget("el1")).includes("sunrise"));
ok("each member has their own copy", personalLinkOf("x/y", "m1") === "x/y?m=m1");
ok("the attendance page for a session is addressable", attendancePathOf("class:a:b") === "/dashboard/attendance/class%3Aa%3Ab");

/* ---- who a session is for ---- */
const classSession = sessionOf(classSessionId("morning-vinyasa", heldClass.id), data);
const sunrise = recentSessions(data).find((s) => s.refId === "el1" && phaseOf(s) === "held");
ok("the demo has a held class and a held lesson to test with", !!classSession && !!sunrise);
ok("a lead can't come to anything", !canAttend(m("m5"), classSession, data) && !canAttend(m("m5"), sunrise, data));
ok("someone who bought a programme can come to its classes", canAttend(m("m4"), classSession, data));
ok("...but not to everyday lessons", !canAttend(m("m4"), sunrise, data));
ok("a plan whose bundle has the programme opens its classes", canAttend(m("m1"), classSession, data) && canAttend(m("m2"), classSession, data));
ok("a plan whose bundle has the lesson opens it", canAttend(m("m2"), sunrise, data));
ok("a plan that opens nothing opens nothing (Starter's bundle is a draft)", !canAttend(m("m3"), sunrise, data) && !canAttend(m("m3"), classSession, data));
const loose = { ...sunrise, refId: "el4", sourceId: "el4", kind: "oneoff" };
ok("a lesson no bundle names comes with every membership", canAttend(m("m3"), loose, data) && canAttend(m("m1"), loose, data) && !canAttend(m("m4"), loose, data));
ok("nobody can have been at a session before they joined", !canAttend({ ...m("m1"), joinedAt: iso(now.getTime() + DAYms()) }, sunrise, data));
ok("...or after their paid time ran out", !canAttend({ ...m("m1"), status: "inactive", renewsAt: iso(new Date(sunrise.startsAt).getTime() - DAYms()) }, sunrise, data));
ok("...but lapsed members did have access before it ran out", canAttend({ ...m("m1"), status: "inactive", renewsAt: iso(now.getTime() - MIN) }, sunrise, data));
ok("a draft programme's class is for no one", !canAttend(m("m1"), { ...classSession, draft: true }, data));
ok("pausing a lesson today doesn't change who could come last week",
  canAttend(m("m2"), sunrise, { ...data, lessons: L.map((l) => (l.id === "el1" ? { ...l, active: false } : l)) }));
function DAYms() { return 86400000; }

/* ---- the demo records follow the rules ---- */
ok("the demo has attendance", ATT.length > 50);
ok("every demo record is someone who could have come", ATT.every((r) => canAttend(m(r.memberId), sessionOf(r.sessionId, data), data)));
ok("no one is recorded twice for one session", new Set(ATT.map((r) => `${r.sessionId}|${r.memberId}`)).size === ATT.length);
ok("nothing is recorded in the future", ATT.every((r) => new Date(r.at) <= now));
ok("the same demo every time (no Math.random)", !source("src/data/mockData.js").includes("Math.random("));
ok("members and classes no longer store attendance counts", M.every((x) => !("attended" in x)) && P.every((p) => (p.classes || []).every((c) => !("attended" in c))));

/* ---- recording ---- */
const sid = sunrise.id;
const start = new Date(sunrise.startsAt).getTime();
let list = withJoin([], { id: "a", sessionId: sid, memberId: "m1", at: iso(start - 2 * MIN) });
ok("going through the link records them", list.length === 1 && list[0].via === "link");
ok("going through twice is still one attendance, and the first time is kept",
  withJoin(list, { id: "b", sessionId: sid, memberId: "m1", at: iso(start + 9 * MIN) }) === list);
const marked = withMark([], { id: "c", sessionId: sid, memberId: "m2", present: true, at: sunrise.startsAt });
ok("marking present adds a record at the start, marked by you", marked.length === 1 && marked[0].via === "marked" && marked[0].at === sunrise.startsAt);
ok("marking absent removes a link record too", withMark(list, { sessionId: sid, memberId: "m1", present: false }).length === 0);
ok("marking someone present who came through the link doesn't make two", withMark(list, { id: "d", sessionId: sid, memberId: "m1", present: true, at: sunrise.startsAt }).length === 1);

/* ---- one session ---- */
const records = [
  { id: "r1", sessionId: sid, memberId: "m1", at: iso(start - 3 * MIN), via: "link" },
  { id: "r2", sessionId: sid, memberId: "m7", at: iso(start + (LATE_MINS + 5) * MIN), via: "link" },
  { id: "r3", sessionId: sid, memberId: "m11", at: sunrise.startsAt, via: "marked" },
  // Inside the grace period: on time, not late.
  { id: "r5", sessionId: sid, memberId: "m13", at: iso(start + (LATE_MINS - 2) * MIN), via: "link" },
  { id: "r0", sessionId: "lesson:el2:2020-01-01", memberId: "m7", at: iso(start - 900 * DAYms()), via: "link" },
];
const rep = sessionReport(sunrise, { ...data, attendance: records }, now);
const expected = M.filter((x) => canAttend(x, sunrise, data)).length;
ok("expected is everyone it was for", rep.expected === expected && expected > 3);
ok("came counts link joins and marks", rep.came === 4);
ok("turn-up is came out of expected", rep.rate === Math.round((4 / expected) * 100));
ok(`more than ${LATE_MINS} minutes after the start is late`, rep.late === 1 && rep.rows.find((r) => r.member.id === "m7").late === LATE_MINS + 5);
ok(`up to ${LATE_MINS} minutes after isn't late`, rep.rows.find((r) => r.member.id === "m13").late === null);
ok("on time counts link joins that weren't late; a mark is neither", rep.onTime === 2 && rep.marked === 1);
ok("first time: nothing of theirs earlier", rep.firstTimers === 3 && !rep.rows.find((r) => r.member.id === "m7").first);
ok("the timeline counts only link joins", rep.timeline.reduce((t, b) => t + b.count, 0) === 3);
ok("who came is listed first, in the order they arrived", rep.rows.slice(0, 4).map((r) => r.member.id).join() === "m1,m11,m13,m7" && !rep.rows[4].present);
const gone = sessionReport(sunrise, { ...data, attendance: [...records, { id: "r4", sessionId: sid, memberId: "m4", at: sunrise.startsAt, via: "marked" }] }, now);
ok("someone marked who has no access is still listed, and not counted towards turn-up",
  gone.rows.some((r) => r.member.id === "m4" && !r.eligible && r.present) && gone.rate === rep.rate);
ok("no one expected means no rate, not NaN", sessionReport({ ...sunrise, draft: true }, data, now).rate === null);
ok("a session is upcoming, live for an hour, then held",
  phaseOf({ startsAt: iso(now.getTime() + MIN) }, now) === "upcoming" && phaseOf({ startsAt: iso(now.getTime() - 59 * MIN) }, now) === "live"
  && phaseOf({ startsAt: iso(now.getTime() - 61 * MIN) }, now) === "held");

/* ---- across sessions ---- */
const recent = recentSessions(data, now);
ok("recent sessions are newest first", recent.every((s, i) => i === 0 || new Date(recent[i - 1].startsAt) >= new Date(s.startsAt)));
ok("...none in the future, none cancelled, no drafts", recent.every((s) => new Date(s.startsAt) <= now && !s.cancelled && !s.draft));
ok("...and a demo session is on now", recent.some((s) => phaseOf(s, now) === "live"));
const pausedData = { ...data, lessons: L.map((l) => (l.id === "el1" ? { ...l, active: false } : l)) };
ok("a paused lesson's sessions that people came to stay in the list", recentSessions(pausedData, now).some((s) => s.refId === "el1"));
const summary = attendanceSummary(recent.map((s) => sessionReport(s, data, now)));
ok("the summary adds up the sessions", summary.came === ATT.filter((r) => recent.some((s) => s.id === r.sessionId)).length && summary.sessions === recent.length);
const hist = historyOf(sunrise, data, now);
ok("history is the same lesson's sessions, oldest first", hist.length > 1 && hist.every((h) => h.session.refId === "el1")
  && hist.every((h, i) => i === 0 || new Date(hist[i - 1].session.startsAt) < new Date(h.session.startsAt)));
const quiet = quietMembers(data, now);
ok("members who could have come and haven't in a fortnight are listed", quiet.some((q) => q.member.id === "m19"));
ok("...leads and people with no access aren't", !quiet.some((q) => ["m5", "m3"].includes(q.member.id)));
ok("...and one visit takes them off", !quietMembers({ ...data, attendance: [...ATT, { id: "z", sessionId: classSession.id, memberId: "m19", at: iso(now.getTime() - DAYms()), via: "link" }] }, now)
  .some((q) => q.member.id === "m19"));
ok("the session filter picks lessons, programmes, or one of either",
  matchesSessionFilter(sunrise, "lessons") && !matchesSessionFilter(sunrise, "programmes") && matchesSessionFilter(sunrise, "lesson:el1")
  && matchesSessionFilter(classSession, "programme:morning-vinyasa") && !matchesSessionFilter(classSession, "lesson:el1"));
const vinRecords = ATT.filter((r) => r.sessionId.startsWith("class:morning-vinyasa:"));
ok("a programme's average attendance comes from records", averageAttendance(vinyasa, ATT, now.getTime()) === Math.round(vinRecords.length / vinyasa.classes.filter((c) => c.active && new Date(c.startsAt) <= now).length)
  && averageAttendance(vinyasa, [], now.getTime()) === 0);

/* ---- the pages ---- */
const page = inProviders(<AttendancePage />);
ok("the attendance page has its four figures", ["Sessions", "Average", "Turn-up", "Came late"].every((t) => page.includes(`<span>${t}</span>`)));
ok("...shows what's on now", page.includes("On now") && page.includes("Drop-in Stretch"));
ok("...lists sessions with who came", /<b>\d+<\/b> of \d+/.test(page) && page.includes("Sunrise Flow"));
ok("...names members who've gone quiet, with a way to email them", page.includes("Haven't come in 14 days") && page.includes("Yusuf Karim") && page.includes('href="mailto:yusuf'));
ok("...is paged", page.includes("Showing 1–10 of"));
ok("...can open filtered to one lesson", page.includes("Sunrise Flow<small>") && !inProviders(<AttendancePage />, "/?for=lesson:el2").includes("Sunrise Flow<small>"));

const at = (id) => inProviders(<Routes><Route path="/dashboard/attendance/:sessionId" element={<SessionAttendancePage />} /></Routes>, attendancePathOf(id));
const detail = at(sunrise.id);
ok("a session shows its members' link, not the hosting address as the link", detail.includes(`${JOIN_DOMAIN}/maya/el1`) && detail.includes("Google Meet"));
ok("...who came, with a register to mark", detail.includes("Register") && detail.includes("Mark absent") && detail.includes("Mark present"));
ok("...when they arrived, and that watch time isn't something a link can see", detail.includes("When people arrived") && detail.includes("watch time needs Zoom or"));
ok("...and how recent sessions went", detail.includes("Recent sessions"));
const upcomingClass = vinyasa.classes.find((c) => new Date(c.startsAt) > now);
const ahead = at(classSessionId("morning-vinyasa", upcomingClass.id));
ok("a class that hasn't started lists who can come, and can't be marked yet", ahead.includes("Who can come") && ahead.includes("You can mark attendance once it starts") && /<button[^>]*disabled/.test(ahead));
ok("a session whose class is gone says so", at("class:morning-vinyasa:nope").includes("isn't there any more"));

const card = R(<LessonCard item={L[0]} link={joinLinkOf(S.handle, lessonTarget(L[0].id))} latest={sessionReport(sunrise, data, now)} onEdit={noop} onToggle={noop} onDelete={noop} />);
ok("a lesson card gives the members' link and where it sends people", card.includes(`${JOIN_DOMAIN}/maya/el1`) && card.includes("→ Google Meet") && !card.includes(">meet.google.com"));
ok("...and how its last session went", /Last time: \d+ of \d+ came/.test(card));
const row = R(<ClassRow classItem={heldClass} report={sessionReport(classSession, data, now)} onCopyLink={noop} onOpenAttendance={noop} onEditLink={noop} onChangeTiming={noop} onToggleActive={noop} onDelete={noop} />);
ok("a held class says how many came, linked to its register", /\d+ of \d+ came/.test(row) && row.includes(attendancePathOf(classSession.id)));

/* ---- wiring ---- */
const store = source("src/context/AppDataContext.jsx");
ok("marking is a store action, in the value and its dependencies", (store.match(/\bmarkAttendance,/g) || []).length === 2 && (store.match(/\battendance,/g) || []).length >= 2);
ok("copy buttons for classes copy the members' link", !source("src/components/dashboard/schedule/ScheduleDay.jsx").includes("onCopyLink(e.venueUrl)")
  && !source("src/components/dashboard/classes/LessonCard.jsx").includes("onCopyLink(item.venueUrl)"));
ok("the sidebar and routes have attendance", source("src/components/layout/Sidebar.jsx").includes('"/dashboard/attendance"')
  && source("src/App.jsx").includes('path="attendance/:sessionId"'));

done();
