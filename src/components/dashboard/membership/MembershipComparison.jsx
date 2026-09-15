import Icon from "../../common/Icon";
import { money } from "../../../lib/stats";
import {
  comparisonRows,
  discountPercent,
  hasDiscount,
  listPrice,
  planLabel,
  planName,
  planPrice,
  rowIncludes,
} from "../../../lib/membership";

// The plans side by side, then one table of what each opens — the view members
// choose from. Shared by the "Preview as member" modal and the public page, so
// the two can't show different things. `plans` should already be published
// only; the rows drop drafts themselves.
//
// `picture`: draw the Choose buttons rather than render them, for previews
// where nothing should be clickable.
export default function MembershipComparison({
  plans,
  bundles,
  programmes,
  lessons,
  features,
  picture = false,
}) {
  const rows = comparisonRows({ plans, bundles, programmes, lessons, features });

  return (
    <>
      <div className="mv-plans">
        {/* Every card renders the same rows, empty where a plan has nothing to
            put in them, so the names, prices and buttons line up across all
            of them instead of each card stacking to its own height. */}
        {plans.map((p) => (
          <div className={`mv-plan${p.bestSeller ? " best" : ""}`} key={p.id}>
            <span className="mv-flag" aria-hidden={!p.bestSeller}>
              {p.bestSeller ? "Best seller" : ""}
            </span>
            <b>{planName(p)}</b>
            <span className="mv-len">{planLabel(p)}</span>
            <div className="mv-price">
              <s className="mv-was">{hasDiscount(p) ? money(listPrice(p)) : ""}</s>
              <strong>{planPrice(p)}</strong>
            </div>
            <span className="mv-off" aria-hidden={discountPercent(p) === 0}>
              {discountPercent(p) > 0 ? `${discountPercent(p)}% off` : ""}
            </span>
            {picture ? (
              <span className="mv-choose">Choose</span>
            ) : (
              <button
                className="btn btn-coral btn-block btn-sm"
                data-tip="Where a member picks this plan — it does nothing in the preview"
              >
                Choose
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="mv-table">
          <table>
            <thead>
              <tr>
                <th>What you get</th>
                {plans.map((p) => (
                  <th key={p.id} className={p.bestSeller ? "on" : undefined}>
                    {planName(p)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.title}</b>
                    <small>{row.detail}</small>
                  </td>
                  {plans.map((p) => (
                    <td key={p.id} className={p.bestSeller ? "on" : undefined}>
                      {rowIncludes(row, p.id) ? (
                        <Icon name="check" size={17} strokeWidth={3} className="mv-yes" />
                      ) : (
                        <span className="mv-no" aria-label="Not included">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
