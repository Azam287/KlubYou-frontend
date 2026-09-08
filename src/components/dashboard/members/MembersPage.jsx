import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import MemberFilters from "./MemberFilters";
import MemberTable from "./MemberTable";

export default function MembersPage() {
  usePageHeader("Members", "Everyone who has joined your studio.");
  const { members } = useAppData();
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const okStatus = status === "all" || m.status === status;
      const okPlan = plan === "all" || m.plan === plan;
      const okSearch = !q || m.name.toLowerCase().includes(q);
      return okStatus && okPlan && okSearch;
    });
  }, [members, status, plan, search]);

  return (
    <section className="panel">
      <MemberFilters
        status={status}
        onStatus={setStatus}
        plan={plan}
        onPlan={setPlan}
        search={search}
        onSearch={setSearch}
      />
      <MemberTable members={filtered} />
    </section>
  );
}
