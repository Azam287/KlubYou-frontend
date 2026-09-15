// Every headline number on the dashboard is computed here from the underlying
// members / payments / programmes lists.
//
// These used to be stored as their own literals (initialStats, planMix,
// paymentStats), which let them drift out of step with the rows rendered right
// next to them — the payments page claimed "3 payments" pending while the table
// below it showed one. Deriving them makes that class of contradiction
// impossible rather than merely fixed.

import { formatMonthYear, isFuture, sameMonth, startOfMonth } from "./datetime";
import { allVideos, isLive, sortedClasses } from "./programme";
import { classSessionId } from "./sessions";

export const FEE_RATE = 0.1;
export const FEE_LABEL = `${Math.round(FEE_RATE * 100)}%`;

// Written in the studio's currency (lib/locale.js). Re-exported here because
// most of the app already imports them from stats.
export { money, money2 } from "./locale";

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
    const ref = startOfMonth(now, -i);
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

// Average heads per class actually held, from attendance records. Classes that
// haven't run yet are excluded rather than counted as zero; a cancelled one
// wasn't held. (It used to read an `attended` number typed into each class.)
export function averageAttendance(programme, attendance = [], now = Date.now()) {
  const held = (programme?.classes || []).filter((c) => c.active && !isFuture(c.startsAt, now));
  if (!held.length) return null;
  const came = (attendance || []).filter((r) =>
    held.some((c) => r.sessionId === classSessionId(programme.id, c.id))
  ).length;
  return Math.round(came / held.length);
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
