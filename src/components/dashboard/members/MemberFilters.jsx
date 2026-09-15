import Icon from "../../common/Icon";
import { STATE_FILTERS } from "../../../lib/members";
import AccessFilter from "../shared/AccessFilter";

// Where they stand (chips, each with its count), what they bought (a list of
// the actual plans and programmes), and a search by name or email.
export default function MemberFilters({
  state,
  onState,
  counts,
  access,
  onAccess,
  plans = [],
  programmes = [],
  search,
  onSearch,
}) {
  return (
    <div className="filters">
      <div className="chips" role="group" aria-label="Filter by status">
        {STATE_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip${state === f.key ? " on" : ""}`}
            aria-pressed={state === f.key}
            data-tip={f.tip}
            onClick={() => onState(f.key)}
          >
            {f.label} <span className="chip-n">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <AccessFilter
        id="member-access"
        label="Filter by what they bought"
        value={access}
        onChange={onAccess}
        plans={plans}
        programmes={programmes}
        allLabel="Everything they bought"
        includeNone
      />

      <div className="search">
        <Icon name="search" size={16} color="#5B5470" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search members by name or email"
        />
      </div>
    </div>
  );
}
