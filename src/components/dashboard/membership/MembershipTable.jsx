import { useState } from "react";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import {
  membershipRows,
  planIsEverything,
  planIsHollow,
  planLabel,
  planName,
  planPrice,
  rowIncludes,
  rowLocked,
} from "../../../lib/membership";

const DOT = { bundle: "prog", extra: "once", programme: "prog", lesson: "lesson" };

// The membership, as one editable table.
//
// There used to be two of these behind a mode switch — a "user view" and a
// "detailed view" that looked alike and behaved differently. One table you can
// always edit, plus a real preview of what members see, is fewer things to hold
// in your head and matches how programmes already work in this app.
//
// A row is a bundle or an extra, the same units a member sees. Bundles expand
// in place to show what's inside, one row at a time, rather than a page-wide
// toggle that lengthens every row at once.
export default function MembershipTable({
  features,
  plans,
  bundles = [],
  programmes = [],
  lessons = [],
  includeDrafts = false,
  onEditPlan,
  onTogglePlanBundle,
  onToggleFeature,
  onTogglePublished,
  onEdit,
  onMove,
  onDelete,
}) {
  const [open, setOpen] = useState({});
  const rows = membershipRows({ plans, bundles, programmes, lessons, features, includeDrafts });
  // One sequence across both kinds, so "first" and "last" mean the table's own
  // first and last row.

  if (!rows.length) {
    return (
      <p className="sec-empty">
        Nothing here yet. Make a bundle, or add an extra, and it appears as a row.
      </p>
    );
  }

  return (
    <div className="mtable-wrap">
      <table className="mtable">
        <thead>
          <tr>
            <th className="mt-what">What they get</th>
            {plans.map((p) => (
              <th key={p.id} className={p.bestSeller ? "on" : undefined}>
                {p.bestSeller && <span className="mt-best">Best seller</span>}
                {/* A plan is editable from its own column: the cards view was
                    the only way in, which meant switching views to change a
                    price you were looking at. The name is the way in; the menu
                    sits out of the text so the heading stays centred. */}
                <span className="mt-plan">{planName(p)}</span>
                <span className="mt-sub">
                  {planLabel(p)} · {planPrice(p)}
                  {planIsEverything(p) ? " · everything" : ""}
                </span>
                {planIsHollow(p, bundles, programmes, lessons) && (
                  <span
                    className="mt-warn"
                    data-tip="Every bundle it opens is still a draft, or none is chosen — members would pay for nothing"
                  >
                    Opens nothing
                  </span>
                )}
                {/* One pencil, not a menu: editing is the thing you want from a
                    column. The rest of a plan's actions live on its card. */}
                {onEditPlan && (
                  <button
                    className="mt-edit"
                    data-tip={`Edit ${planName(p)} — name, length, price and what it opens`}
                    aria-label={`Edit ${planName(p)}`}
                    onClick={() => onEditPlan(p)}
                  >
                    <Icon name="pencil" size={14} strokeWidth={1.9} />
                  </button>
                )}
              </th>
            ))}
            <th className="mt-act" aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const expanded = !!open[row.id];
            const canExpand = row.kind === "bundle";
            return [
              <tr key={row.id} className={row.draft ? "is-draft" : undefined}>
                <td className="mt-what">
                  <div className="mt-name">
                    {canExpand ? (
                      <button
                        className={`mt-caret${expanded ? " on" : ""}`}
                        aria-expanded={expanded}
                        aria-label={expanded ? "Hide what's inside" : "Show what's inside"}
                        data-tip={
                          expanded
                            ? "Hide what's in this bundle"
                            : `Show the ${row.contents.length} ${
                                row.contents.length === 1 ? "thing" : "things"
                              } in this bundle`
                        }
                        onClick={() => setOpen((o) => ({ ...o, [row.id]: !o[row.id] }))}
                      >
                        <Icon name="chevronDown" size={13} strokeWidth={2.4} />
                        <span>{row.contents.length}</span>
                      </button>
                    ) : (
                      <span className="mt-caret ghost" />
                    )}
                    <span className={`sdot ${DOT[row.kind]}`} />
                    <div>
                      <b>
                        {row.title}
                        {row.draft && <span className="mt-hid">Draft</span>}
                      </b>
                      <small>{row.detail}</small>
                    </div>
                  </div>
                </td>

                {plans.map((p) => {
                  const on = rowIncludes(row, p.id);
                  // An "everything" plan opens all of this by definition, so
                  // there is nothing here to switch off.
                  const locked = rowLocked(row, p.id);
                  return (
                    <td
                      key={p.id}
                      className={p.bestSeller ? "on" : undefined}
                      // A disabled button gets no hover, so a locked cell's
                      // reason sits on the cell around it.
                      data-tip={
                        locked
                          ? `${planName(p)} opens everything — edit the plan and choose bundles to leave this out`
                          : undefined
                      }
                    >
                      <button
                        className={`mt-cell${on ? " yes" : ""}${locked ? " locked" : ""}`}
                        aria-pressed={on}
                        aria-label={`${row.title} in ${planName(p)}`}
                        disabled={locked}
                        data-tip={
                          locked
                            ? undefined
                            : on
                              ? `In ${planName(p)} — click to take it out`
                              : `Not in ${planName(p)} — click to add it`
                        }
                        onClick={() =>
                          row.kind === "bundle"
                            ? onTogglePlanBundle(p, row.bundle)
                            : onToggleFeature(p, row.feature)
                        }
                      >
                        {on ? <Icon name="check" size={15} strokeWidth={3} /> : null}
                      </button>
                    </td>
                  );
                })}

                <td className="mt-act">
                  <div className="mt-tools">
                    {/* Visibility is toggled often enough to live on the row
                        rather than inside a menu. */}
                    {/* Published means members can see it. A draft is made but
                        not on sale — the same lifecycle a programme has. */}
                    <button
                      className={`mt-eye${row.draft ? " off" : ""}`}
                      aria-label={row.draft ? "Publish" : "Unpublish"}
                      data-tip={
                        row.draft
                          ? "Publish — members can see it"
                          : "Unpublish — members stop seeing it, and it leaves this table"
                      }
                      onClick={() => onTogglePublished(row)}
                    >
                      <Icon name={row.draft ? "eyeOff" : "eye"} size={15} strokeWidth={1.9} />
                    </button>
                    <KebabMenu
                      size="sm"
                      tip="Edit, reorder or remove this row"
                      items={[
                        {
                          label: row.kind === "bundle" ? "Edit bundle" : "Edit benefit",
                          icon: "link",
                          tip:
                            row.kind === "bundle"
                              ? "Change its name, description and what's in it"
                              : "Change its name and detail line",
                          onClick: () => onEdit(row),
                        },
                        ...(rows[0]?.id === row.id
                          ? []
                          : [
                              {
                                label: "Move up",
                                icon: "chevronUp",
                                tip: "Swap with the row above — members see the same order",
                                onClick: () => onMove(row, -1),
                              },
                            ]),
                        ...(rows[rows.length - 1]?.id === row.id
                          ? []
                          : [
                              {
                                label: "Move down",
                                icon: "chevronDown",
                                tip: "Swap with the row below — members see the same order",
                                onClick: () => onMove(row, 1),
                              },
                            ]),
                        null,
                        {
                          label: "Remove",
                          icon: "trash",
                          danger: true,
                          tip:
                            row.kind === "bundle"
                              ? "Delete the bundle — plans using it open less"
                              : "Delete the benefit from every plan",
                          onClick: () => onDelete(row),
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>,

              ...(expanded
                ? row.contents.length
                  ? row.contents.map((item) => (
                      <tr key={`${row.id}-${item.id}`} className="mt-inrow">
                        <td className="mt-what">
                          <span className="mt-inside">
                            <span className={`sdot ${DOT[item.kind]}`} />
                            {item.title}
                            <small>{item.detail}</small>
                          </span>
                        </td>
                        <td colSpan={plans.length + 1} />
                      </tr>
                    ))
                  : [
                      <tr key={`${row.id}-none`} className="mt-inrow">
                        <td className="mt-what">
                          <span className="mt-inside warn-text">
                            Nothing in this bundle yet — it opens nothing
                          </span>
                        </td>
                        <td colSpan={plans.length + 1} />
                      </tr>,
                    ]
                : []),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
