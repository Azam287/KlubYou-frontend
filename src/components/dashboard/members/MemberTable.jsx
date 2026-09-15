import Icon from "../../common/Icon";
import MemberRow from "./MemberRow";

const SORTABLE = { name: "Member", joined: "Joined", renewal: "Renewal" };

function SortHeader({ k, sort, onSort, first }) {
  const on = sort.key === k;
  const label = SORTABLE[k];
  const next = on && sort.dir === "asc" ? "desc" : "asc";
  return (
    <th
      aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      style={first ? { paddingLeft: 12 } : undefined}
    >
      <button
        className={`th-sort${on ? " on" : ""}`}
        data-tip={`Sort by ${label.toLowerCase()}, ${next === "asc" ? "ascending" : "descending"}`}
        onClick={() => onSort(k, on ? next : k === "name" ? "asc" : "desc")}
      >
        {label}
        <Icon
          name="chevronDown"
          size={13}
          strokeWidth={2.4}
          className={`th-sort-ic${on && sort.dir === "asc" ? " up" : ""}`}
        />
      </button>
    </th>
  );
}

// `pager` goes under the table, inside the same card.
export default function MemberTable({ members, ctx, sort, onSort, filtered, onClearFilters, pager, ...actions }) {
  return (
    <div className="cardbox" style={{ padding: "16px 8px" }}>
      <div className="tbl-wrap">
        <table className="tbl mtbl">
          <thead>
            <tr>
              <SortHeader k="name" sort={sort} onSort={onSort} first />
              <th>Access</th>
              <th>Status</th>
              <SortHeader k="joined" sort={sort} onSort={onSort} />
              <SortHeader k="renewal" sort={sort} onSort={onSort} />
              <th>Activity</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr className="mem-empty">
                <td colSpan={7}>
                  {filtered ? (
                    <>
                      No members match these filters.{" "}
                      <button
                        className="btn btn-ghost btn-sm"
                        data-tip="Show everyone again"
                        onClick={onClearFilters}
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    "No one has joined yet. Share your page to get your first members."
                  )}
                </td>
              </tr>
            ) : (
              members.map((m) => <MemberRow key={m.id} member={m} ctx={ctx} {...actions} />)
            )}
          </tbody>
        </table>
      </div>
      {pager}
    </div>
  );
}
