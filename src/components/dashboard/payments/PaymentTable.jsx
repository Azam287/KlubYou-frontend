import KebabMenu from "../../common/KebabMenu";
import { useAppData } from "../../../context/AppDataContext";

const STATUS_LABEL = { paid: "Paid", pending: "Pending" };

export default function PaymentTable({ payments }) {
  const { memberActionByName } = useAppData();

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
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.date}</td>
                <td>{p.member}</td>
                <td>{p.for}</td>
                <td>{p.amount}</td>
                <td>{p.keep}</td>
                <td>
                  <span className={`pill ${p.status}`}>
                    <i /> {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="tar">
                  <KebabMenu
                    items={[
                      { label: "Send email", icon: "mail", onClick: () => memberActionByName("email", p.member) },
                      {
                        label: "Send receipt",
                        icon: "receipt",
                        onClick: () => memberActionByName("receipt", p.member),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
