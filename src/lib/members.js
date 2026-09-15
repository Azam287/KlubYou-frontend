// Members: who has joined, what they bought, and where they stand.
//
// A member stores only what happened — which plan or which programme offer
// they bought, when they joined, when their paid time runs out, whether it
// renews, and which videos they've watched. Classes attended are attendance
// records (lib/attendance.js), not a count on the member. Everything shown about them is
// worked out here from that and from the plans, programmes and payments it
// points at, so renaming a plan or repricing an offer reaches every member.
//
// Shape:
//   plan: "studio"    → planId (a Membership plan)
//   plan: "programme" → programmeId + offerId (one programme offer)
//   plan: "none"      → a lead: signed up on the page, hasn't bought
//   joinedAt, renewsAt (null for lifetime), autoRenew (false once stopped),
//   status ("active" | "inactive" | "lead"), watched (videos),
//   vouchers: [{ id, code, percent, createdAt }]

import { formatDayMonth, formatMonthYear } from "./datetime";
import { allVideos, isLive, isRecorded, offerPrice, offersOf, sortedClasses } from "./programme";
import { planLabel, planName, planPrice } from "./membership";
import { matchesQuery } from "./search";
import { isClassOf } from "./sessions";

export const DAY = 86400000;
export const RENEWS_SOON_DAYS = 7;

const time = (iso) => (iso ? new Date(iso).getTime() : NaN);

/* ---------- what they bought ---------- */

export const planOf = (member, plans) =>
  member?.plan === "studio" ? (plans || []).find((p) => p.id === member.planId) || null : null;

export const programmeOf = (member, programmes) =>
  member?.plan === "programme"
    ? (programmes || []).find((p) => p.id === member.programmeId) || null
    : null;

export const offerOf = (member, programmes) =>
  offersOf(programmeOf(member, programmes)).find((o) => o.id === member.offerId) || null;

// Lifetime: a programme bought once. There's no end date and nothing to renew,
// which is why it can't lapse, be stopped, or be gifted days.
export const isLifetime = (member, { programmes } = {}) =>
  member?.plan === "programme" && offerOf(member, programmes)?.kind !== "subscription";

// Paid time that runs out and renews: every membership plan, and programme
// subscriptions.
export const renews = (member, ctx = {}) =>
  member?.plan === "studio" || (member?.plan === "programme" && !isLifetime(member, ctx));

// The access column: what they have, in the words the rest of the app uses.
export function accessOf(member, { plans = [], programmes = [] } = {}) {
  if (member?.plan === "studio") {
    const plan = planOf(member, plans);
    return plan
      ? { kind: "plan", title: planName(plan), detail: `Membership · ${planLabel(plan)}`, plan }
      : { kind: "plan", title: "A plan you no longer sell", detail: "Membership", missing: true };
  }
  if (member?.plan === "programme") {
    const programme = programmeOf(member, programmes);
    if (!programme) return { kind: "programme", title: "A programme you removed", detail: "Programme", missing: true };
    const offer = offerOf(member, programmes);
    const detail = !offer
      ? "Programme"
      : offer.kind === "subscription"
        ? `Programme · ${offerPrice(offer)}/month`
        : `Programme · bought once, ${offerPrice(offer)}`;
    return { kind: "programme", title: programme.name, detail, programme, offer };
  }
  return { kind: "none", title: "Not bought yet", detail: "Signed up on your page" };
}

/* ---------- where they stand ---------- */

// Whether their access has run out. Stored status can say so, and so can a
// renewal date that's already passed — a membership doesn't stay "active" just
// because nobody updated a field.
export function hasEnded(member, ctx = {}, now = Date.now()) {
  if (member?.plan === "none") return false;
  if (member?.status === "inactive") return true;
  return renews(member, ctx) && !!member.renewsAt && time(member.renewsAt) < now;
}

export const paymentsOf = (member, payments) =>
  (payments || [])
    .filter((p) => p.memberId === member?.id)
    .sort((a, b) => time(b.paidAt) - time(a.paidAt));

export const hasPaymentDue = (member, payments) =>
  paymentsOf(member, payments).some((p) => p.status === "pending");

// One word for where a member stands, most urgent first.
export const MEMBER_STATES = {
  due: { key: "due", label: "Payment due", pill: "pending", tip: "A renewal payment hasn't gone through yet" },
  ending: { key: "ending", label: "Ending", pill: "expiring", tip: "Won't renew — access ends on the date shown" },
  soon: { key: "soon", label: "Renews soon", pill: "expiring", tip: `Renews in the next ${RENEWS_SOON_DAYS} days` },
  active: { key: "active", label: "Active", pill: "active", tip: "Has access" },
  inactive: { key: "inactive", label: "Inactive", pill: "lapsed", tip: "Their access has ended" },
  lead: { key: "lead", label: "Lead", pill: "lead", tip: "Signed up on your page but hasn't bought anything" },
};

export function stateOf(member, ctx = {}, now = Date.now()) {
  if (member?.plan === "none") return MEMBER_STATES.lead;
  if (hasEnded(member, ctx, now)) return MEMBER_STATES.inactive;
  if (hasPaymentDue(member, ctx.payments)) return MEMBER_STATES.due;
  if (renews(member, ctx) && member.autoRenew === false) return MEMBER_STATES.ending;
  if (renews(member, ctx) && member.renewsAt && time(member.renewsAt) - now <= RENEWS_SOON_DAYS * DAY) {
    return MEMBER_STATES.soon;
  }
  return MEMBER_STATES.active;
}

// "Renews in 3 days", "Ends 12 Oct", "Lifetime access", "Ended 4 Aug".
export function renewalOf(member, ctx = {}, now = Date.now()) {
  if (member?.plan === "none") return { kind: "none", label: "—" };
  if (isLifetime(member, ctx)) return { kind: "lifetime", label: "Lifetime access" };
  if (!member.renewsAt) return { kind: "none", label: "—" };
  const at = time(member.renewsAt);
  if (hasEnded(member, ctx, now)) return { kind: "ended", label: `Ended ${formatDayMonth(member.renewsAt)}`, at };
  const days = Math.ceil((at - now) / DAY);
  const when = days <= 1 ? "tomorrow" : days <= 30 ? `in ${days} days` : formatDayMonth(member.renewsAt);
  return member.autoRenew === false
    ? { kind: "ends", label: `Ends ${when}`, at }
    : { kind: "renews", label: `Renews ${when}`, at };
}

/* ---------- attendance and progress ---------- */

// What they've done with what they bought. Live access counts classes; a
// recorded programme counts videos watched against the videos it has — "4 / 4
// attended" meant nothing for something you watch.
export function progressOf(member, { programmes = [], attendance = [] } = {}, now = Date.now()) {
  if (member?.plan === "none") return { kind: "none", label: "—" };

  if (member.plan === "programme") {
    const programme = programmeOf(member, programmes);
    if (!programme) return { kind: "none", label: "—" };

    if (isRecorded(programme)) {
      const total = allVideos(programme).filter((v) => v.active).length;
      const done = Math.min(member.watched || 0, total);
      return {
        kind: "videos",
        done,
        total,
        label: total ? `${done} of ${total} videos` : "No videos yet",
        complete: total > 0 && done === total,
      };
    }

    if (isLive(programme)) {
      // Classes held since they joined — the ones they could have been at.
      const joined = time(member.joinedAt) || 0;
      const held = sortedClasses(programme).filter(
        (c) => c.active && time(c.startsAt) <= now && time(c.startsAt) >= joined
      ).length;
      const done = Math.min(
        attendance.filter((r) => r.memberId === member.id && isClassOf(r.sessionId, programme.id)).length,
        held
      );
      return { kind: "classes", done, total: held, label: held ? `${done} of ${held} classes` : "No classes held yet" };
    }
  }

  // A membership opens everyday lessons that run every day, so there's no fair
  // "out of" — just how many they've come to. Counted from attendance records
  // (lib/attendance.js); it used to be a number typed into the member.
  const n = attendance.filter((r) => r.memberId === member?.id).length;
  return { kind: "attended", done: n, label: n ? `${n} class${n === 1 ? "" : "es"} attended` : "No classes yet" };
}

/* ---------- finding members ---------- */

export const STATE_FILTERS = [
  { key: "all", label: "All", tip: "Everyone who has signed up" },
  { key: "active", label: "Active", tip: "Everyone with access right now" },
  { key: "renewing", label: "Renewing soon", tip: `Renewing or ending in the next ${RENEWS_SOON_DAYS} days` },
  { key: "due", label: "Payment due", tip: "A renewal payment hasn't gone through" },
  { key: "inactive", label: "Inactive", tip: "Their access has ended" },
  { key: "lead", label: "Leads", tip: "Signed up on your page, not bought yet" },
];

const inStateFilter = (state, key) =>
  key === "all" ||
  (key === "active" && ["active", "soon", "ending", "due"].includes(state.key)) ||
  (key === "renewing" && ["soon", "ending"].includes(state.key)) ||
  state.key === key;

export function stateCounts(members, ctx = {}, now = Date.now()) {
  const counts = Object.fromEntries(STATE_FILTERS.map((f) => [f.key, 0]));
  for (const m of members || []) {
    const s = stateOf(m, ctx, now);
    for (const f of STATE_FILTERS) if (inStateFilter(s, f.key)) counts[f.key] += 1;
  }
  return counts;
}

// Access filter values: "all" · "plans" · "plan:<id>" · "programmes" ·
// "programme:<id>" · "none".
export function matchesAccess(member, value) {
  if (!value || value === "all") return true;
  if (value === "plans") return member.plan === "studio";
  if (value === "programmes") return member.plan === "programme";
  if (value === "none") return member.plan === "none";
  if (value.startsWith("plan:")) return member.plan === "studio" && member.planId === value.slice(5);
  if (value.startsWith("programme:")) return member.plan === "programme" && member.programmeId === value.slice(10);
  return true;
}

// Name or email, by the shared search rule (lib/search.js).
export const matchesSearch = (member, query) => matchesQuery([member.name, member.email], query);

export function filterMembers(members, { state = "all", access = "all", search = "" } = {}, ctx = {}, now = Date.now()) {
  return (members || []).filter(
    (m) => inStateFilter(stateOf(m, ctx, now), state) && matchesAccess(m, access) && matchesSearch(m, search)
  );
}

// Sort by name, join date or renewal. Members with no renewal date (lifetime,
// leads) go last whichever way renewal is sorted — they have nothing to compare.
export function sortMembers(members, key = "joined", dir = "desc", ctx = {}) {
  const sign = dir === "asc" ? 1 : -1;
  return [...(members || [])].sort((a, b) => {
    if (key === "name") return sign * a.name.localeCompare(b.name);
    if (key === "renewal") {
      const ra = renews(a, ctx) && a.renewsAt ? time(a.renewsAt) : null;
      const rb = renews(b, ctx) && b.renewsAt ? time(b.renewsAt) : null;
      if (ra === null && rb === null) return 0;
      if (ra === null) return 1;
      if (rb === null) return -1;
      return sign * (ra - rb);
    }
    return sign * ((time(a.joinedAt) || 0) - (time(b.joinedAt) || 0));
  });
}

/* ---------- the summary ---------- */

export function memberSummary(members, ctx = {}, now = Date.now()) {
  const counts = stateCounts(members, ctx, now);
  const joinedThisWeek = (members || []).filter((m) => now - (time(m.joinedAt) || 0) <= 7 * DAY).length;
  const everPaid = counts.active + counts.inactive;
  return {
    active: counts.active,
    joinedThisWeek,
    renewing: counts.renewing,
    due: counts.due,
    retention: everPaid ? Math.round((counts.active / everPaid) * 100) : 0,
  };
}

/* ---------- actions ---------- */

export const initialsOf = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

export const GIFT_OPTIONS = [7, 14, 30];

// Only paid time that renews can be extended: a lifetime programme has no end
// to push back, and access that has already ended would need a new purchase.
export const canGift = (member, ctx = {}, now = Date.now()) =>
  renews(member, ctx) && !!member.renewsAt && !hasEnded(member, ctx, now);

export const giftedRenewal = (member, days) =>
  new Date(time(member.renewsAt) + days * DAY).toISOString();

export const canStop = (member, ctx = {}, now = Date.now()) =>
  renews(member, ctx) && !hasEnded(member, ctx, now) && member.autoRenew !== false;

export const canResume = (member, ctx = {}, now = Date.now()) =>
  renews(member, ctx) && !hasEnded(member, ctx, now) && member.autoRenew === false;

export const VOUCHER_OPTIONS = [10, 20, 50];

// "EMMA20", "EMMA20B" for a second one at the same amount — short enough to
// read out, and never the same code twice for one member.
export function voucherCode(member, percent) {
  const base = `${(member.name.split(/\s+/)[0] || "MEMBER").replace(/[^a-z]/gi, "").toUpperCase().slice(0, 8)}${percent}`;
  const taken = new Set((member.vouchers || []).map((v) => v.code));
  if (!taken.has(base)) return base;
  for (let i = 0; i < 26; i++) {
    const code = `${base}${String.fromCharCode(66 + i)}`;
    if (!taken.has(code)) return code;
  }
  return `${base}${(member.vouchers || []).length + 1}`;
}

// An email to the member, opened in the creator's own mail app — there's no
// sending from here, so it doesn't pretend there is.
export const mailtoFor = (member, { subject = "", body = "" } = {}) =>
  `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/* ---------- payments, named ---------- */

// "Full studio year · 12 months", "Morning Vinyasa · Full programme". Payments
// point at the plan or offer they paid for, so the label follows a rename.
export function paymentLabel(payment, { plans = [], programmes = [] } = {}) {
  if (payment?.planId) {
    const plan = (plans || []).find((p) => p.id === payment.planId);
    return plan ? `${planName(plan)} · ${planLabel(plan)}` : "Membership plan (no longer sold)";
  }
  if (payment?.programmeId) {
    const programme = (programmes || []).find((p) => p.id === payment.programmeId);
    if (!programme) return "Programme (removed)";
    const offer = offersOf(programme).find((o) => o.id === payment.offerId);
    return offer ? `${programme.name} · ${offer.label || (offer.kind === "subscription" ? "Subscription" : "Bought once")}` : programme.name;
  }
  return "Payment";
}

export const joinedLabel = (member) =>
  member?.joinedAt ? `${member.plan === "none" ? "Signed up" : "Joined"} ${formatMonthYear(member.joinedAt)}` : "—";

export const planPriceOf = (member, ctx) => {
  const plan = planOf(member, ctx.plans);
  return plan ? planPrice(plan) : "";
};
