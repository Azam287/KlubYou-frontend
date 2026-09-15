import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import Icon from "../../common/Icon";
import ConfirmModal from "../../common/ConfirmModal";
import Pagination from "../../common/Pagination";
import AccessFilter from "../shared/AccessFilter";
import MemberDetailModal from "../members/MemberDetailModal";
import PaymentTable from "./PaymentTable";
import { FEE_LABEL, money, money2 } from "../../../lib/stats";
import { formatDayMonth } from "../../../lib/datetime";
import { mailtoFor, paymentLabel } from "../../../lib/members";
import {
  STATUS_FILTERS,
  filterPayments,
  paymentSummary,
  paymentsCsv,
  receiptEmail,
  reminderEmail,
  renewalAfterPayment,
  sortPayments,
  statusCounts,
} from "../../../lib/payments";
import { DEFAULT_PAGE_SIZE, paginate } from "../../../lib/paging";

const NO_FILTERS = { status: "all", access: "all", search: "" };

// What came in, what's waiting, and when it's paid out. Everything is worked
// out from the payment rows, which point at members and at the plans and
// offers they paid for — the same rows the members page reads.
export default function PaymentsPage() {
  const { payments, members, studioPlans, programmes, bundles, everydayLessons, markPaymentPaid } = useAppData();
  const { showToast } = useToast();

  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  // Which page, and how many to a page; back to page 1 whenever what's listed changes.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const refilter = (patch) => {
    setFilters((x) => ({ ...x, ...patch }));
    setPage(1);
  };
  const [memberId, setMemberId] = useState(null);
  const [markId, setMarkId] = useState(null);

  const ctx = useMemo(
    () => ({ plans: studioPlans, programmes, payments, bundles, lessons: everydayLessons }),
    [studioPlans, programmes, payments, bundles, everydayLessons]
  );
  const memberOf = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m]));
    return (id) => byId.get(id) || null;
  }, [members]);

  const summary = useMemo(() => paymentSummary(payments), [payments]);
  const counts = useMemo(() => statusCounts(payments), [payments]);
  const shown = useMemo(
    () => sortPayments(filterPayments(payments, filters, members), sort.key, sort.dir),
    [payments, filters, members, sort]
  );
  // Clamped inside paginate: marking a payment paid while viewing Pending can
  // shrink the list past the page you're on.
  const paged = paginate(shown, page, pageSize);
  const filtered =
    filters.status !== NO_FILTERS.status || filters.access !== NO_FILTERS.access || filters.search.trim() !== "";

  // A spreadsheet of what's on screen, for bookkeeping.
  const exportAction = useMemo(
    () => (
      <span
        className="tip-wrap"
        data-tip={
          shown.length
            ? `Download all ${shown.length} payments matching your filters, every page, as a spreadsheet (CSV)`
            : "No payments to export — clear the filters"
        }
        data-tip-side="bottom"
      >
        <button
          className="btn btn-ghost"
          disabled={!shown.length}
          onClick={() => {
            const csv = paymentsCsv(shown, { members, plans: studioPlans, programmes });
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `klubyou-payments-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`Downloaded ${shown.length} payment${shown.length === 1 ? "" : "s"}`);
          }}
        >
          <Icon name="receipt" size={15} strokeWidth={2} /> Export CSV
        </button>
      </span>
    ),
    [shown, members, studioPlans, programmes, showToast]
  );
  usePageHeader("Payments", "What you've earned, what's waiting, and when it's paid out.", exportAction);

  const marking = payments.find((p) => p.id === markId) || null;
  const markingWho = marking ? memberOf(marking.memberId) : null;
  const markingRenewal = marking && markingWho ? renewalAfterPayment(markingWho, marking, ctx) : null;

  return (
    <section className="panel">
      <div className="msum">
        <div className="msum-b" data-tip="Payments received this calendar month">
          <span>Received this month</span>
          <b>{money(summary.received)}</b>
          <small className="msum-sub">
            {money(summary.fromMemberships)} memberships · {money(summary.fromProgrammes)} programmes
          </small>
        </div>
        <div className="msum-b" data-tip="Payments that haven't gone through — those members show as Payment due">
          <span>Pending</span>
          <b className={summary.pendingCount ? "warn-text" : undefined}>{money(summary.pending)}</b>
          <small className="msum-sub">
            {summary.pendingCount} payment{summary.pendingCount === 1 ? "" : "s"}
          </small>
        </div>
        <div className="msum-b" data-tip="Paid out every Friday: what came in since the last payout, after the fee">
          <span>Next payout</span>
          <b>{money(summary.payout.amount)}</b>
          <small className="msum-sub">
            {summary.payout.on.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </small>
        </div>
        <div className="msum-b" data-tip={`KlubYou keeps ${FEE_LABEL} of every payment`}>
          <span>KlubYou fee ({FEE_LABEL})</span>
          <b>{money(summary.fee)}</b>
          <small className="msum-sub">this month</small>
        </div>
      </div>

      <div className="filters">
        <div className="chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip${filters.status === f.key ? " on" : ""}`}
              aria-pressed={filters.status === f.key}
              data-tip={f.tip}
              onClick={() => refilter({ status: f.key })}
            >
              {f.label} <span className="chip-n">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <AccessFilter
          id="payment-for"
          label="Filter by what was paid for"
          value={filters.access}
          onChange={(access) => refilter({ access })}
          plans={studioPlans}
          programmes={programmes}
          allLabel="Everything paid for"
        />
        <div className="search">
          <Icon name="search" size={16} color="#5B5470" />
          <input
            value={filters.search}
            onChange={(e) => refilter({ search: e.target.value })}
            placeholder="Search by member or email"
            aria-label="Search payments by member name or email"
          />
        </div>
      </div>

      <PaymentTable
        payments={paged.items}
        memberOf={memberOf}
        ctx={ctx}
        sort={sort}
        onSort={(key, dir) => {
          setSort({ key, dir });
          setPage(1);
        }}
        filtered={filtered}
        onClearFilters={() => {
          setFilters(NO_FILTERS);
          setPage(1);
        }}
        pager={
          <Pagination
            {...paged}
            size={pageSize}
            noun="payments"
            onPage={setPage}
            onSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        }
        onOpenMember={(m) => setMemberId(m.id)}
        onEmail={(m) => {
          window.location.href = mailtoFor(m, { body: `Hi ${m.name.split(" ")[0]},\n\n` });
        }}
        onReceipt={(p, m) => {
          window.location.href = receiptEmail(m, p, ctx);
        }}
        onRemind={(p, m) => {
          window.location.href = reminderEmail(m, p, ctx);
        }}
        onMarkPaid={(p) => setMarkId(p.id)}
      />

      <MemberDetailModal
        member={memberOf(memberId)}
        ctx={ctx}
        onClose={() => setMemberId(null)}
        onEmail={(m) => {
          window.location.href = mailtoFor(m, { body: `Hi ${m.name.split(" ")[0]},\n\n` });
        }}
      />

      <ConfirmModal
        open={!!marking}
        title="Mark as paid"
        message={marking && markingWho ? `Mark ${markingWho.name}'s ${money2(marking.amount)} as paid?` : ""}
        detail={
          marking
            ? `${paymentLabel(marking, ctx)}. ${
                markingRenewal
                  ? `Their renewal moves to ${formatDayMonth(markingRenewal)} and "Payment due" clears.`
                  : `"Payment due" clears.`
              } Only do this once the money has actually arrived.`
            : ""
        }
        confirmLabel="Mark as paid"
        cancelTip="Leave it pending"
        confirmTip="Record it as received today"
        onConfirm={() => markPaymentPaid(marking.id)}
        onClose={() => setMarkId(null)}
      />
    </section>
  );
}
