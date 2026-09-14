// Pure selectors and shared metadata for programmes.
//
// A programme is exactly one of two types, which differ in HOW a member gets
// the content:
//   live      - classes at a set time. The next class is surfaced at the top of
//               the page with its own joining link, and every class carries a
//               separate link of its own.
//   recorded  - watch anytime, organised as ordered sections of videos.
//
// Not to be confused with an everyday lesson (lib/everyday.js): the line
// between them is commercial, not temporal. A programme is bought; an everyday
// video comes with the studio subscription.
//
// Access is two-tier and lives outside the programme type:
//   * the studio-wide subscription unlocks every programme, and
//   * each programme sells its own offers, which unlock only that programme.

import { formatDayMonth, fromDayInput, isFuture, isValidDate } from "./datetime";

// The two shapes a programme can take. Both are bought — that's what makes
// them programmes rather than everyday lessons — so the wording here is about
// how a member gets the content, never about who can reach it.
export const PROGRAMME_TYPES = {
  live: {
    key: "live",
    label: "Live",
    icon: "clock",
    blurb: "A course of live classes",
    detail:
      "Runs between two dates. You schedule the classes, each gets its own joining link, and the next one is pinned to the top. Best for a course with a beginning and an end — for a class that just runs week after week, use an everyday lesson instead.",
  },
  recorded: {
    key: "recorded",
    label: "Recorded",
    icon: "classes",
    blurb: "Videos to watch anytime",
    detail:
      "Sections of videos, in the order you set. Members buy it once and work through at their own pace — nothing is scheduled and nothing expires.",
  },
};

// Lifecycle. A programme is invisible to members until it is published, which
// is what stops a half-built one reaching the public page.
export const PROGRAMME_STATUS = {
  draft: { key: "draft", label: "Draft", pill: "sched", hint: "Only you can see it" },
  published: { key: "published", label: "Published", pill: "active", hint: "On your page, on sale" },
};

export const OFFER_KINDS = {
  oneoff: { key: "oneoff", label: "Pay once", hint: "One payment, access forever" },
  subscription: { key: "subscription", label: "Subscription", hint: "Renews until they cancel" },
};

export const REPEAT_PATTERNS = {
  once: { key: "once", label: "One class" },
  weekly: { key: "weekly", label: "Same day weekly" },
  weekdays: { key: "weekdays", label: "Every weekday" },
};

// The trailer a buyer watches before paying. Every programme has one — it is
// the only part of a programme that a member can see without buying it, which
// is why it sits beside the name and description rather than inside the
// content, and why publishing waits for it.
export const introVideoOf = (programme) => programme?.introVideo || "";
export const hasIntro = (programme) => !!introVideoOf(programme);

export const isLive = (programme) => programme?.type === "live";
export const isRecorded = (programme) => programme?.type === "recorded";
export const isPublished = (programme) => programme?.status === "published";

/* ---------- live ---------- */

// How long a live programme runs for.
//
// Stored as a start date plus a number of weeks — the pair a creator actually
// knows ("we start on the 6th and run for eight weeks") — with the end derived
// so the two can't drift apart. It's set before any class exists, because it's
// what decides how many classes a weekly series should create: without it the
// creator is left guessing a number.
//
// `endsOn` is exclusive (start + weeks × 7 days). `lastDay` is the day before
// it, which is what a human means by "ends on".
export function scheduleWindow(schedule) {
  const weeks = Math.round(Number(schedule?.weeks));
  const startsOn = fromDayInput(schedule?.startsOn);
  if (!startsOn || !(weeks > 0)) return null;
  const capped = Math.min(weeks, 52);
  startsOn.setHours(0, 0, 0, 0);
  const endsOn = new Date(startsOn);
  endsOn.setDate(endsOn.getDate() + capped * 7);
  const lastDay = new Date(endsOn);
  lastDay.setDate(lastDay.getDate() - 1);
  return {
    weeks: capped,
    startsOn: startsOn.toISOString(),
    endsOn: endsOn.toISOString(),
    lastDay: lastDay.toISOString(),
  };
}

// The same thing for a programme — null for anything that isn't live, since a
// recorded programme has no dates to run between.
export function runWindow(programme) {
  return isLive(programme) ? scheduleWindow(programme?.schedule) : null;
}

// "15 Sep — 12 Oct"
export function windowLabel(window) {
  if (!window) return "Not set yet";
  return `${formatDayMonth(window.startsOn)} — ${formatDayMonth(window.lastDay)}`;
}

export const hasRunWindow = (programme) => runWindow(programme) !== null;

// "15 Sep — 12 Oct"
export const runWindowLabel = (programme) => windowLabel(runWindow(programme));

export function sortedClasses(programme) {
  return [...(programme?.classes || [])].sort(
    (a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0)
  );
}

// How long a class counts as in progress — the same hour an everyday lesson
// uses, so "on now" means the same thing everywhere in the app.
const CLASS_MINS = 60;

// The class happening right now, if any. Without this the page jumped straight
// to the *next* class the moment one started, so the class members were
// actually in was the one thing the page didn't show.
export function currentClassOf(programme, now = Date.now()) {
  if (!isLive(programme)) return null;
  return (
    sortedClasses(programme).find((c) => {
      if (!c.active || !isValidDate(c.startsAt)) return false;
      const elapsed = now - new Date(c.startsAt).getTime();
      return elapsed >= 0 && elapsed < CLASS_MINS * 60000;
    }) || null
  );
}

// The class shown at the top of a live programme: the soonest active class
// still in the future. Returns null once the programme has finished running.
export function upcomingClassOf(programme, now = Date.now()) {
  if (!isLive(programme)) return null;
  return (
    sortedClasses(programme).find((c) => c.active && isFuture(c.startsAt, now)) || null
  );
}

// Every class belonging to the same recurring series. This is what makes the
// "whole series" scope on the timing and delete actions real — before there was
// no series to act on, so those controls only ever touched one class.
export function seriesOf(programme, seriesId) {
  if (!seriesId) return [];
  return (programme?.classes || []).filter((c) => c.seriesId === seriesId);
}

// Turn a start date + repeat pattern into the dates the series will occupy.
// Callers preview this before committing, so what you see is what gets created.
//
// The limit is either an explicit `count` or an `until` boundary (exclusive) —
// a live programme passes its run window, so "weekly" fills the programme and
// nobody has to work out how many classes that is.
export function expandSeries(startsAt, pattern = "once", limit = {}) {
  if (!isValidDate(startsAt)) return [];
  const { count, until } = typeof limit === "number" ? { count: limit } : limit || {};
  const stopAt = isValidDate(until) ? new Date(until).getTime() : null;
  const max = stopAt ? 366 : Math.max(1, Math.min(Number(count) || 1, 52));
  const dates = [];
  const cursor = new Date(startsAt);
  for (let i = 0; i < max; i++) {
    if (stopAt && cursor.getTime() >= stopAt) break;
    dates.push(new Date(cursor).toISOString());
    if (pattern === "once") break;
    if (pattern === "weekly") {
      cursor.setDate(cursor.getDate() + 7);
    } else if (pattern === "weekdays") {
      do {
        cursor.setDate(cursor.getDate() + 1);
      } while (cursor.getDay() === 0 || cursor.getDay() === 6);
    }
  }
  return dates;
}

// How many classes a pattern would create inside a programme's run window.
export function seriesLength(programme, startsAt, pattern) {
  const w = runWindow(programme);
  if (!w) return 0;
  return expandSeries(startsAt, pattern, { until: w.endsOn }).length;
}

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

// A one-line description of the recurrence, for the schedule header.
//
// The weekday is only claimed when EVERY class in the series actually falls on
// it — reading it off the first class alone would label a series "Fridays"
// when only its opening class is a Friday.
export function seriesSummary(programme) {
  const classes = programme?.classes || [];
  const ids = [...new Set(classes.map((c) => c.seriesId).filter(Boolean))];
  if (ids.length !== 1) return null;
  const members = classes.filter((c) => c.seriesId === ids[0]);
  if (members.length < 2) return null;
  const days = new Set(members.map((c) => new Date(c.startsAt).getDay()));
  return { count: members.length, day: days.size === 1 ? DAY_NAMES[[...days][0]] : null };
}

/* ---------- recorded ---------- */

export function orderedSections(programme) {
  return [...(programme?.sections || [])]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ ...s, videos: [...(s.videos || [])].sort((a, b) => a.order - b.order) }));
}

export function videoCount(programme) {
  return (programme?.sections || []).reduce((n, s) => n + (s.videos?.length || 0), 0);
}

export function allVideos(programme) {
  return (programme?.sections || []).flatMap((s) => s.videos || []);
}

/* ---------- pricing ---------- */

export function offersOf(programme) {
  return programme?.pricing?.offers || [];
}

// Selling it only through the studio subscription is a real answer, but it has
// to be a chosen one — an untouched programme is undecided, not studio-only.
export const isStudioOnly = (programme) => programme?.pricing?.studioOnly === true;
export const pricingDecided = (programme) =>
  offersOf(programme).length > 0 || isStudioOnly(programme);

// Cheapest headline price, used on the programme card and the public page.
// Offers store their price as a display string, so anything that needs to add
// prices up has to read the number back out of it.
export const offerAmount = (offer) => Number(String(offer?.price).replace(/[^0-9.]/g, "")) || 0;

export function leadOffer(programme) {
  const offers = offersOf(programme);
  if (!offers.length) return null;
  return [...offers].sort((a, b) => offerAmount(a) - offerAmount(b))[0];
}

// One-line summary of what a programme holds, for the card footer.
export function contentSummary(programme) {
  if (isRecorded(programme)) {
    const sections = programme.sections?.length || 0;
    const videos = videoCount(programme);
    return `${sections} section${sections === 1 ? "" : "s"} · ${videos} video${videos === 1 ? "" : "s"}`;
  }
  const classes = programme.classes?.length || 0;
  const window = runWindow(programme);
  // A live programme's dates are half of what it is, so the card says them
  // rather than making you open it to find out when it runs.
  return `${classes} class${classes === 1 ? "" : "es"}${window ? ` · ${runWindowLabel(programme)}` : ""}`;
}

/* ---------- readiness ---------- */

// What still stands between this programme and its members. The detail page
// shows this while a programme is a draft, so the page can answer "what do I do
// next?" instead of only "what is in here?".
//
// Only *required* items block publishing. Joining links never do for a live
// programme: a class weeks out doesn't have its link yet, and waiting on one
// would keep the whole programme off the page for no reason. They are reported
// so they don't get forgotten, and the upcoming-class card asks for the next
// one directly. A recorded video with no video is different — it would go on
// sale with nothing behind it, so that still blocks.
export function readiness(programme) {
  const live = isLive(programme);
  const classes = programme?.classes || [];
  const videos = allVideos(programme);
  const offers = offersOf(programme);

  const pieces = live ? classes : videos;
  const hasContent = pieces.length > 0;
  // Only active items count: a deliberately hidden video isn't an omission.
  const missing = live
    ? classes.filter((c) => c.active && !c.venue?.url)
    : videos.filter((l) => l.active && !l.video);
  const noun = live ? "class" : "video";
  const nounPlural = live ? "classes" : "videos";

  const window = runWindow(programme);

  const items = [
    // Live only, and first: the run window decides how many classes a recurring
    // series creates, so it has to exist before there is anything to schedule.
    live && {
      key: "window",
      label: "Set how long it runs",
      detail: window
        ? `${runWindowLabel(programme)} · ${window.weeks} week${window.weeks === 1 ? "" : "s"}`
        : "Needed before you can add classes",
      done: !!window,
    },
    {
      key: "content",
      label: live ? "Add at least one class" : "Add at least one video",
      detail: hasContent
        ? `${pieces.length} added`
        : live
          ? window
            ? "No classes scheduled yet"
            : "Set the dates above first"
          : "No videos yet",
      done: hasContent,
    },
    {
      key: "links",
      label: live ? "Add joining links" : "Give every video a video",
      detail: !hasContent
        ? "Add something first"
        : live
          ? missing.length
            ? `${missing.length} ${missing.length === 1 ? "class has" : "classes have"} no link yet — add them any time before each one runs`
            : "Every class has one"
          : missing.length
            ? "Members have nothing to watch"
            : "Every video has one",
      done: hasContent && missing.length === 0,
      // A reminder for live, a gate for recorded.
      optional: live,
      missing: missing.length,
      noun,
      nounPlural,
    },
    {
      key: "intro",
      label: "Add an intro video",
      detail: hasIntro(programme)
        ? introVideoOf(programme)
        : "The one thing people can watch before they buy",
      done: hasIntro(programme),
    },
    {
      key: "pricing",
      // Both answers are valid — a price of its own, or studio subscribers
      // only — but one of them has to be picked. Ticking this by default said
      // "decided" about a programme nobody had priced.
      label: "Decide how it's sold",
      detail: offers.length
        ? `${offers.map((o) => o.price).join(" · ")} · studio subscribers included`
        : isStudioOnly(programme)
          ? "Studio subscribers only — no separate price"
          : "Add a price, or say it's for studio subscribers only",
      done: pricingDecided(programme),
    },
    {
      key: "publish",
      label: "Publish to your page",
      detail: "Nothing is visible to members until you do",
      done: isPublished(programme),
    },
  ].filter(Boolean);

  // The first thing actually standing in the way, so the page can say why the
  // publish button is off instead of leaving the creator to guess.
  const blocker = items.find((i) => !i.optional && !i.done && i.key !== "publish") || null;
  const required = items.filter((i) => !i.optional);

  return {
    items,
    done: required.filter((i) => i.done).length,
    total: required.length,
    canPublish: !blocker,
    blocker,
    missingCount: missing.length,
  };
}
