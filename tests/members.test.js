// Member rules: what someone bought, where they stand, what they've done, and
// the actions that change them. Everything here is src/lib/members.js over the
// demo data; see docs/domain.md → Members.
import { ok, done } from "./harness";
import {
  DAY,
  GIFT_OPTIONS,
  STATE_FILTERS,
  accessOf,
  canGift,
  canResume,
  canStop,
  filterMembers,
  giftedRenewal,
  hasEnded,
  hasPaymentDue,
  isLifetime,
  mailtoFor,
  memberSummary,
  offerOf,
  paymentLabel,
  paymentsOf,
  planOf,
  programmeOf,
  progressOf,
  renewalOf,
  renews,
  sortMembers,
  stateCounts,
  stateOf,
  voucherCode,
} from "../src/lib/members";
import { offerAmount, allVideos } from "../src/lib/programme";
import { programmeBuyers } from "../src/lib/stats";
import {
  initialMembers as M,
  initialAttendance as ATT,
  initialPayments as PAY,
  initialProgrammes as P,
  initialStudioPlans as PL,
} from "../src/data/mockData";

const ctx = { plans: PL, programmes: P, payments: PAY, attendance: ATT };
const m = (id) => M.find((x) => x.id === id);
const now = Date.now();

/* ---- every member points at something real ---- */
ok("every membership member is on a plan that exists", M.filter((x) => x.plan === "studio").every((x) => planOf(x, PL)));
ok("every programme buyer bought an offer that exists", M.filter((x) => x.plan === "programme").every((x) => programmeOf(x, P) && offerOf(x, P)));
ok("nobody bought a draft programme", M.filter((x) => x.plan === "programme").every((x) => programmeOf(x, P).status === "published"));
ok("nobody stores a plan length, a label, initials or an attendance count any more", M.every((x) => !("planLength" in x) && !("initials" in x) && !("attendedOf" in x) && !("attended" in x)));
ok("a programme bought once has no renewal date and can't lapse", M.filter((x) => isLifetime(x, ctx)).every((x) => !x.renewsAt && x.status !== "inactive"));
ok("every payment points at a plan or an offer that exists", PAY.every((p) =>
  p.planId ? PL.some((pl) => pl.id === p.planId) : P.some((pr) => pr.id === p.programmeId && pr.pricing.offers.some((o) => o.id === p.offerId))));
ok("...for what that plan or offer costs", PAY.every((p) =>
  p.planId ? PL.find((pl) => pl.id === p.planId).amount === p.amount
    : offerAmount(P.find((pr) => pr.id === p.programmeId).pricing.offers.find((o) => o.id === p.offerId)) === p.amount));
ok("...and by someone who bought it", PAY.every((p) => {
  const who = m(p.memberId);
  return who && (p.planId ? who.planId === p.planId : who.programmeId === p.programmeId && who.offerId === p.offerId);
}));

/* ---- what they bought, named ---- */
ok("a member on a plan shows the plan's name", accessOf(m("m1"), ctx).title === "Full studio year" && accessOf(m("m1"), ctx).detail === "Membership · 12 months");
ok("...and a renamed plan reaches them", accessOf(m("m1"), { ...ctx, plans: PL.map((p) => (p.id === "sp3" ? { ...p, name: "The Year" } : p)) }).title === "The Year");
ok("...a removed plan is said, not blank", accessOf(m("m1"), { ...ctx, plans: [] }).missing === true);
ok("a programme bought once says so", accessOf(m("m4"), ctx).detail === "Programme · bought once, £40");
ok("a programme subscription says so", accessOf(m("m19"), ctx).detail === "Programme · £12/month");
ok("a lead hasn't bought anything", accessOf(m("m5"), ctx).title === "Not bought yet");
ok("plans and subscriptions renew, lifetime doesn't", renews(m("m1"), ctx) && renews(m("m19"), ctx) && !renews(m("m4"), ctx) && !renews(m("m5"), ctx));

/* ---- where they stand ---- */
ok("a pending renewal payment is Payment due", ["m3", "m9"].every((id) => hasPaymentDue(m(id), PAY) && stateOf(m(id), ctx).key === "due"));
ok("a stopped subscription is Ending", stateOf(m("m8"), ctx).key === "ending");
ok("an inactive member is Inactive", stateOf(m("m6"), ctx).key === "inactive");
ok("a lead is a Lead", stateOf(m("m5"), ctx).key === "lead");
ok("renewing within a week is Renews soon", stateOf({ ...m("m1"), renewsAt: new Date(now + 3 * DAY).toISOString() }, ctx).key === "soon");
ok("a renewal date in the past ends access even if nobody updated the status", hasEnded({ ...m("m1"), renewsAt: new Date(now - DAY).toISOString() }, ctx)
  && stateOf({ ...m("m1"), renewsAt: new Date(now - DAY).toISOString() }, ctx).key === "inactive");
ok("...but a lifetime purchase never ends", !hasEnded({ ...m("m4"), renewsAt: new Date(now - DAY).toISOString() }, ctx));
ok("renewal reads the way it stands", renewalOf(m("m4"), ctx).label === "Lifetime access"
  && renewalOf(m("m8"), ctx).label.startsWith("Ends ") && renewalOf(m("m1"), ctx).label.startsWith("Renews ")
  && renewalOf(m("m6"), ctx).label.startsWith("Ended ") && renewalOf(m("m5"), ctx).label === "—");

/* ---- what they've done ---- */
const breathVideos = allVideos(P.find((p) => p.id === "breathwork-basics")).filter((v) => v.active).length;
ok("a recorded programme counts videos, not attendance", progressOf(m("m17"), ctx).kind === "videos"
  && progressOf(m("m17"), ctx).label === `${breathVideos} of ${breathVideos} videos` && progressOf(m("m17"), ctx).complete);
ok("...never more than it has", progressOf({ ...m("m17"), watched: 99 }, ctx).done === breathVideos);
ok("a live programme counts classes held since they joined", progressOf(m("m4"), ctx).kind === "classes" && /^\d+ of \d+ classes$/.test(progressOf(m("m4"), ctx).label));
const vinyasaClass = P.find((p) => p.id === "morning-vinyasa").classes[0];
const twice = [...Array(50)].map((_, i) => ({ id: `x${i}`, sessionId: `class:morning-vinyasa:${vinyasaClass.id}`, memberId: "m4", at: vinyasaClass.startsAt, via: "link" }));
ok("...and can't have attended more than were held", progressOf(m("m4"), { ...ctx, attendance: twice }).done === progressOf(m("m4"), { ...ctx, attendance: twice }).total);
ok("...counting only that programme's classes", progressOf(m("m4"), { ...ctx, attendance: [{ id: "y", sessionId: "lesson:el1:2026-09-01", memberId: "m4", at: vinyasaClass.startsAt, via: "link" }] }).done === 0);
const m1Came = ATT.filter((r) => r.memberId === "m1").length;
ok("a membership counts classes attended, from attendance records, with no made-up total", m1Came > 0 && progressOf(m("m1"), ctx).label === `${m1Came} classes attended`);
ok("...and nothing recorded reads as no classes", progressOf(m("m1"), { ...ctx, attendance: [] }).label === "No classes yet");

/* ---- finding them ---- */
const counts = stateCounts(M, ctx);
ok("every member is counted once under All", counts.all === M.length);
ok("active includes renewing, ending and payment due", counts.active === M.filter((x) => ["active", "soon", "ending", "due"].includes(stateOf(x, ctx).key)).length);
ok("renewing soon includes ending", counts.renewing >= 1 && filterMembers(M, { state: "renewing" }, ctx).some((x) => x.id === "m8"));
ok("the chips each have a filter", STATE_FILTERS.every((f) => typeof counts[f.key] === "number"));
ok("filter by a specific plan", filterMembers(M, { access: "plan:sp3" }, ctx).every((x) => x.planId === "sp3") && filterMembers(M, { access: "plan:sp3" }, ctx).length === 4);
ok("filter by a specific programme", filterMembers(M, { access: "programme:breathwork-basics" }, ctx).length === 3);
ok("search matches email as well as name", filterMembers(M, { search: "dan.o@" }, ctx).map((x) => x.id).join() === "m8"
  && filterMembers(M, { search: "EMMA" }, ctx).length === 1);
const byRenewalAsc = sortMembers(M, "renewal", "asc", ctx);
const byRenewalDesc = sortMembers(M, "renewal", "desc", ctx);
const noDate = (x) => !(renews(x, ctx) && x.renewsAt);
ok("sorting by renewal puts people with no date last, both ways", noDate(byRenewalAsc.at(-1)) && noDate(byRenewalDesc.at(-1))
  && !noDate(byRenewalAsc[0]) && !noDate(byRenewalDesc[0]));
ok("...and in date order otherwise", byRenewalAsc.filter((x) => !noDate(x)).every((x, i, a) => i === 0 || new Date(a[i - 1].renewsAt) <= new Date(x.renewsAt)));
ok("sort by name", sortMembers(M, "name", "asc", ctx)[0].name <= sortMembers(M, "name", "asc", ctx)[1].name);
const summary = memberSummary(M, ctx);
ok("the summary agrees with the chips", summary.active === counts.active && summary.due === counts.due && summary.renewing === counts.renewing);
ok("...and retention is active out of everyone who ever paid", summary.retention === Math.round((counts.active / (counts.active + counts.inactive)) * 100));

/* ---- actions ---- */
ok("renewing access can be gifted days, lifetime and ended can't", canGift(m("m1"), ctx) && !canGift(m("m4"), ctx) && !canGift(m("m6"), ctx) && !canGift(m("m5"), ctx));
ok("gifting moves the renewal date by exactly that many days", GIFT_OPTIONS.every((d) =>
  new Date(giftedRenewal(m("m1"), d)).getTime() - new Date(m("m1").renewsAt).getTime() === d * DAY));
ok("stop is offered while it renews, resume once stopped", canStop(m("m1"), ctx) && !canResume(m("m1"), ctx)
  && !canStop(m("m8"), ctx) && canResume(m("m8"), ctx));
ok("a programme subscription can be stopped too", canStop(m("m19"), ctx));
ok("...a lifetime purchase, a lead or ended access can't", !canStop(m("m4"), ctx) && !canStop(m("m5"), ctx) && !canStop(m("m6"), ctx));
ok("a voucher code is readable", voucherCode(m("m1"), 20) === "EMMA20");
ok("...and never repeats for the same member", voucherCode({ ...m("m1"), vouchers: [{ code: "EMMA20" }] }, 20) === "EMMA20B"
  && voucherCode({ ...m("m1"), vouchers: [{ code: "EMMA20" }, { code: "EMMA20B" }] }, 20) === "EMMA20C");
ok("an email opens addressed to them, safely encoded", mailtoFor(m("m1"), { subject: "Hi & welcome", body: "a\nb" })
  === "mailto:emma%40email.com?subject=Hi%20%26%20welcome&body=a%0Ab");

/* ---- payments and other pages ---- */
ok("a payment is named from what it paid for", paymentLabel(PAY[0], ctx) === "Half year · 6 months"
  && paymentLabel(PAY[1], ctx) === "Morning Vinyasa · Full programme");
ok("...and follows a rename", paymentLabel(PAY[0], { ...ctx, plans: PL.map((p) => (p.id === "sp2" ? { ...p, name: "Six months in" } : p)) }) === "Six months in · 6 months");
ok("a member's payments are theirs, newest first", paymentsOf(m("m3"), PAY).length === 1 && paymentsOf(m("m2"), PAY).every((p) => p.memberId === "m2"));
ok("programme buyer counts still work", programmeBuyers(M, "breathwork-basics") === 3);

done();
