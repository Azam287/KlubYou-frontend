import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { earningsSeries } from "../../../data/mockData";
import StatCard from "./StatCard";
import EarningsChart from "./EarningsChart";
import PlanMixChart from "./PlanMixChart";
import ActivityFeed from "./ActivityFeed";

export default function OverviewPage() {
  const { studio, stats, planMix, activity } = useAppData();
  usePageHeader("Overview", `Welcome back, ${studio.ownerName} — here's how your studio is doing.`);

  return (
    <section className="panel">
      <div className="grid4">
        <StatCard
          label="Active members"
          icon="members"
          value={stats.activeMembers.value}
          delta={stats.activeMembers.delta}
        />
        <StatCard
          label="Earnings this month"
          icon="money"
          value={stats.earnings.value}
          delta={stats.earnings.delta}
        />
        <StatCard
          label="Renewal rate"
          icon="trend"
          value={stats.renewalRate.value}
          delta={stats.renewalRate.delta}
        />
        <StatCard
          label="Courses sold"
          icon="course"
          value={stats.coursesSold.value}
          delta={stats.coursesSold.delta}
          flat={stats.coursesSold.flat}
        />
      </div>

      <div className="grid2">
        <EarningsChart series={earningsSeries} />
        <PlanMixChart segments={planMix} />
      </div>

      <ActivityFeed items={activity} />
    </section>
  );
}
