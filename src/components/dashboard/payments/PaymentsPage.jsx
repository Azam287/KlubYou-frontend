import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import PaymentTable from "./PaymentTable";

export default function PaymentsPage() {
  usePageHeader("Payments", "What you've earned, received and what's pending.");
  const { payments, paymentStats } = useAppData();

  return (
    <section className="panel">
      <div className="grid4">
        <div className="cardbox stat">
          <div className="top">Received</div>
          <div className="val num">{paymentStats.received}</div>
          <div className="delta">this month</div>
        </div>
        <div className="cardbox stat">
          <div className="top">Pending</div>
          <div className="val num">{paymentStats.pending}</div>
          <div className="delta flat">{paymentStats.pendingCount} payments</div>
        </div>
        <div className="cardbox stat">
          <div className="top">Next payout</div>
          <div className="val num">{paymentStats.nextPayout}</div>
          <div className="delta flat">Fri, after fees</div>
        </div>
        <div className="cardbox stat">
          <div className="top">KlubYou fee (10%)</div>
          <div className="val num">{paymentStats.fee}</div>
          <div className="delta flat">this month</div>
        </div>
      </div>
      <PaymentTable payments={payments} />
    </section>
  );
}
