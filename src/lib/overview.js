// The overview: how the studio is doing, what needs doing, and what's next.
//
// Nothing here is stored. Every figure, to-do and activity line is worked out
// from the same members, payments, plans, programmes and lessons the other
// pages show — so the overview can't say something those pages don't. It used
// to carry its own activity feed ("Sam paid £92 · 12 min ago"), written once and
// wrong the next day.

import { formatDayMonth, formatWhen } from "./datetime";
import { isPublished, readiness } from "./programme";
import { planIsHollow, planName, publishedOnly } from "./membership";
import { addDays, liveNow, occurrencesBetween } from "./schedule";
import { paymentLabel, planOf, stateOf } from "./members";
import { money } from "./stats";
import { pageChanged } from "./page";
import { partsOf, zonedDate } from "./locale";

const DAY = 86400000;
const time = (iso) => (iso ? new Date(iso).getTime() : NaN);

/* ---------- earnings, compared fairly ---------- */

// This month so far against last month *up to the same day*. Comparing a
// half-finished month with a whole one made every month look like it was
// falling, right up until the last day.
export function earningsToDate(payments, now = new Date()) {
  const paid = (payments || []).filter((p) => p.status === "paid");
  // Months and days in the studio's zone, so "this month" starts at its midnight.
  const p = partsOf(now);
  const start = zonedDate(p.year, p.month, 1).getTime();
  const lastStart = zonedDate(p.year, p.month - 1, 1).getTime();
  // The same day last month, capped to that month's length (31 Mar → 28 Feb).
  const lastMonthDays = partsOf(zonedDate(p.year, p.month, 0, 12)).day;
  const sameDay = zonedDate(p.year, p.month - 1, Math.min(p.day, lastMonthDays), p.hour, p.minute).getTime();
  const sum = (from, to) => paid.filter((p) => time(p.paidAt) >= from && time(p.paidAt) <= to).reduce((t, p) => t + p.amount, 0);
  const thisMonth = sum(start, now.getTime());
  const lastMonthSoFar = sum(lastStart, sameDay);
  return {
    thisMonth,
    lastMonthSoFar,
    change: lastMonthSoFar ? Math.round(((thisMonth - lastMonthSoFar) / lastMonthSoFar) * 100) : null,
  };
}

/* ---------- who's here ---------- */

// People by what they're on: each membership plan by name, then programme
// buyers, then leads. Only people with access count towards a plan — someone
// whose membership ended isn't on it any more.
const PALETTE = ["#F15B41", "#3a2e63", "#6d4bc3", "#e39a2c", "#2e7d50", "#1f5f8b"];

export function membersByPlan(members, ctx = {}, now = Date.now()) {
  const has = (m) => !["lead", "inactive"].includes(stateOf(m, ctx, now).key);
  const onPlans = new Map();
  let programmes = 0;
  let leads = 0;
  let removed = 0;
  for (const m of members || []) {
    if (m.plan === "none") {
      leads += 1;
      continue;
    }
    if (!has(m)) continue;
    if (m.plan === "programme") programmes += 1;
    else {
      const plan = planOf(m, ctx.plans);
      if (plan) onPlans.set(plan.id, (onPlans.get(plan.id) || 0) + 1);
      else removed += 1;
    }
  }
  const segments = (ctx.plans || [])
    .filter((p) => onPlans.get(p.id))
    .map((p, i) => ({ key: `plan:${p.id}`, label: planName(p), value: onPlans.get(p.id), color: PALETTE[i % PALETTE.length] }));
  if (removed) segments.push({ key: "plan:removed", label: "Plans you no longer sell", value: removed, color: "#9a93ab" });
  if (programmes) segments.push({ key: "programmes", label: "Bought a programme", value: programmes, color: "#221A38" });
  if (leads) segments.push({ key: "leads", label: "Leads", value: leads, color: "#C9BFE0" });
  return segments;
}

/* ---------- what needs doing ---------- */

// The short list of things only the creator can act on, most pressing first.
// Each says how many, what it means, and where to go. An empty list is the
// good outcome, and the page says so.
export function attentionItems(data, now = new Date()) {
  const { members = [], payments = [], plans = [], programmes = [], lessons = [], studio, publishedPage } = data;
  const ctx = { plans, programmes, payments };
  const items = [];
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const due = (payments || []).filter((p) => p.status === "pending");
  if (due.length) {
    items.push({
      key: "due",
      tone: "warn",
      title: `${plural(due.length, "payment hasn't", "payments haven't")} gone through`,
      detail: `${money(due.reduce((t, p) => t + p.amount, 0))} waiting — remind them or mark it paid once it arrives`,
      to: "/dashboard/payments",
      action: "Open payments",
    });
  }

  // Classes in the next week that nobody can join yet.
  const week = occurrencesBetween(now, addDays(now, 7), { programmes, lessons }).filter((e) => !e.cancelled);
  const linkless = week.filter((e) => !e.venueUrl);
  if (linkless.length) {
    items.push({
      key: "links",
      tone: "warn",
      title: `${plural(linkless.length, "class this week has", "classes this week have")} no joining link`,
      detail: `First: ${linkless[0].title}, ${formatWhen(linkless[0].startsAt)}`,
      to: "/dashboard/schedule",
      action: "Open schedule",
    });
  }

  const hollow = publishedOnly(plans).filter((p) => planIsHollow(p, data.bundles, programmes, lessons));
  if (hollow.length) {
    items.push({
      key: "hollow",
      tone: "warn",
      title: `${plural(hollow.length, "plan is", "plans are")} on sale but open nothing`,
      detail: hollow.map(planName).join(", "),
      to: "/dashboard/membership",
      action: "Open membership",
    });
  }

  const renewing = (members || []).filter((m) => ["soon", "ending"].includes(stateOf(m, ctx, now.getTime()).key));
  if (renewing.length) {
    const ending = renewing.filter((m) => stateOf(m, ctx, now.getTime()).key === "ending").length;
    items.push({
      key: "renewing",
      tone: "info",
      title: `${plural(renewing.length, "membership renews", "memberships renew")} or ends this week`,
      detail: ending ? `${ending} won't renew — a good moment to check in` : "All set to renew",
      to: "/dashboard/members",
      action: "Open members",
    });
  }

  const ready = (programmes || []).filter((p) => !isPublished(p) && readiness(p).canPublish);
  if (ready.length) {
    items.push({
      key: "ready",
      tone: "info",
      title: `${plural(ready.length, "programme is", "programmes are")} ready to publish`,
      detail: ready.map((p) => p.name).join(", "),
      to: "/dashboard/programmes",
      action: "Open programmes",
    });
  }

  if (studio && publishedPage && pageChanged(studio, publishedPage)) {
    items.push({
      key: "page",
      tone: "info",
      title: "Your page has unpublished changes",
      detail: "Visitors still see the last version you published",
      to: "/dashboard/page",
      action: "Open my page",
    });
  }

  const newLeads = (members || []).filter((m) => m.plan === "none" && now.getTime() - time(m.joinedAt) <= 7 * DAY);
  if (newLeads.length) {
    items.push({
      key: "leads",
      tone: "info",
      title: `${plural(newLeads.length, "person", "people")} signed up this week without buying`,
      detail: newLeads.map((m) => m.name).join(", "),
      to: "/dashboard/members",
      action: "Open members",
    });
  }

  return items;
}

/* ---------- coming up ---------- */

// What's on now, then the next few sessions over the coming week.
export function comingUp({ programmes = [], lessons = [] } = {}, now = new Date(), limit = 4) {
  const live = liveNow({ programmes, lessons }, now);
  const liveIds = new Set(live.map((e) => e.id));
  const next = occurrencesBetween(now, addDays(now, 7), { programmes, lessons })
    .filter((e) => !e.cancelled && !liveIds.has(e.id))
    .slice(0, limit);
  return { live, next };
}

/* ---------- recent activity ---------- */

// "just now", "12 min ago", "3 hr ago", "Yesterday", "3 days ago", "6 Sep".
export function relativeTime(iso, now = Date.now()) {
  const diff = now - time(iso);
  if (!Number.isFinite(diff)) return "";
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / 3600000)} hr ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  return formatDayMonth(iso);
}

// What happened lately, newest first: payments in and payments that didn't go
// through, people signing up, vouchers given. Only things with a real time.
export function recentActivity({ members = [], payments = [], plans = [], programmes = [] } = {}, now = Date.now(), limit = 6) {
  const byId = new Map((members || []).map((m) => [m.id, m]));
  const ctx = { plans, programmes };
  const events = [];

  for (const p of payments || []) {
    const who = byId.get(p.memberId);
    if (!who) continue;
    events.push({
      id: `pay:${p.id}`,
      icon: p.status === "pending" ? "clock" : "money",
      who: who.name,
      text: p.status === "pending"
        ? `'s ${money(p.amount)} payment for ${paymentLabel(p, ctx)} hasn't gone through`
        : ` paid ${money(p.amount)} for ${paymentLabel(p, ctx)}`,
      at: p.paidAt,
    });
  }
  for (const m of members || []) {
    // Buyers' joining is already their first payment; a lead has no payment to show.
    if (m.plan === "none" && m.joinedAt) {
      events.push({ id: `lead:${m.id}`, icon: "user", who: m.name, text: " signed up on your page", at: m.joinedAt });
    }
    for (const v of m.vouchers || []) {
      events.push({ id: `voucher:${v.id}`, icon: "voucher", who: m.name, text: ` was given ${v.percent}% off (${v.code})`, at: v.createdAt });
    }
  }

  return events
    .filter((e) => time(e.at) <= now)
    .sort((a, b) => time(b.at) - time(a.at))
    .slice(0, limit)
    .map((e) => ({ ...e, when: relativeTime(e.at, now) }));
}

