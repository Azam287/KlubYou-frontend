import { useMemo } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { FEE_LABEL, money, paymentTotals } from "../../../lib/stats";
import PaymentTable from "./PaymentTable";

export default function PaymentsPage() {
  usePageHeader("Payments", "What you've earned, received and what's pending.");
  const { payments } = useAppData();

  // Derived from the very rows in the table below, so the "pending" count can
  // never claim more payments than the table actually shows.
  const totals = useMemo(() => paymentTotals(payments), [payments]);

  return (
    <section className="panel">
      <div className="grid4">
        <div className="cardbox stat">
          <div className="top">Received</div>
          <div className="val num">{money(totals.received)}</div>
          <div className="delta">this month</div>
        </div>
        <div className="cardbox stat">
          <div className="top">Pending</div>
          <div className="val num">{money(totals.pending)}</div>
          <div className="delta flat">
            {totals.pendingCount} payment{totals.pendingCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="cardbox stat">
          <div className="top">Next payout</div>
          <div className="val num">{money(totals.nextPayout)}</div>
          <div className="delta flat">Fri, after fees</div>
        </div>
        <div className="cardbox stat">
          <div className="top">KlubYou fee ({FEE_LABEL})</div>
          <div className="val num">{money(totals.fee)}</div>
          <div className="delta flat">this month</div>
        </div>
      </div>
      <PaymentTable payments={payments} />
    </section>
  );
}
