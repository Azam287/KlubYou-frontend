// The overview: fair earnings comparison, who's on what, what needs doing,
// what's coming up and what happened — all derived. See src/lib/overview.js.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import OverviewPage from "../src/components/dashboard/overview/OverviewPage.jsx";
import AttentionList from "../src/components/dashboard/overview/AttentionList.jsx";
import PlanMixChart from "../src/components/dashboard/overview/PlanMixChart.jsx";
import ActivityFeed from "../src/components/dashboard/overview/ActivityFeed.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import {
  initialBundles as B,
  initialEverydayLessons as L,
  initialMembers as M,
  initialPayments as PAY,
  initialProgrammes as P,
  initialStudio as S,
  initialStudioPlans as PL,
} from "../src/data/mockData";
import { attentionItems, comingUp, earningsToDate, membersByPlan, recentActivity, relativeTime } from "../src/lib/overview";
import { memberSummary, stateCounts } from "../src/lib/members";
import { paymentSummary } from "../src/lib/payments";
import { pageSnapshot } from "../src/lib/page";
import { money } from "../src/lib/stats";

const noop = () => {};
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));
const wrap = (el) => clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter>{el}</MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
const ctx = { plans: PL, programmes: P, payments: PAY };
const now = new Date();
const iso = (d) => d.toISOString();
const pay = (amount, at, extra = {}) => ({ id: `x${amount}${at.getTime()}`, memberId: "m1", planId: "sp1", amount, paidAt: iso(at), status: "paid", ...extra });

/* ---- earnings, compared fairly ---- */
const mid = new Date(2026, 8, 15, 12);
const e = earningsToDate([pay(100, new Date(2026, 8, 3)), pay(50, new Date(2026, 7, 10)), pay(500, new Date(2026, 7, 25)), pay(9, new Date(2026, 8, 20))], mid);
ok("this month counts only what's been paid so far", e.thisMonth === 100);
ok("last month counts only up to the same day, not the whole month", e.lastMonthSoFar === 50);
ok("...so the change is fair", e.change === 100);
ok("no earnings by this day last month means no percentage, not infinity", earningsToDate([pay(10, new Date(2026, 8, 2))], mid).change === null);
ok("the 31st compares with the last day of a shorter month", earningsToDate([pay(40, new Date(2026, 1, 28, 9))], new Date(2026, 2, 31, 12)).lastMonthSoFar === 40);
ok("pending payments aren't earnings", earningsToDate([pay(70, new Date(2026, 8, 3), { status: "pending" })], mid).thisMonth === 0);

/* ---- who's here ---- */
const mix = membersByPlan(M, ctx, now.getTime());
ok("each membership plan by its own name", PL.every((p) => mix.some((s) => s.label === p.name)));
ok("then programme buyers and leads", mix.some((s) => s.label === "Bought a programme") && mix.at(-1).label === "Leads");
ok("people whose access ended aren't counted on a plan", mix.filter((s) => s.key.startsWith("plan:") || s.key === "programmes").reduce((t, s) => t + s.value, 0)
  === stateCounts(M, ctx, now.getTime()).active);
ok("a plan nobody is on isn't shown", !membersByPlan(M.filter((m) => m.planId !== "sp1"), ctx).some((s) => s.label === "Starter"));
ok("members of a removed plan are still counted, and said", membersByPlan(M, { ...ctx, plans: PL.filter((p) => p.id !== "sp3") }).some((s) => s.label === "Plans you no longer sell"));
const empty = R(<PlanMixChart segments={[]} />);
ok("nobody yet draws an empty ring, not NaN", empty.includes("No one yet") && !empty.includes("NaN") && empty.includes(">0<"));

/* ---- what needs doing ---- */
const data = { members: M, payments: PAY, plans: PL, programmes: P, lessons: L, bundles: B, studio: S, publishedPage: pageSnapshot(S) };
const items = attentionItems(data, now);
const key = (k) => items.find((i) => i.key === k);
ok("pending payments are flagged with the total", key("due")?.title.startsWith("2 payments") && key("due").detail.includes(money(36)) && key("due").to === "/dashboard/payments");
ok("a published plan that opens nothing is flagged by name", key("hollow")?.detail === "Starter" && key("hollow").to === "/dashboard/membership");
ok("renewals this week are flagged, saying how many won't renew", key("renewing")?.to === "/dashboard/members");
ok("new leads are flagged by name", key("leads")?.detail.includes("Felix Andersen"));
ok("problems come before nice-to-knows", items.findIndex((i) => i.tone === "info") > items.map((i) => i.tone).lastIndexOf("warn"));
ok("unpublished page changes appear only when there are some", !key("page")
  && attentionItems({ ...data, studio: { ...S, tagline: "new" } }, now).some((i) => i.key === "page"));
ok("classes this week without a link are flagged, with the first one", (() => {
  const noLink = attentionItems({ ...data, lessons: L.map((l) => ({ ...l, venueUrl: "" })) }, now).find((i) => i.key === "links");
  return noLink && noLink.to === "/dashboard/schedule" && noLink.detail.startsWith("First: ");
})());
ok("a clean studio has nothing to flag", attentionItems({ ...data, payments: PAY.filter((p) => p.status === "paid"), plans: PL.filter((p) => p.id !== "sp1"),
  members: M.filter((m) => m.plan !== "none" && !["m8", "m3", "m9"].includes(m.id)).map((m) => ({ ...m, renewsAt: m.renewsAt && new Date(m.renewsAt) - now < 8 * 86400000 && new Date(m.renewsAt) > now ? new Date(now.getTime() + 60 * 86400000).toISOString() : m.renewsAt })),
  lessons: L.map((l) => ({ ...l, venueUrl: l.venueUrl || "zoom.us/j/1" })), programmes: P.map((p) => ({ ...p, classes: (p.classes || []).map((c) => ({ ...c, venue: { platform: "zoom", url: "zoom.us/j/1" } })) })) }, now).length === 0);
const list = R(<AttentionList items={items} />);
ok("each item links to where it's fixed", items.every((i) => list.includes(`href="${i.to}"`)));
ok("an empty list says so", R(<AttentionList items={[]} />).includes("Nothing needs you right now"));

/* ---- coming up ---- */
const up = comingUp({ programmes: P, lessons: L }, now);
ok("the next sessions over the week, soonest first", up.next.length > 0 && up.next.length <= 4
  && up.next.every((x, i, a) => i === 0 || new Date(a[i - 1].startsAt) <= new Date(x.startsAt)));
ok("nothing shown twice as both on now and next", up.next.every((x) => !up.live.some((l) => l.id === x.id)));

/* ---- recent activity ---- */
const activity = recentActivity({ members: M, payments: PAY, plans: PL, programmes: P }, now.getTime());
ok("activity comes from real payments and sign-ups, newest first", activity.length === 6
  && activity.every((a, i, arr) => i === 0 || new Date(arr[i - 1].at) >= new Date(a.at)));
ok("payments are named from the plan or offer", activity.some((a) => / paid £\d+ for .+ · /.test(a.text)));
ok("a payment that didn't go through says so", recentActivity({ members: M, payments: PAY, plans: PL, programmes: P }, now.getTime(), 50)
  .some((a) => a.who === "Tom Reid" && a.text.includes("hasn't gone through")));
ok("vouchers appear once given", recentActivity({ members: M.map((m) => (m.id === "m1" ? { ...m, vouchers: [{ id: "v1", code: "EMMA20", percent: 20, createdAt: iso(now) }] } : m)),
  payments: PAY, plans: PL, programmes: P }, now.getTime() + 1000)[0].text.includes("EMMA20"));
ok("times are real and relative", relativeTime(iso(new Date(now.getTime() - 30000)), now.getTime()) === "just now"
  && relativeTime(iso(new Date(now.getTime() - 12 * 60000)), now.getTime()) === "12 min ago"
  && relativeTime(iso(new Date(now.getTime() - 3 * 3600000)), now.getTime()) === "3 hr ago"
  && relativeTime(iso(new Date(now.getTime() - 30 * 3600000)), now.getTime()) === "Yesterday"
  && relativeTime(iso(new Date(now.getTime() - 3 * 86400000)), now.getTime()) === "3 days ago");
ok("the made-up feed is gone", !source("src/data/mockData.js").includes("initialActivity") && !source("src/context/AppDataContext.jsx").includes("activity"));
ok("an empty feed says what will appear", R(<ActivityFeed items={[]} />).includes("payments and sign-ups will show here"));

/* ---- the page ---- */
const page = wrap(<OverviewPage />);
const people = memberSummary(M, ctx, now.getTime());
ok("four figures in the same strip as the other pages", (page.match(/class="msum-b"/g) || []).length === 4 && !page.includes("cardbox stat"));
ok("active members matches the members page", page.includes(`Active members</span><b>${people.active}</b>`));
ok("...earned this month matches payments", page.includes(`Earned this month</span><b>${money(paymentSummary(PAY, now).received)}</b>`));
ok("...compared with this day last month, not the whole month", page.includes("this day last month") && !page.includes("vs Aug") && !page.includes("First month of sales"));
ok("...with the next payout and retention", page.includes("Next payout</span>") && page.includes(`Retention</span><b>${people.retention}%</b>`));
ok("each figure opens its page", /<a class="msum-b" data-tip="[^"]*" href="\/dashboard\/members"/.test(page)
  && /<a class="msum-b" data-tip="[^"]*" href="\/dashboard\/payments"/.test(page));
ok("the page has attention, coming up, earnings, who's here and activity", ["Needs your attention", "Coming up", "Earnings", "Who's here", "Recent activity"]
  .every((h) => page.includes(`<h3>${h}</h3>`)));
ok("the old 'Plan mix' and 'Programmes sold' are gone", !page.includes("Plan mix") && !page.includes("Programmes sold"));
const untipped = (html) => [...html.matchAll(/<(button|a)\b[^>]*>/g)].filter((x) => !/data-tip="/.test(x[0])).map((x) => x[0]);
ok("every link and button has a tooltip", untipped(page).length === 0, untipped(page).slice(0, 3).join(" | "));
ok("chart points say their month and amount", source("src/components/dashboard/overview/EarningsChart.jsx").includes("<title>{`${p.key}: ${money(p.amount)}`}</title>"));

void noop;
done();
