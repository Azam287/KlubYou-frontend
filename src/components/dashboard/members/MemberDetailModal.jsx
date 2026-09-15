import Modal from "../../common/Modal";
import { money2 } from "../../../lib/stats";
import { formatDayMonth, formatMonthYear } from "../../../lib/datetime";
import { contentSummaryOf } from "../../../lib/membership";
import { PROGRAMME_TYPES } from "../../../lib/programme";
import { lastAttendedOf } from "../../../lib/attendance";
import {
  accessOf,
  canGift,
  canResume,
  canStop,
  initialsOf,
  joinedLabel,
  paymentLabel,
  paymentsOf,
  progressOf,
  renewalOf,
  renews,
  stateOf,
} from "../../../lib/members";

// Everything about one member in one place: what they bought and what that
// opens, where their renewal stands, what they've done, what they've paid, and
// the actions — the same ones as the row's menu. Each action shows only when
// its handler is given, so a page can open a member with just the ones it has
// (the payments page offers email).
export default function MemberDetailModal({ member, ctx, onClose, onEmail, onGift, onVoucher, onStop, onResume }) {
  if (!member) return null;
  const access = accessOf(member, ctx);
  const state = stateOf(member, ctx);
  const renewal = renewalOf(member, ctx);
  const progress = progressOf(member, ctx);
  const lastCame = lastAttendedOf(member, ctx.attendance);
  const payments = paymentsOf(member, ctx.payments);
  const opens = access.plan
    ? contentSummaryOf(access.plan, ctx.bundles, ctx.programmes, ctx.lessons)
    : access.programme
      ? (PROGRAMME_TYPES[access.programme.type] || PROGRAMME_TYPES.live).blurb
      : "";

  return (
    <Modal
      open
      onClose={onClose}
      title="Member"
      maxWidth={560}
      footer={
        <>
          {onEmail && (
            <button className="btn btn-ghost" data-tip="Opens an email to them in your mail app" onClick={() => onEmail(member)}>
              Email
            </button>
          )}
          {onGift && canGift(member, ctx) && (
            <button className="btn btn-ghost" data-tip="Move their renewal date back" onClick={() => onGift(member)}>
              Gift days
            </button>
          )}
          {onVoucher && (
            <button className="btn btn-ghost" data-tip="Make a discount code and email it" onClick={() => onVoucher(member)}>
              Voucher
            </button>
          )}
          {onStop && canStop(member, ctx) && (
            <button
              className="btn btn-ghost danger-text"
              data-tip="It won't renew — they keep access until the end of the paid time"
              onClick={() => onStop(member)}
            >
              Stop renewal
            </button>
          )}
          {onResume && canResume(member, ctx) && (
            <button className="btn btn-coral" data-tip="It will renew as normal" onClick={() => onResume(member)}>
              Resume renewal
            </button>
          )}
        </>
      }
    >
      <div className="md-head">
        <span className="md-av">{initialsOf(member.name)}</span>
        <div>
          <b>{member.name}</b>
          <small>{member.email}</small>
        </div>
        <span className={`pill ${state.pill}`} data-tip={state.tip}>
          <i /> {state.label}
        </span>
      </div>

      <dl className="md-facts">
        <div>
          <dt>Access</dt>
          <dd>
            {access.title}
            <small>
              {access.detail}
              {opens ? ` · ${opens}` : ""}
            </small>
          </dd>
        </div>
        <div>
          <dt>{renews(member, ctx) ? "Renewal" : "Access"}</dt>
          <dd>
            {renewal.label}
            {renews(member, ctx) && renewal.kind !== "ended" && (
              <small>{member.autoRenew === false ? "Renewal stopped" : "Renews automatically"}</small>
            )}
          </dd>
        </div>
        <div>
          <dt>Joined</dt>
          <dd>{member.joinedAt ? formatMonthYear(member.joinedAt) : "—"}<small>{joinedLabel(member).startsWith("Signed") ? "Signed up on your page" : ""}</small></dd>
        </div>
        <div>
          <dt>Activity</dt>
          <dd>
            {progress.label}
            {progress.kind !== "videos" && progress.kind !== "none" && (
              <small>{lastCame ? `Last came ${formatDayMonth(lastCame)}` : "Hasn't come to a class yet"}</small>
            )}
          </dd>
        </div>
      </dl>

      <h4 className="md-h">Payments</h4>
      {payments.length ? (
        <ul className="md-list">
          {payments.map((p) => (
            <li key={p.id}>
              <span>
                {paymentLabel(p, ctx)}
                <small>{formatDayMonth(p.paidAt)}</small>
              </span>
              <b>{money2(p.amount)}</b>
              <span className={`pill ${p.status}`}>
                <i /> {p.status === "pending" ? "Pending" : "Paid"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">No payments yet.</p>
      )}

      {(member.vouchers || []).length > 0 && (
        <>
          <h4 className="md-h">Vouchers</h4>
          <ul className="md-list">
            {member.vouchers.map((v) => (
              <li key={v.id}>
                <span>
                  <code className="md-code">{v.code}</code>
                  <small>{formatDayMonth(v.createdAt)}</small>
                </span>
                <b>{v.percent}% off</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
