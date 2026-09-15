// The payments page as rendered. Rules live in payments.test.js.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import PaymentsPage from "../src/components/dashboard/payments/PaymentsPage.jsx";
import PaymentTable from "../src/components/dashboard/payments/PaymentTable.jsx";
import MemberDetailModal from "../src/components/dashboard/members/MemberDetailModal.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import {
  initialBundles as B,
  initialEverydayLessons as L,
  initialMembers as M,
  initialPayments as PAY,
  initialProgrammes as P,
  initialStudioPlans as PL,
} from "../src/data/mockData";
import { money } from "../src/lib/stats";
import { paymentSummary } from "../src/lib/payments";

const noop = () => {};
const wrap = (el) => clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter>{el}</MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));
const ctx = { plans: PL, programmes: P, payments: PAY, bundles: B, lessons: L };
const untipped = (html) => [...html.matchAll(/<button\b[^>]*>/g)].filter((x) => !/data-tip="/.test(x[0])
  && !/<span\b[^>]*data-tip="[^"]+"[^>]*>\s*$/.test(html.slice(Math.max(0, x.index - 300), x.index))).map((x) => x[0]);

const page = wrap(<PaymentsPage />);
const s = paymentSummary(PAY);

/* ---- summary ---- */
ok("four figures, in the same strip as members and membership", (page.match(/class="msum-b"/g) || []).length === 4 && !page.includes("cardbox stat"));
ok("received this month, split by where it came from", page.includes(">Received this month<") && page.includes(`${money(s.fromMemberships)} memberships · ${money(s.fromProgrammes)} programmes`));
ok("pending, with how many", page.includes(">Pending<") && page.includes(`${s.pendingCount} payments`));
ok("the next payout has a real date", page.includes(">Next payout<") && page.includes(s.payout.on.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }))
  && !page.includes("Fri, after fees"));
ok("the fee", page.includes(">KlubYou fee (10%)<"));

/* ---- filters ---- */
ok("status chips with counts", ["All", "Paid", "Pending"].every((t) => page.includes(`${t} <span class="chip-n">`)) && page.includes(`All <span class="chip-n">${PAY.length}</span>`));
ok("filter by what was paid for, the same list as members", page.includes('for="payment-for"') && PL.every((p) => page.includes(`>${p.name} · `))
  && source("src/components/dashboard/members/MemberFilters.jsx").includes("<AccessFilter"));
ok("search by member or email", page.includes('placeholder="Search by member or email"'));

/* ---- the table ---- */
ok("the first page shows ten payments", (page.match(/<tr>/g) || []).length - 1 === 10);
ok("...says how many there are and has a second page", page.includes(`Showing 1–10 of ${PAY.length} payments`) && page.includes('aria-label="Page 2"')
  && page.includes('aria-label="Payments pages"'));
ok("named from the plan or offer", page.includes("Half year · 6 months") && page.includes("Morning Vinyasa · Full programme"));
ok("the member's name opens them", (page.match(/class="who who-btn"/g) || []).length === 10);
ok("date and amount sort", (page.match(/class="th-sort( on)?"/g) || []).length === 2 && /aria-sort="descending"[^>]*>\s*<button class="th-sort on"[^>]*>Date/.test(page));
ok("pending says what it means", page.includes("the member shows as Payment due"));
ok("every button has a tooltip", untipped(page).length === 0, untipped(page).slice(0, 3).join(" | "));
ok("cells are labelled for the phone layout", page.includes('data-label="For"') && page.includes('class="tbl mtbl"'));

const tableSrc = source("src/components/dashboard/payments/PaymentTable.jsx");
ok("a pending payment offers Mark as paid and a reminder", /p\.status === "pending"[\s\S]{0,400}Mark as paid[\s\S]{0,400}Remind them/.test(tableSrc));
ok("...and a receipt only once it's paid", /p\.status === "paid"[\s\S]{0,200}Send receipt/.test(tableSrc) && (tableSrc.match(/Send receipt/g) || []).length === 1);
ok("every menu item has a tooltip", (tableSrc.match(/label: "/g) || []).length === (tableSrc.match(/tip: "/g) || []).length);
const emptyFiltered = R(<PaymentTable payments={[]} memberOf={() => null} ctx={ctx} sort={{ key: "date", dir: "desc" }} onSort={noop} filtered onClearFilters={noop} />);
ok("no matches offers to clear the filters", emptyFiltered.includes("No payments match these filters") && emptyFiltered.includes("Clear filters"));

/* ---- wiring ---- */
const pageSrc = source("src/components/dashboard/payments/PaymentsPage.jsx");
ok("marking paid asks first and says what moves", pageSrc.includes("<ConfirmModal") && pageSrc.includes("Their renewal moves to")
  && pageSrc.includes("Only do this once the money has actually arrived") && pageSrc.includes("markPaymentPaid(marking.id)"));
ok("paging resets when what's listed changes, and export takes every page", (pageSrc.match(/setPage\(1\)/g) || []).length >= 4
  && pageSrc.includes("payments={paged.items}") && pageSrc.includes("paymentsCsv(shown,") && pageSrc.includes("every page"));
ok("export downloads the payments shown as CSV", pageSrc.includes("paymentsCsv(shown,") && pageSrc.includes("text/csv") && pageSrc.includes("klubyou-payments-"));
ok("...and says why when there's nothing to export", pageSrc.includes("No payments to export — clear the filters"));
ok("reminders and receipts open the mail app", pageSrc.includes("reminderEmail(m, p, ctx)") && pageSrc.includes("receiptEmail(m, p, ctx)"));
const store = source("src/context/AppDataContext.jsx");
ok("marking paid records it and moves the member's renewal", /markPaymentPaid = useCallback\([\s\S]{0,900}renewalAfterPayment\(target, payment, ctx\)[\s\S]{0,400}status: "paid"[\s\S]{0,300}setMembers/.test(store)
  && (store.match(/\bmarkPaymentPaid,/g) || []).length === 2);

const fromPayments = R(<MemberDetailModal member={M.find((x) => x.id === "m3")} ctx={ctx} onClose={noop} onEmail={noop} />);
ok("a member opened from payments offers only what this page can do", fromPayments.includes(">Email</button>")
  && !fromPayments.includes("Gift days") && !fromPayments.includes("Voucher") && !fromPayments.includes("Stop renewal"));

done();
