// The studio membership: the one subscription that unlocks everything.
//
// A plan stores only what a creator decides — how long it runs, what it costs,
// and what it would cost at full price. Everything a member is shown (the
// saving, the percentage, the per-month figure) is worked out from those three
// here, so a plan can't advertise a discount its own prices don't support.

import { money } from "./stats";
import { isPublished, offerAmount, offersOf } from "./programme";

export const planLabel = (plan) =>
  plan ? `${plan.months} month${plan.months === 1 ? "" : "s"}` : "";

export const planPrice = (plan) => money(plan?.amount || 0);

// What it would have cost without the offer. Falls back to the actual price,
// which is what "no discount" means.
export const listPrice = (plan) => Math.max(Number(plan?.listPrice) || 0, Number(plan?.amount) || 0);

export const hasDiscount = (plan) => listPrice(plan) > (Number(plan?.amount) || 0);

// Rounded down, so the badge never claims more off than the prices give.
export function discountPercent(plan) {
  const list = listPrice(plan);
  if (!hasDiscount(plan) || !list) return 0;
  return Math.floor(((list - plan.amount) / list) * 100);
}

export const savingOf = (plan) => (hasDiscount(plan) ? listPrice(plan) - plan.amount : 0);

// The figure that makes two plans comparable, which is the whole reason a
// longer plan looks like better value.
export function perMonth(plan) {
  const months = Number(plan?.months) || 0;
  if (!months) return 0;
  return (Number(plan?.amount) || 0) / months;
}

export const perMonthLabel = (plan) => `${money(Math.round(perMonth(plan)))}/month`;

// Longest first: the plan a studio most wants sold leads the row.
export const sortedPlans = (plans) =>
  [...(plans || [])].sort((a, b) => (b.months || 0) - (a.months || 0));

// At most one plan can be the best seller — the flag is a highlight, and two
// highlights highlight nothing.
export const bestSellerOf = (plans) => (plans || []).find((p) => p.bestSeller) || null;

/* ---------- what each plan includes ---------- */

// Which extras a plan includes. Stored on the plan alongside its bundles, so
// one thing owns everything a plan opens — extras used to keep their own list
// of plan ids, which meant the answer lived in two places facing each other.
export const planHasExtra = (plan, featureId) =>
  planIsEverything(plan) || (plan?.extras || []).includes(featureId);

export const togglePlanExtra = (plan, featureId) => toggleInList(plan?.extras, featureId);

export const extrasOf = (plan, features) =>
  publishedOnly(
    planIsEverything(plan)
      ? orderedFeatures(features)
      : orderedFeatures(features).filter((f) => (plan?.extras || []).includes(f.id))
  );


export const orderedFeatures = (features) =>
  [...(features || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

// Bundles and extras share one sequence of positions, so a row can sit wherever
// it belongs rather than being trapped behind everything of its own kind. Both
// carry `order` from the same run of numbers.
export const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

// How many of the things on offer a given plan actually unlocks — the honest
// version of "everything included", which several plans are not.
export const featureCountFor = (features, plan) =>
  publishedOnly(features).filter((f) => planHasExtra(plan, f.id)).length;

// Extras a member can actually get. A draft is made but not on sale, so it
// counts towards nothing — "3 of 4 extras" against a list with a draft in it
// promised a fourth that nobody can be given.
export const liveFeatures = (features) => publishedOnly(orderedFeatures(features));

// New rows join the end of the shared sequence. A new bundle used to carry no
// position at all, which sorted it above everything; a new extra numbered
// itself by how many extras there were, landing on top of a bundle.
export const nextMembershipOrder = (bundles = [], features = []) =>
  Math.max(0, ...[...bundles, ...features].map((x) => Number(x?.order) || 0)) + 1;

/* ---------- bundles ---------- */
//
// A bundle is a named set of content that plans draw on. It exists on its own
// so the same set can back several plans — "Daily classes" belongs in the
// starter and the year plan alike, and describing it twice is how the two
// drift apart.
//
// A bundle is always an explicit list. "Everything" is a property of a plan,
// not of a bundle: a bundle that followed everything would be a second way to
// say the same thing, and two ways to say it is how they disagree.

export function bundleProgrammes(bundle, programmes) {
  if (!bundle) return [];
  const live = (programmes || []).filter(isPublished);
  return live.filter((p) => (bundle.programmes || []).includes(p.id));
}

export function bundleLessons(bundle, lessons) {
  if (!bundle) return [];
  const live = (lessons || []).filter((l) => l.active !== false);
  return live.filter((l) => (bundle.lessons || []).includes(l.id));
}

export const bundleSize = (bundle, programmes, lessons) =>
  bundleProgrammes(bundle, programmes).length + bundleLessons(bundle, lessons).length;

export const isEmptyBundle = (bundle, programmes, lessons) =>
  bundleSize(bundle, programmes, lessons) === 0;

export function bundleSummary(bundle, programmes, lessons) {
  const progs = bundleProgrammes(bundle, programmes).length;
  const less = bundleLessons(bundle, lessons).length;
  const parts = [];
  if (progs) parts.push(`${progs} programme${progs === 1 ? "" : "s"}`);
  if (less) parts.push(`${less} lesson${less === 1 ? "" : "s"}`);
  return parts.join(" · ") || "Nothing in it yet";
}

export const toggleInList = (list, id) =>
  (list || []).includes(id) ? (list || []).filter((x) => x !== id) : [...(list || []), id];

/* ---------- what a plan draws on ---------- */

// A plan is either everything or a chosen set of bundles. "Everything" means
// every bundle and every extra, now and later — including ones made after the
// plan was — which is why it can't have exceptions picked out of it. A plan
// with holes in it isn't everything; it's a chosen set, and that's the other
// option.
export const planIsEverything = (plan) => plan?.scope === "all";

// What a plan actually opens: only published bundles, whether the plan says
// "everything" or names them. A draft isn't live, so it can't be part of what
// someone just bought — and that holds however the plan came to reference it.
//
// Note this differs from `planHasBundle` on purpose: that answers "does the
// plan include this?" (the creator's intent, which the table shows and edits),
// while this answers "what does a member get?".
export const bundlesOf = (plan, bundles) =>
  publishedOnly(
    planIsEverything(plan)
      ? bundles
      : (plan?.bundles || []).map((id) => (bundles || []).find((b) => b.id === id)).filter(Boolean)
  );

// Whether a plan opens one bundle, and whether that can be changed.
export const planHasBundle = (plan, bundleId) =>
  planIsEverything(plan) || (plan?.bundles || []).includes(bundleId);

export const togglePlanBundle = (plan, bundleId) => toggleInList(plan?.bundles, bundleId);

// The union across every bundle a plan includes, de-duplicated — two bundles
// sharing a programme must not make it count twice.
export function planContent(plan, bundles, programmes, lessons) {
  const chosen = bundlesOf(plan, bundles);
  const progs = new Map();
  const less = new Map();
  for (const b of chosen) {
    for (const p of bundleProgrammes(b, programmes)) progs.set(p.id, p);
    for (const l of bundleLessons(b, lessons)) less.set(l.id, l);
  }
  return { programmes: [...progs.values()], lessons: [...less.values()] };
}

export function contentSummaryOf(plan, bundles, programmes, lessons) {
  const { programmes: progs, lessons: less } = planContent(plan, bundles, programmes, lessons);
  const parts = [];
  if (progs.length) parts.push(`${progs.length} programme${progs.length === 1 ? "" : "s"}`);
  if (less.length) parts.push(`${less.length} lesson${less.length === 1 ? "" : "s"}`);
  return parts.join(" · ") || "Nothing selected yet";
}

export const planIsHollow = (plan, bundles, programmes, lessons) => {
  const { programmes: progs, lessons: less } = planContent(plan, bundles, programmes, lessons);
  return progs.length === 0 && less.length === 0;
};

export const planHasProgramme = (plan, bundles, programmes, lessons, programmeId) =>
  planContent(plan, bundles, programmes, lessons).programmes.some((p) => p.id === programmeId);

export const planHasLesson = (plan, bundles, programmes, lessons, lessonId) =>
  planContent(plan, bundles, programmes, lessons).lessons.some((l) => l.id === lessonId);

/* ---------- what a plan is worth ---------- */

// How many months one purchase of an offer covers.
const offerMonths = (offer) => {
  const n = parseInt(String(offer?.length), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// What one offer costs to hold for a given stretch. A one-off covers the whole
// time for one payment; a subscription has to be renewed to match it — which is
// the only way to compare a £12/month programme against a six-month plan.
export function offerCostOver(offer, months) {
  if (!offer) return 0;
  const amount = offerAmount(offer);
  if (offer.kind !== "subscription") return amount;
  return amount * Math.max(1, Math.ceil((Number(months) || 1) / offerMonths(offer)));
}

// The cheapest way to hold one programme for that long, whichever offer that
// turns out to be — comparing against the cheapest sticker price understated a
// long plan, and the dearest would have inflated it.
export function programmeCostOver(programme, months) {
  const offers = offersOf(programme);
  if (!offers.length) return 0;
  return Math.min(...offers.map((o) => offerCostOver(o, months)));
}

export function planValue(plan, bundles, programmes, lessons) {
  const months = Number(plan?.months) || 1;
  return planContent(plan, bundles, programmes, lessons).programmes.reduce(
    (total, p) => total + programmeCostOver(p, months),
    0
  );
}

export const planSaving = (plan, bundles, programmes, lessons) =>
  Math.max(0, planValue(plan, bundles, programmes, lessons) - (Number(plan?.amount) || 0));

/* ---------- naming a plan ---------- */

// A plan can be sold as something ("Starter", "Full studio year") rather than
// as a duration. The length is still shown beside it, because it's what the
// member is committing to — so the name never has to carry it.
export const planName = (plan) => (plan?.name || "").trim() || planLabel(plan);
export const hasCustomName = (plan) => !!(plan?.name || "").trim();

/* ---------- the comparison, as members read it ---------- */

// One flat list of what a membership opens, a row per bundle and per extra,
// using their own names and descriptions. Rows are bundles rather than the
// individual programmes inside them because that's the unit a plan actually
// includes — listing the contents would make the table as long as the catalogue
// and still not say which plan opens what.
//
// A bundle no plan uses is left out: a member can't buy it, so a row of crosses
// would be noise. Drafts are left out for the same reason — they aren't on sale.
// Plans, bundles and extras all publish, the same way a programme does: made
// as a draft, visible to members only once you say so. This replaced a
// `hidden` flag, which described the symptom rather than the state — and left
// no way to say "made but not ready".
export const MEMBERSHIP_STATUS = {
  draft: { key: "draft", label: "Draft", pill: "sched" },
  published: { key: "published", label: "Published", pill: "active" },
};

export const isLiveItem = (x) => x?.status === "published";
export const isDraftItem = (x) => !isLiveItem(x);
export const publishedOnly = (list) => (list || []).filter(isLiveItem);

// Every row the creator manages, hidden ones included and marked. The member's
// table is this list minus what's hidden — one shape, filtered, so the two
// can't describe different things.
export function membershipRows({
  plans = [],
  bundles = [],
  programmes = [],
  lessons = [],
  features = [],
  includeDrafts = false,
}) {
  const rows = [];

  for (const b of includeDrafts ? bundles : publishedOnly(bundles)) {
    rows.push({
      id: `bundle:${b.id}`,
      title: b.name,
      detail: (b.description || "").trim() || bundleSummary(b, programmes, lessons),
      kind: "bundle",
      draft: isDraftItem(b),
      plans: plans.filter((p) => planHasBundle(p, b.id)).map((p) => p.id),
      // An everything plan can't have this one taken out of it.
      locked: plans.filter(planIsEverything).map((p) => p.id),
      order: b.order || 0,
      bundle: b,
      contents: [
        ...bundleProgrammes(b, programmes).map((p) => ({
          id: `p:${p.id}`,
          title: p.name,
          detail: p.type === "live" ? "Live programme" : "Recorded programme",
          kind: "programme",
        })),
        ...bundleLessons(b, lessons).map((l) => ({
          id: `l:${l.id}`,
          title: l.title,
          detail: Array.isArray(l.days) && l.days.length ? "Everyday lesson" : "One-off class",
          kind: "lesson",
        })),
      ],
    });
  }

  const featureList = includeDrafts ? orderedFeatures(features) : publishedOnly(orderedFeatures(features));
  for (const f of featureList) {
    rows.push({
      id: `extra:${f.id}`,
      title: f.title,
      detail: (f.detail || "").trim() || "Included",
      kind: "extra",
      draft: isDraftItem(f),
      plans: plans.filter((p) => planHasExtra(p, f.id)).map((p) => p.id),
      locked: plans.filter(planIsEverything).map((p) => p.id),
      order: f.order || 0,
      feature: f,
      contents: [],
    });
  }

  // One sequence across both kinds: a bundle can sit between two extras.
  return rows.sort(byOrder);
}

export function comparisonRows({ plans = [], bundles = [], programmes = [], lessons = [], features = [] }) {
  const rows = [];

  for (const b of publishedOnly(bundles)) {
    // Through planHasBundle, not the array: an everything plan opens every
    // bundle while naming none, so reading `plan.bundles` showed a dash for
    // all of them.
    const inPlans = plans.filter((p) => planHasBundle(p, b.id)).map((p) => p.id);
    if (!inPlans.length) continue;
    rows.push({
      id: `bundle:${b.id}`,
      title: b.name,
      // Falls back to what's in it, so a row is never left blank underneath.
      detail: (b.description || "").trim() || bundleSummary(b, programmes, lessons),
      kind: "bundle",
      plans: inPlans,
      order: b.order || 0,
      bundle: b,
    });
  }

  for (const f of publishedOnly(orderedFeatures(features))) {
    rows.push({
      id: `extra:${f.id}`,
      title: f.title,
      detail: (f.detail || "").trim() || "Included",
      kind: "extra",
      plans: plans.filter((p) => planHasExtra(p, f.id)).map((p) => p.id),
      order: f.order || 0,
      feature: f,
    });
  }

  return rows.sort(byOrder);
}

export const rowIncludes = (row, planId) => (row?.plans || []).includes(planId);
export const rowLocked = (row, planId) => (row?.locked || []).includes(planId);

/* ---------- tracing content back to its bundle ---------- */

// Which bundles hold a given programme or lesson. Without this the detailed
// view could say a plan opens something but never why — and "why" is the only
// thing you can act on, since content is added and removed on the bundle.

export const bundlesWithProgramme = (bundles, programmes, programmeId) =>
  (bundles || []).filter((b) => bundleProgrammes(b, programmes).some((p) => p.id === programmeId));

export const bundlesWithLesson = (bundles, lessons, lessonId) =>
  (bundles || []).filter((b) => bundleLessons(b, lessons).some((l) => l.id === lessonId));

// The bundles on *this plan* that grant it — usually one, sometimes more when
// bundles overlap, and none when the plan doesn't open it at all.
export function grantingBundles(plan, bundles, programmes, lessons, { programmeId, lessonId }) {
  const mine = bundlesOf(plan, bundles);
  if (programmeId) {
    return mine.filter((b) => bundleProgrammes(b, programmes).some((p) => p.id === programmeId));
  }
  return mine.filter((b) => bundleLessons(b, lessons).some((l) => l.id === lessonId));
}

// "In Half year via Flagship programmes" / "Not in Starter" — the sentence a
// cell should be able to say for itself.
export function grantReason(plan, bundles, programmes, lessons, target) {
  const via = grantingBundles(plan, bundles, programmes, lessons, target);
  if (!via.length) return `Not in ${planName(plan)} — add it to one of its bundles`;
  return `In ${planName(plan)} via ${via.map((b) => b.name).join(" and ")}`;
}
