import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import ConfirmModal from "../../common/ConfirmModal";
import Pagination from "../../common/Pagination";
import MemberFilters from "./MemberFilters";
import MemberTable from "./MemberTable";
import MemberDetailModal from "./MemberDetailModal";
import GiftDaysModal from "./GiftDaysModal";
import VoucherModal from "./VoucherModal";
import {
  filterMembers,
  mailtoFor,
  memberSummary,
  renewalOf,
  sortMembers,
  stateCounts,
} from "../../../lib/members";
import { DEFAULT_PAGE_SIZE, paginate } from "../../../lib/paging";

const NO_FILTERS = { state: "all", access: "all", search: "" };

// Everyone who has joined, what they bought, and where they stand. Every
// figure and label is worked out from the member, the plan or offer they
// bought, and their payments — see lib/members.js.
export default function MembersPage() {
  usePageHeader("Members", "Everyone who has joined your studio, what they bought and where they stand.");
  const {
    members,
    studioPlans,
    programmes,
    payments,
    bundles,
    everydayLessons,
    attendance,
    giftMemberDays,
    setMemberAutoRenew,
    addMemberVoucher,
  } = useAppData();

  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState({ key: "joined", dir: "desc" });
  // Which page, and how many to a page. Any change to what's listed goes back
  // to page 1 — page 3 of a new filter isn't where anyone expects to land.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const refilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  // Ids rather than member objects, so a modal always shows the member as they
  // are now — after a gift or a stop, not as they were when it opened.
  const [detailId, setDetailId] = useState(null);
  const [giftId, setGiftId] = useState(null);
  const [voucherId, setVoucherId] = useState(null);
  const [stopId, setStopId] = useState(null);

  const ctx = useMemo(
    () => ({ plans: studioPlans, programmes, payments, bundles, lessons: everydayLessons, attendance }),
    [studioPlans, programmes, payments, bundles, everydayLessons, attendance]
  );
  const counts = useMemo(() => stateCounts(members, ctx), [members, ctx]);
  const summary = useMemo(() => memberSummary(members, ctx), [members, ctx]);
  const shown = useMemo(
    () => sortMembers(filterMembers(members, filters, ctx), sort.key, sort.dir, ctx),
    [members, filters, sort, ctx]
  );
  // Clamped inside paginate, so a list that shrinks never leaves an empty page.
  const paged = paginate(shown, page, pageSize);
  const byId = (id) => members.find((m) => m.id === id) || null;
  const filtered =
    filters.state !== NO_FILTERS.state || filters.access !== NO_FILTERS.access || filters.search.trim() !== "";

  const actions = {
    onOpen: (m) => setDetailId(m.id),
    onEmail: (m) => {
      window.location.href = mailtoFor(m, { body: `Hi ${m.name.split(" ")[0]},\n\n` });
    },
    onGift: (m) => setGiftId(m.id),
    onVoucher: (m) => setVoucherId(m.id),
    onStop: (m) => setStopId(m.id),
    onResume: (m) => setMemberAutoRenew(m.id, true),
  };

  const stopping = byId(stopId);

  return (
    <section className="panel">
      <div className="msum">
        <div className="msum-b" data-tip="Everyone with access right now">
          <span>Active members</span>
          <b>
            {summary.active} <small>{summary.retention}% kept</small>
          </b>
        </div>
        <div className="msum-b" data-tip="Signed up in the last 7 days, bought or not">
          <span>Joined this week</span>
          <b>{summary.joinedThisWeek}</b>
        </div>
        <div className="msum-b" data-tip="Renewing or ending in the next 7 days">
          <span>Renewing soon</span>
          <b>{summary.renewing}</b>
        </div>
        <div className="msum-b" data-tip="Renewal payments that haven't gone through">
          <span>Payment due</span>
          <b className={summary.due ? "warn-text" : undefined}>{summary.due}</b>
        </div>
      </div>

      <MemberFilters
        state={filters.state}
        onState={(state) => refilter({ state })}
        counts={counts}
        access={filters.access}
        onAccess={(access) => refilter({ access })}
        plans={studioPlans}
        programmes={programmes}
        search={filters.search}
        onSearch={(search) => refilter({ search })}
      />

      <MemberTable
        members={paged.items}
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
            noun="members"
            onPage={setPage}
            onSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        }
        {...actions}
      />

      <MemberDetailModal
        member={byId(detailId)}
        ctx={ctx}
        onClose={() => setDetailId(null)}
        {...actions}
      />

      <GiftDaysModal
        key={giftId || "gift"}
        member={byId(giftId)}
        onClose={() => setGiftId(null)}
        onGive={(m, days) => giftMemberDays(m.id, days)}
      />

      <VoucherModal
        key={voucherId || "voucher"}
        member={byId(voucherId)}
        onClose={() => setVoucherId(null)}
        onCreate={(m, percent) => {
          const voucher = addMemberVoucher(m.id, percent);
          if (voucher) {
            window.location.href = mailtoFor(m, {
              subject: `A ${percent}% discount for you`,
              body: `Hi ${m.name.split(" ")[0]},\n\nHere's ${percent}% off your next payment — use the code ${voucher.code} at checkout.\n`,
            });
          }
        }}
      />

      <ConfirmModal
        open={!!stopping}
        title="Stop renewal"
        message={stopping ? `Stop ${stopping.name}'s renewal?` : ""}
        detail={
          stopping
            ? `They keep access until ${renewalOf(stopping, ctx).label.replace(/^Renews /, "")}, then it ends and they won't be charged again. You can resume it until then.`
            : ""
        }
        confirmLabel="Stop renewal"
        cancelTip="Keep it renewing"
        confirmTip="It won't renew — access runs to the end of the paid time"
        onConfirm={() => setMemberAutoRenew(stopping.id, false)}
        onClose={() => setStopId(null)}
      />
    </section>
  );
}
