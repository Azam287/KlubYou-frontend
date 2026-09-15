import { useState } from "react";
import Modal from "../../common/Modal";
import { formatDayMonth } from "../../../lib/datetime";
import { GIFT_OPTIONS, giftedRenewal } from "../../../lib/members";

// Extra days for free: their renewal date moves back. The new date is shown
// before anything changes.
export default function GiftDaysModal({ member, onClose, onGive }) {
  const [days, setDays] = useState(GIFT_OPTIONS[0]);
  if (!member) return null;
  const first = member.name.split(" ")[0];

  return (
    <Modal
      open
      onClose={onClose}
      title="Gift extra days"
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} data-tip="Close without changing anything">
            Cancel
          </button>
          <button
            className="btn btn-coral"
            data-tip={`${first}'s renewal moves to ${formatDayMonth(giftedRenewal(member, days))}`}
            onClick={() => {
              onGive(member, days);
              onClose();
            }}
          >
            Give {days} days
          </button>
        </>
      }
    >
      <p className="confirm-msg">How many days should {first} get for free?</p>
      <div className="segbtns">
        {GIFT_OPTIONS.map((n) => (
          <button
            key={n}
            className={`seg${days === n ? " on" : ""}`}
            aria-pressed={days === n}
            data-tip={`${n} extra days`}
            onClick={() => setDays(n)}
          >
            {n} days
          </button>
        ))}
      </div>
      <p className="hint">
        Renews {formatDayMonth(member.renewsAt)} now — {formatDayMonth(giftedRenewal(member, days))} after this.
        They won&apos;t be charged for the extra days.
      </p>
    </Modal>
  );
}
