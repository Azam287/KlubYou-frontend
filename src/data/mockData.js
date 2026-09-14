// All demo/mock data for the KlubYou frontend-only prototype.
// Nothing here talks to a backend — it's just the initial state
// that AppDataContext keeps in memory for the demo.
//
// Two rules keep this honest:
//  1. Dates are generated relative to "now", so nothing is ever stale — an
//     "active" member can't end up with a renewal date in the past, and a live
//     programme always has a genuine next class.
//  2. Aggregates (member counts, plan mix, payment totals, the earnings chart,
//     per-programme revenue) are NOT stored here. They're derived in
//     lib/stats.js from these rows, so a headline figure can't contradict the
//     table printed beneath it.

import { atOffset, monthsAgo, monthsAhead } from "../lib/datetime";

export const initialStudio = {
  ownerName: "Maya",
  name: "Maya's Yoga Studio",
  tagline: "Vinyasa & breathwork · weekday mornings",
  about:
    "Hi, I'm Maya. I've taught vinyasa and breathwork for eight years. Join me for calm, strong weekday morning classes — live and from anywhere.",
  handle: "maya",
  coverGradient: "linear-gradient(120deg,#3a2e63,#241a3d)",
  // Creator-entered profile facts, not computed stats — these are things Maya
  // types about herself, so they stay editable rather than derived.
  rating: 4.9,
  classesPerWeek: 5,
};

export const coverSwatches = [
  { id: "violet", color: "#3a2e63", gradient: "linear-gradient(120deg,#3a2e63,#241a3d)" },
  { id: "coral", color: "#F15B41", gradient: "linear-gradient(120deg,#F15B41,#D8452D)" },
  { id: "green", color: "#2E7D50", gradient: "linear-gradient(120deg,#2E7D50,#1f5637)" },
  { id: "amber", color: "#E39A2C", gradient: "linear-gradient(120deg,#E39A2C,#c97e1b)" },
];

// Tier 1 of access: one studio-wide subscription that unlocks every programme.
// One subscription, sold by length. `listPrice` is what it would cost at the
// undiscounted monthly rate — the saving and the percentage are worked out from
// it rather than stored, so a badge can never outrun the prices beside it.
// The old `length` and `price` strings are gone: they duplicated `months` and
// `amount`, and would have started lying the moment a price was edited.
// `programmes: null` bundles everything published; an array bundles just those.
// The shorter plans deliberately carry less, which is what makes the longer
// ones worth their price.
// Bundles are named sets of content that plans draw on. The same bundle can
// back several plans, which is the point of having them separate — describing
// "the daily classes" twice is how two plans drift apart.
//
// `order` is shared with the extras: one sequence decides the row order of the
// membership table, so a bundle can sit between two extras.
export const initialBundles = [
  {
    id: "bn2",
    status: "published",
    order: 1,
    name: "Daily classes",
    description: "The classes that run every week, all year.",
    programmes: [],
    lessons: ["el1", "el2"],
  },
  {
    id: "bn3",
    status: "published",
    order: 3,
    name: "Flagship programmes",
    description: "The two courses people come for.",
    programmes: ["morning-vinyasa", "breathwork-basics"],
    lessons: [],
  },
  {
    id: "bn4",
    // Still being put together, so members don't see it yet.
    status: "draft",
    order: 5,
    name: "Morning starter",
    description: "One programme and the sunrise class, to try it out.",
    programmes: ["morning-vinyasa"],
    lessons: ["el1"],
  },
];

// A plan is a product: a name, a description, a length, a price, and the
// bundles it opens up. Content lives in the bundles, never on the plan.
export const initialStudioPlans = [
  {
    id: "sp3",
    status: "published",
    name: "Full studio year",
    description: "Everything, all year — every programme and every class.",
    months: 12,
    amount: 162,
    listPrice: 216,
    bestSeller: true,
    // Everything: every bundle and every extra, including ones made later.
    scope: "all",
    bundles: [],
    extras: [],
  },
  {
    id: "sp2",
    status: "published",
    name: "Half year",
    description: "The two flagship programmes, plus every daily class.",
    months: 6,
    amount: 92,
    listPrice: 108,
    scope: "picked",
    bundles: ["bn3", "bn2"],
    extras: ["mf2", "mf3", "mf4"],
  },
  {
    id: "sp1",
    status: "published",
    name: "Starter",
    description: "A month of morning flows to see if it suits you.",
    months: 1,
    amount: 18,
    listPrice: 18,
    scope: "picked",
    bundles: ["bn4"],
    extras: ["mf3"],
  },
];

// Perks that aren't a programme or a lesson. Which plans include one is stored
// on the plan, next to its bundles — an extra doesn't keep its own list.
export const initialMembershipFeatures = [
  { id: "mf1", status: "published", order: 2, title: "Monthly 1:1 check-in", detail: "30 minutes with a teacher" },
  { id: "mf2", status: "published", order: 4, title: "Printed practice plan", detail: "Posted at the start" },
  { id: "mf3", status: "published", order: 6, title: "Members-only community", detail: "" },
  { id: "mf4", status: "draft", order: 7, title: "Pause your plan anytime", detail: "Up to 4 weeks a year" },
];

export const initialPagePlans = [
  { key: "studio", label: "Studio subscription", on: true },
  { key: "programmes", label: "Individual programmes", on: true },
  { key: "dropin", label: "Drop-in", on: false },
];

export const takenHandles = ["yoga", "maya123", "studio", "flow", "admin", "test"];

/* ---------- members ---------- */

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

// plan: "studio" (subscription to everything) | "programme" (bought one) | "none" (lead)
const member = (id, name, email, plan, opts = {}) => ({
  id,
  name,
  initials: initials(name),
  email,
  plan,
  status: opts.status || "active",
  planLength: opts.planLength || null,
  programmeId: opts.programmeId || null,
  joinedAt: opts.joinedAt,
  renewsAt: opts.renewsAt || null,
  attended: opts.attended ?? 0,
  attendedOf: opts.attendedOf ?? 0,
});

export const initialMembers = [
  // --- studio subscribers ---
  member("m1", "Emma Carter", "emma@email.com", "studio", {
    planLength: "12 months", joinedAt: monthsAgo(19), renewsAt: monthsAhead(5), attended: 34, attendedOf: 38,
  }),
  member("m2", "Sam Kelly", "sam.k@email.com", "studio", {
    planLength: "6 months", joinedAt: monthsAgo(13), renewsAt: monthsAhead(5), attended: 9, attendedOf: 10,
  }),
  member("m3", "Tom Reid", "tom@email.com", "studio", {
    planLength: "1 month", joinedAt: monthsAgo(13), renewsAt: atOffset(3, 9), attended: 6, attendedOf: 8,
  }),
  member("m7", "Priya Shah", "priya@email.com", "studio", {
    planLength: "12 months", joinedAt: monthsAgo(10), renewsAt: monthsAhead(2), attended: 41, attendedOf: 44,
  }),
  member("m8", "Daniel Okoro", "dan.o@email.com", "studio", {
    planLength: "6 months", joinedAt: monthsAgo(8), renewsAt: monthsAhead(1), attended: 22, attendedOf: 30,
  }),
  member("m9", "Hannah Brooks", "hannah@email.com", "studio", {
    planLength: "1 month", joinedAt: monthsAgo(6), renewsAt: atOffset(5, 9), attended: 12, attendedOf: 16,
  }),
  member("m10", "Marcus Webb", "marcus@email.com", "studio", {
    planLength: "6 months", joinedAt: monthsAgo(5), renewsAt: monthsAhead(1), attended: 18, attendedOf: 24,
  }),
  member("m11", "Sofia Ricci", "sofia@email.com", "studio", {
    planLength: "12 months", joinedAt: monthsAgo(4), renewsAt: monthsAhead(8), attended: 25, attendedOf: 26,
  }),
  member("m12", "Leo Barnes", "leo.b@email.com", "studio", {
    planLength: "1 month", joinedAt: monthsAgo(3), renewsAt: atOffset(12, 9), attended: 7, attendedOf: 12,
  }),
  member("m13", "Amara Diallo", "amara@email.com", "studio", {
    planLength: "6 months", joinedAt: monthsAgo(2), renewsAt: monthsAhead(4), attended: 14, attendedOf: 15,
  }),
  member("m14", "Ruth Nakamura", "ruth@email.com", "studio", {
    planLength: "12 months", joinedAt: monthsAgo(2), renewsAt: monthsAhead(10), attended: 11, attendedOf: 13,
  }),
  member("m15", "Chris Doyle", "chris@email.com", "studio", {
    planLength: "1 month", joinedAt: atOffset(-5), renewsAt: atOffset(25, 9), attended: 2, attendedOf: 2,
  }),

  // --- bought a single programme ---
  member("m4", "Aisha Mahmood", "aisha@email.com", "programme", {
    programmeId: "morning-vinyasa", joinedAt: monthsAgo(1, 12), renewsAt: monthsAhead(1, 12), attended: 4, attendedOf: 5,
  }),
  member("m16", "Grace Lam", "grace@email.com", "programme", {
    programmeId: "morning-vinyasa", joinedAt: monthsAgo(1, 20), renewsAt: null, attended: 3, attendedOf: 5,
  }),
  member("m17", "Owen Pritchard", "owen@email.com", "programme", {
    programmeId: "breathwork-basics", joinedAt: monthsAgo(2, 8), renewsAt: null, attended: 4, attendedOf: 4,
  }),
  member("m18", "Nina Fischer", "nina@email.com", "programme", {
    programmeId: "breathwork-basics", joinedAt: atOffset(-9), renewsAt: null, attended: 2, attendedOf: 4,
  }),
  member("m19", "Yusuf Karim", "yusuf@email.com", "programme", {
    programmeId: "restore-sleep", joinedAt: monthsAgo(1, 3), renewsAt: monthsAhead(1, 3), attended: 3, attendedOf: 4,
  }),
  member("m20", "Beatrice Cole", "bea@email.com", "programme", {
    programmeId: "breathwork-basics", joinedAt: atOffset(-2), renewsAt: null, attended: 1, attendedOf: 4,
  }),

  // --- leads: visited the page, haven't bought ---
  member("m5", "Nadia Popescu", "nadia@email.com", "none", { status: "lead", joinedAt: atOffset(-4) }),
  member("m21", "Felix Andersen", "felix@email.com", "none", { status: "lead", joinedAt: atOffset(-1) }),
  member("m22", "Joy Adeyemi", "joy@email.com", "none", { status: "lead", joinedAt: atOffset(-6) }),

  // --- lapsed ---
  member("m6", "Jon Lewis", "jon@email.com", "programme", {
    status: "inactive", programmeId: "breathwork-basics", joinedAt: monthsAgo(15), renewsAt: monthsAgo(2), attended: 11, attendedOf: 20,
  }),
  member("m23", "Clara Mendes", "clara@email.com", "studio", {
    status: "inactive", planLength: "1 month", joinedAt: monthsAgo(9), renewsAt: monthsAgo(4), attended: 8, attendedOf: 19,
  }),
  member("m24", "Ben Whitfield", "ben@email.com", "studio", {
    status: "inactive", planLength: "6 months", joinedAt: monthsAgo(14), renewsAt: monthsAgo(1), attended: 16, attendedOf: 32,
  }),
];

/* ---------- payments ---------- */

// `keep` isn't stored: it's always amount minus the platform fee, so deriving it
// means the two columns can never disagree. `programmeId` is what makes
// per-programme revenue countable — it used to be a display string only.
const payment = (id, memberId, forWhat, amount, paidAt, opts = {}) => ({
  id,
  memberId,
  for: forWhat,
  amount,
  paidAt,
  status: opts.status || "paid",
  programmeId: opts.programmeId || null,
});

export const initialPayments = [
  payment("p1", "m2", "Studio · 6 months", 92, atOffset(-2, 10)),
  payment("p2", "m4", "Morning Vinyasa", 40, atOffset(-2, 14), { programmeId: "morning-vinyasa" }),
  payment("p3", "m15", "Studio · 1 month", 18, atOffset(-5, 9)),
  payment("p4", "m20", "Breathwork Basics", 35, atOffset(-2, 16), { programmeId: "breathwork-basics" }),
  payment("p5", "m16", "Morning Vinyasa", 40, atOffset(-7, 11), { programmeId: "morning-vinyasa" }),
  payment("p6", "m14", "Studio · 12 months", 162, atOffset(-9, 13)),
  payment("p7", "m18", "Breathwork Basics", 35, atOffset(-9, 15), { programmeId: "breathwork-basics" }),
  payment("p8", "m13", "Studio · 6 months", 92, atOffset(-12, 10)),
  payment("p9", "m19", "Restore & Sleep", 20, atOffset(-14, 18), { programmeId: "restore-sleep" }),
  payment("p10", "m12", "Studio · 1 month", 18, atOffset(-16, 12)),
  // Pending rows — the Payments page's "pending" figure counts exactly these.
  payment("p11", "m3", "Studio · 1 month", 18, atOffset(-1, 9), { status: "pending" }),
  payment("p12", "m9", "Studio · 1 month", 18, atOffset(-1, 11), { status: "pending" }),
];

/* ---------- overview activity ---------- */

export const initialActivity = [
  { id: "a1", icon: "money", text: ["Sam Kelly", " paid £92 for the 6-month studio plan"], when: "12 min ago" },
  { id: "a2", icon: "user", text: ["Beatrice Cole", " bought Breathwork Basics"], when: "1 hr ago" },
  { id: "a3", icon: "clock", text: ["Tom Reid", "'s studio plan renews in 3 days"], when: "2 hr ago" },
  { id: "a4", icon: "cert", text: ["Owen Pritchard", " finished Breathwork Basics — certificate sent"], when: "Yesterday" },
];

/* ---------- everyday lessons ---------- */

// One list for everything that comes with the studio subscription. A lesson
// either repeats on a set of weekdays or runs once on a date — see
// lib/everyday.js for why those aren't two separate features.
//
// `mode` and the hard-coded "flow" steps are gone: a class that stored
// mode: "live" was still claiming to be live days later, and "84 joined so
// far" was a number with nothing behind it. Both are derived now, or absent.
const dayInput = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const initialEverydayLessons = [
  {
    id: "el1",
    title: "Sunrise Flow",
    time: "07:00",
    days: [0, 1, 2, 3, 4, 5, 6],
    date: null,
    venueUrl: "meet.google.com/dly-srse-flw",
    active: true,
  },
  {
    id: "el2",
    title: "Evening Wind Down",
    time: "19:30",
    days: [1, 2, 3, 4, 5],
    date: null,
    venueUrl: "meet.google.com/evn-wind-dwn",
    active: true,
  },
  {
    id: "el3",
    title: "Hip Openers",
    time: "07:00",
    days: [],
    date: dayInput(2),
    venueUrl: "youtu.be/live/hipopen",
    active: true,
  },
  // Deliberately linkless, so the "add a link" state is visible in the demo.
  {
    id: "el4",
    title: "Restore & Breathe",
    time: "09:00",
    days: [],
    date: dayInput(5),
    venueUrl: "",
    active: true,
  },
];

/* ---------- programmes ---------- */

// Times are generated relative to "now" so the demo always has a genuine next
// class. `seriesId` groups a recurring series, which is what lets "change the
// whole series" and "delete the whole series" act on more than one class.
// Buyer counts and revenue are derived from members/payments, not stored.
export const initialProgrammes = [
  {
    id: "morning-vinyasa",
    name: "Morning Vinyasa",
    description: "Strong, breath-led flows to start the day.",
    introVideo: "youtu.be/intro-vinyasa",
    thumbGradient: "linear-gradient(120deg,#3a2e63,#241a3d)",
    icon: "person",
    type: "live",
    status: "published",
    pricing: {
      certificate: true,
      shareUrl: "klubyou.co/maya/morning-vinyasa",
      offers: [
        { id: "of1", kind: "oneoff", label: "Full programme", price: "£40" },
        { id: "of2", kind: "subscription", length: "1 month", price: "£12" },
      ],
    },
    // Four weekly classes at -3/+4/+11/+18 days, so the window that holds
    // them starts a week ago and runs four weeks.
    schedule: { startsOn: atOffset(-7, 0), weeks: 4 },
    classes: [
      { id: "c1", seriesId: "sr1", title: "Week 1 · Foundations", startsAt: atOffset(-3, 7), venue: { platform: "yt", url: "youtu.be/live/xk20" }, active: true, attended: 12 },
      { id: "c2", seriesId: "sr1", title: "Week 2 · Hip openers", startsAt: atOffset(4, 7), venue: { platform: "zoom", url: "zoom.us/j/8841" }, active: true },
      { id: "c3", seriesId: "sr1", title: "Week 3 · Backbends", startsAt: atOffset(11, 7), venue: { platform: "zoom", url: "zoom.us/j/8841" }, active: true },
      { id: "c4", seriesId: "sr1", title: "Week 4 · Inversions", startsAt: atOffset(18, 7), venue: { platform: "zoom", url: "zoom.us/j/8841" }, active: true },
    ],
    sections: [],
  },
  {
    id: "restore-sleep",
    name: "Restore & Sleep",
    description: "Slow evening classes to wind down the week.",
    introVideo: "",
    thumbGradient: "linear-gradient(120deg,#2E7D50,#1f5637)",
    icon: "leaf",
    // Left as a draft so the readiness checklist has something to show. One of
    // its classes has no joining link yet, which is a reminder rather than a
    // blocker — a live programme publishes without them.
    status: "draft",
    type: "live",
    pricing: {
      certificate: false,
      shareUrl: "klubyou.co/maya/restore-sleep",
      offers: [{ id: "of3", kind: "subscription", length: "1 month", price: "£20" }],
    },
    schedule: { startsOn: atOffset(0, 0), weeks: 6 },
    classes: [
      { id: "c5", seriesId: "sr2", title: "Sunday Wind Down", startsAt: atOffset(4, 19), venue: { platform: "zoom", url: "zoom.us/j/552" }, active: true },
      { id: "c6", seriesId: "sr2", title: "Midweek Reset", startsAt: atOffset(11, 19), venue: { platform: "none", url: "" }, active: true },
    ],
    sections: [],
  },
  {
    id: "breathwork-basics",
    name: "Breathwork Basics",
    description: "A self-paced introduction to breath control.",
    introVideo: "youtu.be/intro-breathwork",
    thumbGradient: "linear-gradient(120deg,#E39A2C,#c97e1b)",
    icon: "leaf",
    type: "recorded",
    status: "published",
    pricing: {
      certificate: true,
      shareUrl: "klubyou.co/maya/breathwork-basics",
      offers: [{ id: "of4", kind: "oneoff", label: "Lifetime access", price: "£35" }],
    },
    schedule: null,
    classes: [],
    sections: [
      {
        id: "s1",
        order: 1,
        title: "Getting started",
        videos: [
          { id: "l1", order: 1, title: "Why breath matters", video: "youtu.be/brth-01", duration: "6:12", active: true },
          { id: "l2", order: 2, title: "Finding your baseline", video: "youtu.be/brth-02", duration: "9:40", active: true },
        ],
      },
      {
        id: "s2",
        order: 2,
        title: "Daily practice",
        videos: [
          { id: "l3", order: 1, title: "Box breathing", video: "youtu.be/brth-03", duration: "11:05", active: true },
          { id: "l4", order: 2, title: "Extended exhale", video: "", duration: null, active: false },
        ],
      },
    ],
  },
];
