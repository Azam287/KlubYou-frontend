import { useMemo } from "react";
import KebabMenu from "../../common/KebabMenu";
import { useAppData } from "../../../context/AppDataContext";
import { formatDayMonth } from "../../../lib/datetime";
import { creatorKeeps, money2 } from "../../../lib/stats";

const STATUS_LABEL = { paid: "Paid", pending: "Pending" };

export default function PaymentTable({ payments }) {
  const { memberActionByName, members } = useAppData();

  // Payments reference a member by id, so the displayed name always matches the
  // members table rather than being a second copy that can drift.
  const nameOf = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m.name]));
    return (id) => byId.get(id) || "Unknown member";
  }, [members]);

  const ordered = useMemo(
    () => [...payments].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    [payments]
  );

  return (
    <div className="cardbox" style={{ marginTop: 16, padding: "16px 8px" }}>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: 12 }}>Date</th>
              <th>Member</th>
              <th>For</th>
              <th>Amount</th>
              <th>You keep</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((p) => {
              const name = nameOf(p.memberId);
              return (
                <tr key={p.id}>
                  <td>{formatDayMonth(p.paidAt)}</td>
                  <td>{name}</td>
                  <td>{p.for}</td>
                  <td>{money2(p.amount)}</td>
                  <td>{money2(creatorKeeps(p.amount))}</td>
                  <td>
                    <span className={`pill ${p.status}`}>
                      <i /> {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="tar">
                    <KebabMenu
                      items={[
                        { label: "Send email", icon: "mail", onClick: () => memberActionByName("email", name) },
                        {
                          label: "Send receipt",
                          icon: "receipt",
                          onClick: () => memberActionByName("receipt", name),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
