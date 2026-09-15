// Payment rules: the summary, payouts, filters, a pending payment going
// through, emails and export. See src/lib/payments.js.
import { ok, done } from "./harness";
import {
  PAYOUT_WEEKDAY,
  addMonths,
  filterPayments,
  kindOf,
  lastPayoutDay,
  matchesPaidFor,
  monthsPaidFor,
  nextPayoutDay,
  paymentSummary,
  paymentsCsv,
  receiptEmail,
  reminderEmail,
  renewalAfterPayment,
  sortPayments,
  statusCounts,
} from "../src/lib/payments";
import { stateOf } from "../src/lib/members";
import { creatorKeeps, paymentTotals } from "../src/lib/stats";
import { sameMonth } from "../src/lib/datetime";
import {
  initialMembers as M,
  initialPayments as PAY,
  initialProgrammes as P,
  initialStudioPlans as PL,
} from "../src/data/mockData";

const ctx = { plans: PL, programmes: P, payments: PAY };
const m = (id) => M.find((x) => x.id === id);
const pay = (id) => PAY.find((x) => x.id === id);
const now = new Date();
const sum = (list) => list.reduce((t, p) => t + p.amount, 0);

/* ---- the summary ---- */
const s = paymentSummary(PAY, now);
const paidThisMonth = PAY.filter((p) => p.status === "paid" && sameMonth(p.paidAt, now));
ok("received is this month's paid payments", s.received === sum(paidThisMonth));
ok("...and agrees with the overview's figure", s.received === paymentTotals(PAY, now).received);
ok("...split into memberships and programmes, adding up", s.fromMemberships + s.fromProgrammes === s.received
  && s.fromMemberships === sum(paidThisMonth.filter((p) => p.planId)));
ok("pending is the pending rows", s.pendingCount === 2 && s.pending === 36);
ok("the fee is 10% of what came in", Math.abs(s.fee - s.received * 0.1) < 1e-9);
ok("a payment is a membership or a programme payment", kindOf(pay("p1")) === "membership" && kindOf(pay("p2")) === "programme");

/* ---- payouts ---- */
ok("the next payout is a Friday, today or later", nextPayoutDay(now).getDay() === PAYOUT_WEEKDAY
  && nextPayoutDay(now).getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  && nextPayoutDay(now).getTime() - now.getTime() < 7 * 86400000);
ok("the last payout was a Friday before today", lastPayoutDay(now).getDay() === PAYOUT_WEEKDAY && lastPayoutDay(now) < new Date(now.getFullYear(), now.getMonth(), now.getDate()));
const fri = new Date(2026, 8, 18, 15); // a Friday
ok("on a Friday, today is the payout and last week's was the last", nextPayoutDay(fri).getDate() === 18 && lastPayoutDay(fri).getDate() === 11);
const sat = new Date(2026, 8, 19, 9);
ok("on a Saturday, it's next Friday", nextPayoutDay(sat).getDate() === 25 && lastPayoutDay(sat).getDate() === 18);
ok("the payout is what came in since the last one, after the fee", s.payout.amount === creatorKeeps(sum(PAY.filter((p) =>
  p.status === "paid" && new Date(p.paidAt) >= lastPayoutDay(now)))));

/* ---- finding payments ---- */
ok("status counts add up", statusCounts(PAY).all === PAY.length && statusCounts(PAY).paid + statusCounts(PAY).pending === PAY.length);
ok("filter by status", filterPayments(PAY, { status: "pending" }, M).every((p) => p.status === "pending"));
ok("filter by a plan or programme", filterPayments(PAY, { access: "plan:sp1" }, M).every((p) => p.planId === "sp1")
  && filterPayments(PAY, { access: "programme:breathwork-basics" }, M).length === 2
  && filterPayments(PAY, { access: "programmes" }, M).every((p) => p.programmeId));
ok("no payment is for 'not bought yet'", !matchesPaidFor(pay("p1"), "none"));
ok("search by the member's name or email", filterPayments(PAY, { search: "sam.k@" }, M).map((p) => p.id).join() === "p1"
  && filterPayments(PAY, { search: "tom" }, M).map((p) => p.id).join() === "p11");
ok("sort by date, newest first by default", sortPayments(PAY).every((p, i, a) => i === 0 || new Date(a[i - 1].paidAt) >= new Date(p.paidAt)));
ok("sort by amount", sortPayments(PAY, "amount", "desc")[0].amount === 162 && sortPayments(PAY, "amount", "asc")[0].amount === 12);

/* ---- a pending payment going through ---- */
ok("adding months keeps the day", new Date(addMonths("2026-03-15T09:00:00.000Z", 1)).getUTCDate() === 15);
ok("...and doesn't run past a short month", new Date(addMonths(new Date(2026, 0, 31, 12).toISOString(), 1)).getMonth() === 1
  && new Date(addMonths(new Date(2026, 0, 31, 12).toISOString(), 1)).getDate() === 28);
ok("a plan payment buys the plan's length", monthsPaidFor(pay("p6"), ctx) === 12 && monthsPaidFor(pay("p11"), ctx) === 1);
ok("a subscription payment buys its length, a one-off buys none", monthsPaidFor(pay("p9"), ctx) === 1 && monthsPaidFor(pay("p2"), ctx) === null);
const tomNext = renewalAfterPayment(m("m3"), pay("p11"), ctx);
ok("Tom's renewal payment moves his renewal on a month", tomNext === addMonths(m("m3").renewsAt, 1));
ok("...a payment for something else leaves the date alone", renewalAfterPayment(m("m3"), pay("p6"), ctx) === null);
ok("...and a lifetime buyer has no date to move", renewalAfterPayment(m("m4"), pay("p2"), ctx) === null);
const afterPaid = PAY.map((p) => (p.id === "p11" ? { ...p, status: "paid" } : p));
ok("once it's paid, Tom is no longer Payment due", stateOf(m("m3"), { ...ctx, payments: PAY }).key === "due"
  && stateOf({ ...m("m3"), renewsAt: tomNext }, { ...ctx, payments: afterPaid }).key !== "due");

/* ---- emails and export ---- */
const receipt = decodeURIComponent(receiptEmail(m("m2"), pay("p1"), ctx));
ok("a receipt names what was paid for and how much", receipt.startsWith("mailto:sam.k@email.com?") && receipt.includes("Half year · 6 months") && receipt.includes("£92.00"));
const reminder = decodeURIComponent(reminderEmail(m("m3"), pay("p11"), ctx));
ok("a reminder says what didn't go through", reminder.includes("didn't go through") && reminder.includes("Starter · 1 month") && reminder.includes("£18.00"));
const csv = paymentsCsv([pay("p1"), pay("p11")], { members: M, plans: PL, programmes: P });
const lines = csv.split("\n");
ok("the export has a header and a row per payment", lines.length === 3 && lines[0] === '"Date","Member","Email","For","Amount","You keep","Fee","Status"');
ok("...with the member, what it was for, and the money split", lines[1].includes('"Sam Kelly","sam.k@email.com","Half year · 6 months","92.00","82.80","9.20","Paid"'));
ok("...quoting anything with commas or quotes in it", paymentsCsv([pay("p1")], { members: [{ ...m("m2"), name: 'Kelly, "Sam"' }], plans: PL, programmes: P })
  .includes('"Kelly, ""Sam"""'));

done();
