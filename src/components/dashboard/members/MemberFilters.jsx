import Icon from "../../common/Icon";

const STATUS_CHIPS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "lead", label: "Leads" },
];

export default function MemberFilters({ status, onStatus, plan, onPlan, search, onSearch }) {
  return (
    <div className="filters">
      <div className="chips">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.value}
            className={`chip${status === c.value ? " on" : ""}`}
            onClick={() => onStatus(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <select className="field selectw" value={plan} onChange={(e) => onPlan(e.target.value)}>
        <option value="all">All access</option>
        <option value="studio">Studio subscription</option>
        <option value="programme">Single programme</option>
        <option value="none">No plan yet</option>
      </select>
      <div className="search">
        <Icon name="search" size={16} color="#5B5470" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search members" />
      </div>
    </div>
  );
}
