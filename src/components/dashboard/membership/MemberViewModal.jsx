import Modal from "../../common/Modal";
import Icon from "../../common/Icon";
import { money } from "../../../lib/stats";
import {
  comparisonRows,
  publishedOnly,
  discountPercent,
  hasDiscount,
  listPrice,
  planLabel,
  planName,
  planPrice,
  rowIncludes,
} from "../../../lib/membership";

// What a member sees. The same idiom as "Preview as member" on a programme:
// you edit in one place and check the result here, rather than flipping the
// working table into a second mode that looks almost the same.
export default function MemberViewModal({ open, plans, bundles, programmes, lessons, features, onClose }) {
  // A draft plan isn't on sale, so it isn't a column here.
  const live = publishedOnly(plans);
  const rows = comparisonRows({ plans: live, bundles, programmes, lessons, features });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What members see"
      maxWidth={760}
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          Close preview
        </button>
      }
    >
      {!live.length && (
        <p className="hint">
          No plan is published yet — members see nothing here until one is. Publish a plan from the
          cards view.
        </p>
      )}

      <div className="mv-plans">
        {/* Every card renders the same rows, empty where a plan has nothing to
            put in them, so the names, prices and buttons line up across all
            three instead of each card stacking to its own height. */}
        {live.map((p) => (
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
            <button className="btn btn-coral btn-block btn-sm">Choose</button>
          </div>
        ))}
      </div>

      {!live.length ? null : rows.length ? (
        <div className="mv-table">
          <table>
            <thead>
              <tr>
                <th>What you get</th>
                {live.map((p) => (
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
                  {live.map((p) => (
                    <td key={p.id} className={p.bestSeller ? "on" : undefined}>
                      {rowIncludes(row, p.id) ? (
                        <Icon name="check" size={17} strokeWidth={3} className="mv-yes" />
                      ) : (
                        <span className="mv-no">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="hint">
          These plans open nothing yet — publish a bundle or a benefit, then tick it into a plan.
        </p>
      )}
    </Modal>
  );
}
