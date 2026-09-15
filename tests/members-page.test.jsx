// The members page as rendered. Rules live in members.test.js.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import MembersPage from "../src/components/dashboard/members/MembersPage.jsx";
import MemberTable from "../src/components/dashboard/members/MemberTable.jsx";
import MemberDetailModal from "../src/components/dashboard/members/MemberDetailModal.jsx";
import GiftDaysModal from "../src/components/dashboard/members/GiftDaysModal.jsx";
import VoucherModal from "../src/components/dashboard/members/VoucherModal.jsx";
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
import { formatDayMonth } from "../src/lib/datetime";
import { giftedRenewal, sortMembers, stateCounts, voucherCode } from "../src/lib/members";

const noop = () => {};
const wrap = (el) => clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter>{el}</MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));
const ctx = { plans: PL, programmes: P, payments: PAY, bundles: B, lessons: L };
const m = (id) => M.find((x) => x.id === id);
const actions = { onOpen: noop, onEmail: noop, onGift: noop, onVoucher: noop, onStop: noop, onResume: noop };
const untipped = (html) => [...html.matchAll(/<button\b[^>]*>/g)].filter((x) => !/data-tip="/.test(x[0])
  && !/<span\b[^>]*data-tip="[^"]+"[^>]*>\s*$/.test(html.slice(Math.max(0, x.index - 300), x.index))).map((x) => x[0]);

const page = wrap(<MembersPage />);

/* ---- summary and filters ---- */
ok("four summary figures lead the page", (page.match(/class="msum-b"/g) || []).length === 4
  && ["Active members", "Joined this week", "Renewing soon", "Payment due"].every((t) => page.includes(`>${t}<`)));
const counts = stateCounts(M, ctx);
ok("status chips carry their counts", ["All", "Active", "Renewing soon", "Payment due", "Inactive", "Leads"].every((t) => page.includes(`${t} <span class="chip-n">`))
  && page.includes(`All <span class="chip-n">${counts.all}</span>`));
ok("the access filter lists the real plans and programmes", PL.every((p) => page.includes(`>${p.name} · `)) && page.includes(">Morning Vinyasa</option>")
  && page.includes("Any membership plan") && page.includes("Not bought yet"));
ok("...and is labelled", page.includes('<label class="sr-only" for="member-access">'));
ok("search covers email", page.includes('placeholder="Search by name or email"'));
ok("the old studio wording is gone", !page.includes("Studio subscription") && !page.includes("Single programme") && !page.includes("visited page"));

/* ---- the table ---- */
ok("the first page shows ten members", (page.match(/class="who who-btn"/g) || []).length === 10);
ok("...and says how many there are", page.includes(`Showing 1–10 of ${M.length} members`));
ok("...with pages to move between", page.includes('aria-label="Members pages"') && page.includes('aria-current="page"') && page.includes('aria-label="Page 3"'));
ok("...and a page size", page.includes(">Per page<") && ["10", "25", "50"].every((n) => page.includes(`<option value="${n}"`)));
// The whole list, for checks about particular members.
const all = R(<MemberTable members={sortMembers(M, "joined", "desc", ctx)} ctx={ctx} sort={{ key: "joined", dir: "desc" }} onSort={noop} filtered={false} onClearFilters={noop} {...actions} />);
const firstShown = sortMembers(M, "joined", "desc", ctx)[0];
ok("newest joiners first by default", page.indexOf(firstShown.name) < page.indexOf(sortMembers(M, "joined", "desc", ctx)[5].name));
ok("rows show the plan's name, not a length", all.includes("Full studio year<small>Membership · 12 months</small>"));
ok("Payment due, Ending and Lifetime show where they apply", all.includes("> Payment due</span>") && all.includes("> Ending</span>") && all.includes("Lifetime access"));
ok("a recorded programme shows videos watched", all.includes(" of 3 videos"));
ok("sortable headers say how they're sorted", /aria-sort="descending"[^>]*>\s*<button class="th-sort on"[^>]*>Joined/.test(page)
  && (page.match(/class="th-sort( on)?"/g) || []).length === 3);
ok("every button on the page has a tooltip", untipped(page).length === 0, untipped(page).slice(0, 3).join(" | "));
ok("cells are labelled for the phone layout", page.includes('data-label="Access"') && page.includes('data-label="Renewal"'));
const css = source("src/styles/members.css");
ok("on a phone each member is a card", /@media \(max-width: 860px\)[\s\S]*\.mtbl thead \{\s*display: none/.test(css)
  && /\.mtbl td\[data-label\]::before \{[^}]*content: attr\(data-label\)/s.test(css));

const emptyFiltered = R(<MemberTable members={[]} ctx={ctx} sort={{ key: "joined", dir: "desc" }} onSort={noop} filtered onClearFilters={noop} {...actions} />);
ok("no matches offers to clear the filters", emptyFiltered.includes("No members match these filters") && emptyFiltered.includes("Clear filters"));
const emptyAll = R(<MemberTable members={[]} ctx={ctx} sort={{ key: "joined", dir: "desc" }} onSort={noop} filtered={false} onClearFilters={noop} {...actions} />);
ok("no members at all says what to do instead", emptyAll.includes("Share your page") && !emptyAll.includes("Clear filters"));

const rowSrc = source("src/components/dashboard/members/MemberRow.jsx");
const menu = rowSrc.slice(rowSrc.indexOf("const items = ["), rowSrc.indexOf("return (\n    <tr>"));
ok("every menu item has a tooltip", (menu.match(/label: "/g) || []).length === (menu.match(/tip: "/g) || []).length
  && (menu.match(/label: "/g) || []).length === 6);
ok("stop and resume depend on the member, not on being a studio member", rowSrc.includes("canStop(member, ctx)") && rowSrc.includes("canResume(member, ctx)")
  && !rowSrc.includes('member.plan === "studio"'));

const pageSrc0 = source("src/components/dashboard/members/MembersPage.jsx");
ok("changing filters, search or sort goes back to page 1", (pageSrc0.match(/setPage\(1\)/g) || []).length >= 4
  && pageSrc0.includes("onState={(state) => refilter({ state })}") && pageSrc0.includes("onSearch={(search) => refilter({ search })}"));
ok("the table gets one page of members", pageSrc0.includes("members={paged.items}"));

/* ---- a member's details ---- */
const tom = R(<MemberDetailModal member={m("m3")} ctx={ctx} onClose={noop} {...actions} />);
ok("details show what they bought and what it opens", tom.includes("Starter") && tom.includes("Membership · 1 month"));
ok("...their renewal and whether it's on", tom.includes("Renews ") && tom.includes("Renews automatically"));
ok("...their payments, the pending one included", tom.includes("Starter · 1 month") && tom.includes("Pending"));
ok("...and the actions, each with a tooltip", ["Email", "Gift days", "Voucher", "Stop renewal"].every((t) => tom.includes(`>${t}</button>`)) && untipped(tom).length === 0);
const daniel = R(<MemberDetailModal member={m("m8")} ctx={ctx} onClose={noop} {...actions} />);
ok("a stopped member can be resumed, not stopped again", daniel.includes("Resume renewal") && !daniel.includes(">Stop renewal<") && daniel.includes("Renewal stopped"));
const aisha = R(<MemberDetailModal member={m("m4")} ctx={ctx} onClose={noop} {...actions} />);
ok("a lifetime buyer has no gifting or stopping", aisha.includes("Lifetime access") && !aisha.includes("Gift days") && !aisha.includes("Stop renewal"));
const withVoucher = R(<MemberDetailModal member={{ ...m("m1"), vouchers: [{ id: "v", code: "EMMA20", percent: 20, createdAt: new Date().toISOString() }] }} ctx={ctx} onClose={noop} {...actions} />);
ok("vouchers they've been given are listed", withVoucher.includes("EMMA20") && withVoucher.includes("20% off"));

/* ---- gifting and vouchers ---- */
const gift = R(<GiftDaysModal member={m("m1")} onClose={noop} onGive={noop} />);
ok("gifting shows the new date before anything changes", gift.includes(formatDayMonth(giftedRenewal(m("m1"), 7))) && gift.includes("Give 7 days"));
ok("...with 7, 14 and 30 to choose from", ["7 days", "14 days", "30 days"].every((t) => gift.includes(`>${t}</button>`)) && untipped(gift).length === 0);
const voucher = R(<VoucherModal member={m("m1")} onClose={noop} onCreate={noop} />);
ok("a voucher shows its code first", voucher.includes(voucherCode(m("m1"), 10)) && voucher.includes("Create and email") && untipped(voucher).length === 0);

/* ---- wiring ---- */
const pageSrc = source("src/components/dashboard/members/MembersPage.jsx");
ok("stopping asks first, and says access runs to the end", pageSrc.includes("<ConfirmModal") && pageSrc.includes("They keep access until")
  && pageSrc.includes("setMemberAutoRenew(stopping.id, false)"));
ok("emails and vouchers open the creator's mail app", pageSrc.includes("window.location.href = mailtoFor(m,") && pageSrc.includes("addMemberVoucher(m.id, percent)"));
const store = source("src/context/AppDataContext.jsx");
ok("gifting really moves the date", /giftMemberDays = useCallback\([\s\S]{0,300}renewsAt = giftedRenewal\(target, days\)/.test(store));
ok("vouchers are recorded on the member", /addMemberVoucher = useCallback\([\s\S]{0,500}vouchers: \[\.\.\.\(m\.vouchers \|\| \[\]\), voucher\]/.test(store));
ok("stopping turns renewal off rather than ending access now", /setMemberAutoRenew = useCallback\([\s\S]{0,200}autoRenew: on/.test(store));
ok("the pretend actions are gone", !store.includes("memberAction") && !store.includes("Gave 7 bonus days"));

done();
