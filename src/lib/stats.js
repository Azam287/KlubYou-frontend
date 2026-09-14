// Every headline number on the dashboard is computed here from the underlying
// members / payments / programmes lists.
//
// These used to be stored as their own literals (initialStats, planMix,
// paymentStats), which let them drift out of step with the rows rendered right
// next to them — the payments page claimed "3 payments" pending while the table
// below it showed one. Deriving them makes that class of contradiction
// impossible rather than merely fixed.

import { formatMonthYear, isFuture, sameMonth } from "./datetime";
import { allVideos, isLive, sortedClasses } from "./programme";

export const FEE_RATE = 0.1;
export const FEE_LABEL = `${Math.round(FEE_RATE * 100)}%`;

export const money = (n) =>
  `£${Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
export const money2 = (n) => `£${Number(n || 0).toFixed(2)}`;

export const creatorKeeps = (amount) => amount * (1 - FEE_RATE);

/* ---------- members ---------- */

export function memberStats(members, now = Date.now()) {
  const active = members.filter((m) => m.status === "active");
  const inactive = members.filter((m) => m.status === "inactive");
  const leads = members.filter((m) => m.status === "lead");
  const studio = active.filter((m) => m.plan === "studio");
  const programme = active.filter((m) => m.plan === "programme");

  // "Joined this week" is real information because members carry a join date.
  const weekAgo = now - 7 * 86400000;
  const joinedThisWeek = members.filter(
    (m) => m.joinedAt && new Date(m.joinedAt).getTime() >= weekAgo
  ).length;

  const expiring = active.filter(
    (m) => m.renewsAt && isFuture(m.renewsAt, now) && new Date(m.renewsAt).getTime() - now <= 7 * 86400000
  );

  const retained = active.length + inactive.length;
  return {
    total: members.length,
    active: active.length,
    inactive: inactive.length,
    leads: leads.length,
    studio: studio.length,
    programme: programme.length,
    joinedThisWeek,
    expiring: expiring.length,
    retentionRate: retained ? Math.round((active.length / retained) * 100) : 0,
  };
}

export function isExpiring(member, now = Date.now()) {
  return (
    member.status === "active" &&
    member.renewsAt &&
    isFuture(member.renewsAt, now) &&
    new Date(member.renewsAt).getTime() - now <= 7 * 86400000
  );
}

// How many people bought this one programme outright (as opposed to reaching it
// through the studio-wide subscription).
export function programmeBuyers(members, programmeId) {
  return members.filter((m) => m.plan === "programme" && m.programmeId === programmeId).length;
}

export function planMixOf(members) {
  const s = memberStats(members);
  return [
    { key: "studio", label: "Studio subscriptions", value: s.studio, color: "#F15B41" },
    { key: "programmes", label: "Single programmes", value: s.programme, color: "#221A38" },
    { key: "leads", label: "Leads", value: s.leads, color: "#C9BFE0" },
  ];
}

/* ---------- payments ---------- */

export function paymentTotals(payments, now = new Date()) {
  const paid = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  const paidThisMonth = paid.filter((p) => sameMonth(p.paidAt, now));

  const sum = (list) => list.reduce((t, p) => t + p.amount, 0);
  const receivedThisMonth = sum(paidThisMonth);

  return {
    received: receivedThisMonth,
    pending: sum(pending),
    pendingCount: pending.length,
    fee: receivedThisMonth * FEE_RATE,
    nextPayout: creatorKeeps(receivedThisMonth),
  };
}

// Month-by-month totals for the earnings chart, so the line and the "earnings
// this month" card are two views of the same rows rather than unrelated data.
export function monthlyEarnings(payments, months = 6, now = new Date()) {
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const amount = payments
      .filter((p) => p.status === "paid" && sameMonth(p.paidAt, ref))
      .reduce((t, p) => t + p.amount, 0);
    out.push({ key: formatMonthYear(ref.toISOString()), month: formatMonthYear(ref.toISOString()).split(" ")[0], amount });
  }
  return out;
}

export function percentChange(series) {
  if (series.length < 2) return null;
  const last = series[series.length - 1].amount;
  const prev = series[series.length - 2].amount;
  if (!prev) return null;
  return Math.round(((last - prev) / prev) * 100);
}

/* ---------- per-programme ---------- */

// Real revenue per programme, which only works because payments carry a
// programmeId. They used to store the programme's name as a display string,
// which could not be counted against anything.
export function programmeRevenue(payments, programmeId) {
  return payments
    .filter((p) => p.status === "paid" && p.programmeId === programmeId)
    .reduce((t, p) => t + p.amount, 0);
}

export function programmeSales(payments, programmeId) {
  return payments.filter((p) => p.status === "paid" && p.programmeId === programmeId).length;
}

export function classesRemaining(programme, now = Date.now()) {
  return (programme?.classes || []).filter((c) => c.active && isFuture(c.startsAt, now)).length;
}

export function classesHeld(programme, now = Date.now()) {
  return (programme?.classes || []).filter((c) => !isFuture(c.startsAt, now)).length;
}

// Average heads per class actually held. Classes that haven't run yet carry no
// attendance, so they're excluded rather than counted as zero.
export function averageAttendance(programme, now = Date.now()) {
  const held = (programme?.classes || []).filter(
    (c) => !isFuture(c.startsAt, now) && typeof c.attended === "number"
  );
  if (!held.length) return null;
  return Math.round(held.reduce((t, c) => t + c.attended, 0) / held.length);
}

// Total runtime of a recorded programme, from each video's "m:ss" duration.
export function totalRuntime(programme) {
  const seconds = allVideos(programme).reduce((t, l) => {
    if (!l.duration) return t;
    const [m, s] = String(l.duration).split(":").map(Number);
    return t + (m || 0) * 60 + (s || 0);
  }, 0);
  if (!seconds) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function nextClassLabel(programme, now = Date.now()) {
  if (!isLive(programme)) return null;
  const next = sortedClasses(programme).find((c) => c.active && isFuture(c.startsAt, now));
  return next ? next.startsAt : null;
}
