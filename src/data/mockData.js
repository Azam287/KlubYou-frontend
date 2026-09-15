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

import { addDays, atOffset, dayKeyOf, monthsAgo, monthsAhead } from "../lib/datetime";
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE, partsOf } from "../lib/locale";
import { SESSION_MINS, canAttend, phaseOf, recentSessions } from "../lib/attendance";

export const initialStudio = {
  ownerName: "Maya",
  name: "Maya's Yoga Studio",
  tagline: "Vinyasa & breathwork · weekday mornings",
  about:
    "Hi, I'm Maya. I've taught vinyasa and breathwork for eight years. Join me for calm, strong weekday morning classes — live and from anywhere.",
  handle: "maya",
  // Settings. Every price is written in this currency, and every time — class
  // times, "today", this month's earnings, payout day — is this zone's clock.
  // The demo's dates are generated in it too. See lib/locale.js.
  currency: DEFAULT_CURRENCY,
  timezone: DEFAULT_TIMEZONE,
  // The public page. Only these are stored — what it sells comes from the
  // Membership and Programmes pages. See lib/page.js.
  // The picture across the top of the page, as a data URL. Empty uses a band
  // tinted from the page colours.
  coverImage: "",
  // A photo or logo for the round avatar. Empty shows the studio's initial.
  avatarImage: "",
  // A real, openly licensed video (Blender's "Big Buck Bunny") so the demo
  // player has something to play. A creator pastes their own link here.
  introVideo: "https://youtu.be/aqz-KE-bpKQ",
  // A label is optional: well-known sites are named from the URL.
  links: [
    { id: "ln1", label: "", url: "instagram.com/mayayoga" },
    { id: "ln2", label: "", url: "youtube.com/@mayayoga" },
    { id: "ln3", label: "My journal", url: "mayayoga.co.uk/journal" },
  ],
  theme: { background: "#f6f1ea", text: "#221a38", accent: "#3a2e63" },
  // Published programmes kept off the page. Empty shows them all.
  hiddenProgrammes: [],
  // The order of the sections under the name and tagline.
  sectionOrder: ["about", "video", "links", "memberships", "programmes"],
  // Sections switched off. Hidden, not deleted — their content stays.
  hiddenSections: [],
};

export const coverSwatches = [
  { id: "violet", color: "#3a2e63", gradient: "linear-gradient(120deg,#3a2e63,#241a3d)" },
  { id: "coral", color: "#F15B41", gradient: "linear-gradient(120deg,#F15B41,#D8452D)" },
  { id: "green", color: "#2E7D50", gradient: "linear-gradient(120deg,#2E7D50,#1f5637)" },
  { id: "amber", color: "#E39A2C", gradient: "linear-gradient(120deg,#E39A2C,#c97e1b)" },
];

// The membership: plans people buy, the bundles those plans open, and extra
// benefits. Every one of the three is a draft or published; only published
// ones reach members. See docs/domain.md.
//
// Bundles are named sets of content that plans draw on. The same bundle can
// back several plans, which is the point of having them separate — describing
// "the daily classes" twice is how two plans drift apart. A bundle is always an
// explicit list; "everything" is something only a plan can be.
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

export const takenHandles = ["yoga", "maya123", "studio", "flow", "admin", "test"];

/* ---------- members ---------- */

// A member points at what they bought — a Membership plan (`planId`) or one
// programme offer (`programmeId` + `offerId`) — so the members page reads its
// names and prices from those, not from copies. See lib/members.js.
//
// plan: "studio" (on a membership plan) | "programme" (bought one programme) | "none" (lead)
const member = (id, name, email, plan, opts = {}) => ({
  id,
  name,
  email,
  plan,
  status: opts.status || (plan === "none" ? "lead" : "active"),
  planId: opts.planId || null,
  programmeId: opts.programmeId || null,
  offerId: opts.offerId || null,
  joinedAt: opts.joinedAt,
  // When paid time runs out. Null for a programme bought once (lifetime).
  renewsAt: opts.renewsAt || null,
  // False once a subscription is stopped: access runs to renewsAt, then ends.
  autoRenew: opts.autoRenew ?? true,
  // Videos watched (recorded programmes). Classes attended aren't a number on
  // the member: they're attendance records, generated below (initialAttendance).
  watched: opts.watched ?? 0,
  vouchers: [],
});

// Plans: sp3 Full studio year (12 months) · sp2 Half year (6) · sp1 Starter (1).
// Offers: morning-vinyasa of1 £40 once / of2 £12 a month · breathwork-basics of4 £35 once.
export const initialMembers = [
  // --- on a membership plan ---
  member("m1", "Emma Carter", "emma@email.com", "studio", {
    planId: "sp3", joinedAt: monthsAgo(19), renewsAt: monthsAhead(5),
  }),
  member("m2", "Sam Kelly", "sam.k@email.com", "studio", {
    planId: "sp2", joinedAt: monthsAgo(13), renewsAt: monthsAhead(5),
  }),
  member("m3", "Tom Reid", "tom@email.com", "studio", {
    planId: "sp1", joinedAt: monthsAgo(13), renewsAt: atOffset(3, 9),
  }),
  member("m7", "Priya Shah", "priya@email.com", "studio", {
    planId: "sp3", joinedAt: monthsAgo(10), renewsAt: monthsAhead(2),
  }),
  member("m8", "Daniel Okoro", "dan.o@email.com", "studio", {
    // Stopped: keeps access to the end of what he paid for, then it ends.
    planId: "sp2", joinedAt: monthsAgo(8), renewsAt: monthsAhead(1), autoRenew: false,
  }),
  member("m9", "Hannah Brooks", "hannah@email.com", "studio", {
    planId: "sp1", joinedAt: monthsAgo(6), renewsAt: atOffset(5, 9),
  }),
  member("m10", "Marcus Webb", "marcus@email.com", "studio", {
    planId: "sp2", joinedAt: monthsAgo(5), renewsAt: monthsAhead(1),
  }),
  member("m11", "Sofia Ricci", "sofia@email.com", "studio", {
    planId: "sp3", joinedAt: monthsAgo(4), renewsAt: monthsAhead(8),
  }),
  member("m12", "Leo Barnes", "leo.b@email.com", "studio", {
    planId: "sp1", joinedAt: monthsAgo(3), renewsAt: atOffset(12, 9),
  }),
  member("m13", "Amara Diallo", "amara@email.com", "studio", {
    planId: "sp2", joinedAt: monthsAgo(2), renewsAt: monthsAhead(4),
  }),
  member("m14", "Ruth Nakamura", "ruth@email.com", "studio", {
    planId: "sp3", joinedAt: monthsAgo(2), renewsAt: monthsAhead(10),
  }),
  member("m15", "Chris Doyle", "chris@email.com", "studio", {
    planId: "sp1", joinedAt: atOffset(-5), renewsAt: atOffset(25, 9),
  }),

  // --- bought a programme ---
  member("m4", "Aisha Mahmood", "aisha@email.com", "programme", {
    programmeId: "morning-vinyasa", offerId: "of1", joinedAt: monthsAgo(1, 12),
  }),
  member("m16", "Grace Lam", "grace@email.com", "programme", {
    programmeId: "morning-vinyasa", offerId: "of1", joinedAt: monthsAgo(1, 20),
  }),
  member("m17", "Owen Pritchard", "owen@email.com", "programme", {
    programmeId: "breathwork-basics", offerId: "of4", joinedAt: monthsAgo(2, 8), watched: 3,
  }),
  member("m18", "Nina Fischer", "nina@email.com", "programme", {
    programmeId: "breathwork-basics", offerId: "of4", joinedAt: atOffset(-9), watched: 2,
  }),
  member("m19", "Yusuf Karim", "yusuf@email.com", "programme", {
    programmeId: "morning-vinyasa", offerId: "of2", joinedAt: monthsAgo(1, 3), renewsAt: monthsAhead(1, 3),
  }),
  member("m20", "Beatrice Cole", "bea@email.com", "programme", {
    programmeId: "breathwork-basics", offerId: "of4", joinedAt: atOffset(-2), watched: 1,
  }),

  // --- leads: signed up on the page, haven't bought ---
  member("m5", "Nadia Popescu", "nadia@email.com", "none", { joinedAt: atOffset(-4) }),
  member("m21", "Felix Andersen", "felix@email.com", "none", { joinedAt: atOffset(-1) }),
  member("m22", "Joy Adeyemi", "joy@email.com", "none", { joinedAt: atOffset(-6) }),

  // --- lapsed ---
  member("m6", "Jon Lewis", "jon@email.com", "programme", {
    // A monthly programme subscription he stopped — a programme bought once
    // can't lapse, so it isn't one of those.
    status: "inactive", programmeId: "morning-vinyasa", offerId: "of2", joinedAt: monthsAgo(3), renewsAt: monthsAgo(2), autoRenew: false,
  }),
  member("m23", "Clara Mendes", "clara@email.com", "studio", {
    status: "inactive", planId: "sp1", joinedAt: monthsAgo(9), renewsAt: monthsAgo(4), autoRenew: false,
  }),
  member("m24", "Ben Whitfield", "ben@email.com", "studio", {
    status: "inactive", planId: "sp2", joinedAt: monthsAgo(14), renewsAt: monthsAgo(1), autoRenew: false,
  }),
];

/* ---------- payments ---------- */

// `keep` isn't stored: it's always amount minus the platform fee. A payment
// points at what it paid for — a plan, or a programme offer — and its label is
// worked out from that (lib/members.js → paymentLabel), so it follows renames.
const payment = (id, memberId, target, amount, paidAt, opts = {}) => ({
  id,
  memberId,
  planId: target.planId || null,
  programmeId: target.programmeId || null,
  offerId: target.offerId || null,
  amount,
  paidAt,
  status: opts.status || "paid",
});

export const initialPayments = [
  payment("p1", "m2", { planId: "sp2" }, 92, atOffset(-2, 10)),
  payment("p2", "m4", { programmeId: "morning-vinyasa", offerId: "of1" }, 40, atOffset(-2, 14)),
  payment("p3", "m15", { planId: "sp1" }, 18, atOffset(-5, 9)),
  payment("p4", "m20", { programmeId: "breathwork-basics", offerId: "of4" }, 35, atOffset(-2, 16)),
  payment("p5", "m16", { programmeId: "morning-vinyasa", offerId: "of1" }, 40, atOffset(-7, 11)),
  payment("p6", "m14", { planId: "sp3" }, 162, atOffset(-9, 13)),
  payment("p7", "m18", { programmeId: "breathwork-basics", offerId: "of4" }, 35, atOffset(-9, 15)),
  payment("p8", "m13", { planId: "sp2" }, 92, atOffset(-12, 10)),
  payment("p9", "m19", { programmeId: "morning-vinyasa", offerId: "of2" }, 12, atOffset(-14, 18)),
  payment("p10", "m12", { planId: "sp1" }, 18, atOffset(-16, 12)),
  // Pending renewals — the Payments page's "pending" figure counts exactly
  // these, and the members page shows these two members as "Payment due".
  payment("p11", "m3", { planId: "sp1" }, 18, atOffset(-1, 9), { status: "pending" }),
  payment("p12", "m9", { planId: "sp1" }, 18, atOffset(-1, 11), { status: "pending" }),
];

/* ---------- everyday lessons ---------- */

// One list for everything that comes with the studio subscription. A lesson
// either repeats on a set of weekdays or runs once on a date — see
// lib/everyday.js for why those aren't two separate features.
//
// `mode` and the hard-coded "flow" steps are gone: a class that stored
// mode: "live" was still claiming to be live days later, and "84 joined so
// far" was a number with nothing behind it. Both are derived now, or absent.
// A calendar day `days` from today, in the studio's zone.
const dayInput = (days) => dayKeyOf(addDays(new Date(), days));

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
  // Started about twenty minutes before the app was opened, so there's always a
  // session on now and its attendance can be seen filling up. Named for no time
  // of day, since it runs whenever the demo is opened.
  (() => {
    const start = new Date(Date.now() - 20 * 60000);
    const p = partsOf(start);
    const pad = (n) => String(n).padStart(2, "0");
    return {
      id: "el5",
      title: "Drop-in Stretch",
      time: `${pad(p.hour)}:${pad(p.minute - (p.minute % 5))}`,
      days: [],
      date: dayKeyOf(start),
      venueUrl: "meet.google.com/lnch-strt-chk",
      active: true,
    };
  })(),
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
      { id: "c1", seriesId: "sr1", title: "Week 1 · Foundations", startsAt: atOffset(-3, 7), venue: { platform: "yt", url: "youtu.be/live/xk20" }, active: true },
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

/* ---------- attendance ---------- */

// A few weeks of people going through their links, so the Attendance page has
// history to show. Generated from the same rules the app uses — only members
// whose plan or purchase opens a session can appear at it — and from a hash
// rather than Math.random, so the demo reads the same on every reload.
//
// How keen each member is: the share of the sessions open to them they come to.
// Sam (m2) is deliberately rare, so "haven't come in a while" has someone in it.
const KEENNESS = { m1: 0.8, m7: 0.85, m11: 0.6, m14: 0.45, m2: 0.08, m8: 0.5, m10: 0.4, m13: 0.65, m24: 0.3, m4: 0.9, m16: 0.7, m19: 0.55 };

const unit = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Keys differ only in their last few characters, so mix the bits once more —
  // without this, neighbouring days came out nearly the same.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

function seedAttendance() {
  const now = new Date();
  const data = {
    members: initialMembers,
    plans: initialStudioPlans,
    bundles: initialBundles,
    programmes: initialProgrammes,
    lessons: initialEverydayLessons,
  };
  const out = [];
  for (const session of recentSessions(data, now)) {
    const start = new Date(session.startsAt).getTime();
    for (const m of initialMembers) {
      if (!canAttend(m, session, data)) continue;
      const key = `${m.id}|${session.id}`;
      if (unit(key) >= (KEENNESS[m.id] ?? 0.5)) continue;
      // Most arrive in the ten minutes before; about a third drift in late.
      const r = unit(`${key}|t`);
      const offset = r < 0.7 ? -10 + (r / 0.7) * 12 : 2 + ((r - 0.7) / 0.3) * 18;
      const at = start + Math.round(offset) * 60000;
      // A session on now only has the people who've arrived so far.
      if (at > now.getTime() || (phaseOf(session, now) === "held" && at > start + SESSION_MINS * 60000)) continue;
      const marked = unit(`${key}|v`) < 0.06;
      out.push({
        id: `att-${out.length + 1}`,
        sessionId: session.id,
        memberId: m.id,
        at: new Date(marked ? start : at).toISOString(),
        via: marked ? "marked" : "link",
      });
    }
  }
  return out;
}

export const initialAttendance = seedAttendance();
