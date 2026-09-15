import { useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { money, monthlyEarnings } from "../../../lib/stats";
import { memberSummary } from "../../../lib/members";
import { paymentSummary } from "../../../lib/payments";
import {
  attentionItems,
  comingUp,
  earningsToDate,
  membersByPlan,
  recentActivity,
} from "../../../lib/overview";
import AttentionList from "./AttentionList";
import ComingUp from "./ComingUp";
import EarningsChart from "./EarningsChart";
import PlanMixChart from "./PlanMixChart";
import ActivityFeed from "./ActivityFeed";

// How the studio is doing, what needs doing, and what's next. Every figure is
// worked out from the same rows the other pages show (lib/overview.js,
// lib/members.js, lib/payments.js), so this page can't disagree with them —
// and each figure links to the page it comes from.
export default function OverviewPage() {
  const {
    studio,
    members,
    payments,
    studioPlans,
    programmes,
    everydayLessons,
    bundles,
    publishedPage,
  } = useAppData();
  usePageHeader("Overview", `Welcome back, ${studio.ownerName} — here's how your studio is doing.`);

  const view = useMemo(() => {
    const now = new Date();
    const ctx = { plans: studioPlans, programmes, payments };
    return {
      people: memberSummary(members, ctx, now.getTime()),
      money: paymentSummary(payments, now),
      toDate: earningsToDate(payments, now),
      series: monthlyEarnings(payments, 6, now),
      mix: membersByPlan(members, ctx, now.getTime()),
      attention: attentionItems(
        { members, payments, plans: studioPlans, programmes, lessons: everydayLessons, bundles, studio, publishedPage },
        now
      ),
      upcoming: comingUp({ programmes, lessons: everydayLessons }, now),
      activity: recentActivity({ members, payments, plans: studioPlans, programmes }, now.getTime()),
    };
  }, [members, payments, studioPlans, programmes, everydayLessons, bundles, studio, publishedPage]);

  const { people, toDate } = view;
  const change =
    toDate.change === null
      ? "Nothing by this day last month"
      : `${toDate.change >= 0 ? "+" : ""}${toDate.change}% vs this day last month`;

  return (
    <section className="panel">
      <div className="msum ov-sum">
        <Link className="msum-b" to="/dashboard/members" data-tip="Everyone with access right now — open members">
          <span>Active members</span>
          <b>{people.active}</b>
          <small className="msum-sub">
            {people.joinedThisWeek ? `+${people.joinedThisWeek} joined this week` : "No one joined this week"}
          </small>
        </Link>
        <Link className="msum-b" to="/dashboard/payments" data-tip="Paid so far this month — open payments">
          <span>Earned this month</span>
          <b>{money(toDate.thisMonth)}</b>
          <small className={`msum-sub${toDate.change !== null && toDate.change < 0 ? " warn-text" : ""}`}>{change}</small>
        </Link>
        <Link className="msum-b" to="/dashboard/payments" data-tip="Paid out every Friday, after the fee — open payments">
          <span>Next payout</span>
          <b>{money(view.money.payout.amount)}</b>
          <small className="msum-sub">
            {view.money.payout.on.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </small>
        </Link>
        <Link className="msum-b" to="/dashboard/members" data-tip="Active members out of everyone who has ever paid — open members">
          <span>Retention</span>
          <b>{people.retention}%</b>
          <small className="msum-sub">
            {people.due ? `${people.due} payment${people.due === 1 ? "" : "s"} due` : "No payments due"}
          </small>
        </Link>
      </div>

      <div className="grid2">
        <AttentionList items={view.attention} />
        <ComingUp live={view.upcoming.live} next={view.upcoming.next} />
      </div>

      <div className="grid2 ov-row">
        <EarningsChart series={view.series} />
        <PlanMixChart segments={view.mix} />
      </div>

      <div className="ov-row">
        <ActivityFeed items={view.activity} />
      </div>
    </section>
  );
}
