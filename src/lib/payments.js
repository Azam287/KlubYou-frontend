// Payments: what came in, what's waiting, and when it's paid out.
//
// A payment points at a member and at what it paid for (a plan, or a programme
// offer). Everything on the payments page is worked out from those rows — the
// same rows the members page reads — so marking a payment paid there clears
// "Payment due" here without anyone keeping the two in step.

import { addDays, formatDayMonth, sameMonth, startOfDay, weekdayOf } from "./datetime";
import { partsOf, zonedDate } from "./locale";
import { offersOf } from "./programme";
import { creatorKeeps, FEE_RATE, money2 } from "./stats";
import { mailtoFor, paymentLabel, renews } from "./members";
import { matchesQuery } from "./search";

const time = (iso) => (iso ? new Date(iso).getTime() : NaN);

export const PAYMENT_STATES = {
  paid: { key: "paid", label: "Paid", pill: "paid", tip: "Received — counted in your earnings" },
  pending: {
    key: "pending",
    label: "Pending",
    pill: "pending",
    tip: "Hasn't gone through yet — the member shows as Payment due",
  },
};

export const STATUS_FILTERS = [
  { key: "all", label: "All", tip: "Every payment" },
  { key: "paid", label: "Paid", tip: "Payments that have gone through" },
  { key: "pending", label: "Pending", tip: "Payments waiting to go through" },
];

/* ---------- payouts ---------- */

// Payouts go out weekly, on Fridays, for what was paid since the last one. The
// card used to say "Fri, after fees" beside this month's total, which was
// neither the date nor the amount.
export const PAYOUT_WEEKDAY = 5; // Friday

// Payout days are the studio's Fridays, starting at its midnight.
export function lastPayoutDay(now = new Date()) {
  const d = startOfDay(now);
  const back = (weekdayOf(d) - PAYOUT_WEEKDAY + 7) % 7 || 7;
  return addDays(d, -back);
}

// The next payout day, today included.
export function nextPayoutDay(now = new Date()) {
  const d = startOfDay(now);
  return addDays(d, (PAYOUT_WEEKDAY - weekdayOf(d) + 7) % 7);
}

/* ---------- the summary ---------- */

export const kindOf = (payment) => (payment?.planId ? "membership" : "programme");

export function paymentSummary(payments, now = new Date()) {
  const sum = (list) => list.reduce((t, p) => t + (p.amount || 0), 0);
  const paid = (payments || []).filter((p) => p.status === "paid");
  const pending = (payments || []).filter((p) => p.status === "pending");
  const thisMonth = paid.filter((p) => sameMonth(p.paidAt, now));
  const sincePayout = paid.filter((p) => time(p.paidAt) >= lastPayoutDay(now).getTime());
  const received = sum(thisMonth);
  return {
    received,
    fromMemberships: sum(thisMonth.filter((p) => kindOf(p) === "membership")),
    fromProgrammes: sum(thisMonth.filter((p) => kindOf(p) === "programme")),
    paidCount: thisMonth.length,
    pending: sum(pending),
    pendingCount: pending.length,
    fee: received * FEE_RATE,
    payout: { on: nextPayoutDay(now), amount: creatorKeeps(sum(sincePayout)) },
  };
}

/* ---------- finding payments ---------- */

export function statusCounts(payments) {
  const list = payments || [];
  return {
    all: list.length,
    paid: list.filter((p) => p.status === "paid").length,
    pending: list.filter((p) => p.status === "pending").length,
  };
}

// The same access values as the members filter: "all" · "plans" · "plan:<id>"
// · "programmes" · "programme:<id>".
export function matchesPaidFor(payment, value) {
  if (!value || value === "all") return true;
  if (value === "plans") return !!payment.planId;
  if (value === "programmes") return !!payment.programmeId;
  if (value.startsWith("plan:")) return payment.planId === value.slice(5);
  if (value.startsWith("programme:")) return payment.programmeId === value.slice(10);
  // A payment is always for something, so "not bought yet" matches none.
  return value !== "none";
}

export function filterPayments(payments, { status = "all", access = "all", search = "" } = {}, members = []) {
  const byId = new Map((members || []).map((m) => [m.id, m]));
  return (payments || []).filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (!matchesPaidFor(p, access)) return false;
    if (!String(search || "").trim()) return true;
    const who = byId.get(p.memberId);
    return !!who && matchesQuery([who.name, who.email], search);
  });
}

export function sortPayments(payments, key = "date", dir = "desc") {
  const sign = dir === "asc" ? 1 : -1;
  return [...(payments || [])].sort((a, b) =>
    key === "amount" ? sign * (a.amount - b.amount) || time(b.paidAt) - time(a.paidAt) : sign * (time(a.paidAt) - time(b.paidAt))
  );
}

/* ---------- a pending payment going through ---------- */

// "1 month", "3 months" → 1, 3.
const monthsIn = (length) => parseInt(String(length || "1"), 10) || 1;

export function addMonths(iso, n) {
  const p = partsOf(iso);
  // 31 Jan + 1 month is 28 Feb, not 3 March.
  const lastDay = partsOf(zonedDate(p.year, p.month + n + 1, 0, 12)).day;
  return zonedDate(p.year, p.month + n, Math.min(p.day, lastDay), p.hour, p.minute, p.second).toISOString();
}

// How many months one payment buys: a plan's length, or a subscription offer's.
// Null for a one-off — it doesn't buy a period, it buys the programme.
export function monthsPaidFor(payment, { plans = [], programmes = [] } = {}) {
  if (payment?.planId) return (plans || []).find((p) => p.id === payment.planId)?.months || null;
  if (payment?.programmeId) {
    const offer = offersOf((programmes || []).find((p) => p.id === payment.programmeId)).find((o) => o.id === payment.offerId);
    return offer?.kind === "subscription" ? monthsIn(offer.length) : null;
  }
  return null;
}

// Where a member's renewal moves when a renewal payment goes through: on by one
// period from their current renewal date. Null when the payment isn't for what
// they're on, or doesn't buy a period — then the date is left alone.
export function renewalAfterPayment(member, payment, ctx = {}) {
  if (!member?.renewsAt || !renews(member, ctx)) return null;
  const same = payment.planId ? member.planId === payment.planId : member.programmeId === payment.programmeId && member.offerId === payment.offerId;
  const months = same ? monthsPaidFor(payment, ctx) : null;
  return months ? addMonths(member.renewsAt, months) : null;
}

/* ---------- emails and export ---------- */

export function receiptEmail(member, payment, ctx) {
  const label = paymentLabel(payment, ctx);
  const first = member.name.split(" ")[0];
  return mailtoFor(member, {
    subject: `Your receipt — ${label}`,
    body: `Hi ${first},\n\nThanks for your payment.\n\n${label}\n${money2(payment.amount)} · ${formatDayMonth(payment.paidAt)}\n`,
  });
}

export function reminderEmail(member, payment, ctx) {
  const label = paymentLabel(payment, ctx);
  const first = member.name.split(" ")[0];
  return mailtoFor(member, {
    subject: `Your payment for ${label} didn't go through`,
    body: `Hi ${first},\n\nYour ${money2(payment.amount)} payment for ${label} hasn't gone through yet. Could you check your card details so your access carries on?\n`,
  });
}

// A spreadsheet of the payments shown, for bookkeeping. Quotes every field and
// doubles any quote inside one, so names with commas survive.
export function paymentsCsv(payments, { members = [], plans = [], programmes = [] } = {}) {
  const byId = new Map((members || []).map((m) => [m.id, m]));
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Date", "Member", "Email", "For", "Amount", "You keep", "Fee", "Status"]];
  for (const p of payments || []) {
    const who = byId.get(p.memberId);
    rows.push([
      new Date(p.paidAt).toISOString().slice(0, 10),
      who?.name || "Unknown member",
      who?.email || "",
      paymentLabel(p, { plans, programmes }),
      p.amount.toFixed(2),
      creatorKeeps(p.amount).toFixed(2),
      (p.amount * FEE_RATE).toFixed(2),
      PAYMENT_STATES[p.status]?.label || p.status,
    ]);
  }
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}
