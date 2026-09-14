import { useMemo } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import {
  memberStats,
  money,
  monthlyEarnings,
  paymentTotals,
  percentChange,
  planMixOf,
} from "../../../lib/stats";
import StatCard from "./StatCard";
import EarningsChart from "./EarningsChart";
import PlanMixChart from "./PlanMixChart";
import ActivityFeed from "./ActivityFeed";

export default function OverviewPage() {
  const { studio, members, payments, activity } = useAppData();
  usePageHeader("Overview", `Welcome back, ${studio.ownerName} — here's how your studio is doing.`);

  // Every figure below is computed from the same rows the other pages render,
  // so the overview can't disagree with the members or payments tables.
  const { people, totals, series, change, mix } = useMemo(() => {
    const p = memberStats(members);
    const t = paymentTotals(payments);
    const s = monthlyEarnings(payments);
    return { people: p, totals: t, series: s, change: percentChange(s), mix: planMixOf(members) };
  }, [members, payments]);

  const prevMonth = series.length > 1 ? series[series.length - 2].month : null;

  return (
    <section className="panel">
      <div className="grid4">
        <StatCard
          label="Active members"
          icon="members"
          value={people.active}
          delta={people.joinedThisWeek ? `+${people.joinedThisWeek} this week` : "No joins this week"}
          flat={!people.joinedThisWeek}
        />
        <StatCard
          label="Earnings this month"
          icon="money"
          value={money(totals.received)}
          delta={
            change === null
              ? "First month of sales"
              : `${change >= 0 ? "+" : ""}${change}% vs ${prevMonth}`
          }
          flat={change === null}
        />
        <StatCard
          label="Retention"
          icon="trend"
          value={`${people.retentionRate}%`}
          delta={`${people.inactive} lapsed all time`}
          flat
        />
        <StatCard
          label="Programmes sold"
          icon="course"
          value={people.programme}
          delta={`${people.leads} leads to convert`}
          flat
        />
      </div>

      <div className="grid2">
        <EarningsChart series={series} />
        <PlanMixChart segments={mix} />
      </div>

      <ActivityFeed items={activity} />
    </section>
  );
}
