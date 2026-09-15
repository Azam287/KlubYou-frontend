import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import { formatDayMonth } from "../../../lib/datetime";
import { creatorKeeps, money2 } from "../../../lib/stats";
import { initialsOf, paymentLabel } from "../../../lib/members";
import { PAYMENT_STATES } from "../../../lib/payments";

const SORTABLE = { date: "Date", amount: "Amount" };

function SortHeader({ k, sort, onSort, first }) {
  const on = sort.key === k;
  const next = on && sort.dir === "desc" ? "asc" : "desc";
  return (
    <th
      aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      style={first ? { paddingLeft: 12 } : undefined}
    >
      <button
        className={`th-sort${on ? " on" : ""}`}
        data-tip={`Sort by ${SORTABLE[k].toLowerCase()}, ${next === "asc" ? "lowest first" : "highest first"}`}
        onClick={() => onSort(k, on ? next : "desc")}
      >
        {SORTABLE[k]}
        <Icon name="chevronDown" size={13} strokeWidth={2.4} className={`th-sort-ic${on && sort.dir === "asc" ? " up" : ""}`} />
      </button>
    </th>
  );
}

// Every payment, with who paid, what for (named from the plan or offer), and
// what's left of it after the fee. A pending one offers a reminder and a way to
// mark it paid; a paid one, a receipt.
export default function PaymentTable({
  payments,
  memberOf,
  ctx,
  sort,
  onSort,
  filtered,
  onClearFilters,
  onOpenMember,
  onReceipt,
  onRemind,
  onMarkPaid,
  onEmail,
  pager,
}) {
  return (
    <div className="cardbox" style={{ padding: "16px 8px" }}>
      <div className="tbl-wrap">
        <table className="tbl mtbl">
          <thead>
            <tr>
              <SortHeader k="date" sort={sort} onSort={onSort} first />
              <th>Member</th>
              <th>For</th>
              <SortHeader k="amount" sort={sort} onSort={onSort} />
              <th>You keep</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr className="mem-empty">
                <td colSpan={7}>
                  {filtered ? (
                    <>
                      No payments match these filters.{" "}
                      <button className="btn btn-ghost btn-sm" data-tip="Show every payment again" onClick={onClearFilters}>
                        Clear filters
                      </button>
                    </>
                  ) : (
                    "No payments yet. They'll appear here as people buy."
                  )}
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const who = memberOf(p.memberId);
                const state = PAYMENT_STATES[p.status] || PAYMENT_STATES.paid;
                const items = [];
                if (who && p.status === "pending") {
                  items.push(
                    {
                      label: "Mark as paid",
                      icon: "check",
                      tip: "It went through — their renewal moves on by the period it pays for",
                      onClick: () => onMarkPaid(p),
                    },
                    {
                      label: "Remind them",
                      icon: "mail",
                      tip: "Opens an email asking them to check their card",
                      onClick: () => onRemind(p, who),
                    }
                  );
                }
                if (who && p.status === "paid") {
                  items.push({
                    label: "Send receipt",
                    icon: "receipt",
                    tip: "Opens an email with this payment's details",
                    onClick: () => onReceipt(p, who),
                  });
                }
                if (who) {
                  items.push(
                    { label: "Send email", icon: "mail", tip: "Opens an email to them in your mail app", onClick: () => onEmail(who) },
                    { label: "View member", icon: "person", tip: "What they bought, payments and history", onClick: () => onOpenMember(who) }
                  );
                }
                return (
                  <tr key={p.id}>
                    <td data-label="Date">{formatDayMonth(p.paidAt)}</td>
                    <td className="mem-who">
                      {who ? (
                        <button className="who who-btn" data-tip={`See ${who.name.split(" ")[0]}'s details`} onClick={() => onOpenMember(who)}>
                          <span className="av">{initialsOf(who.name)}</span>
                          <span>
                            {who.name}
                            <small>{who.email}</small>
                          </span>
                        </button>
                      ) : (
                        <span className="mem-access missing">A member who has left</span>
                      )}
                    </td>
                    <td data-label="For">{paymentLabel(p, ctx)}</td>
                    <td data-label="Amount">{money2(p.amount)}</td>
                    <td data-label="You keep">{money2(creatorKeeps(p.amount))}</td>
                    <td data-label="Status">
                      <span className={`pill ${state.pill}`} data-tip={state.tip}>
                        <i /> {state.label}
                      </span>
                    </td>
                    <td className="tar mem-act">
                      {items.length > 0 && <KebabMenu items={items} tip="Actions for this payment" />}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pager}
    </div>
  );
}
