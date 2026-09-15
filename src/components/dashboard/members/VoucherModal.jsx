import { useState } from "react";
import Modal from "../../common/Modal";
import { VOUCHER_OPTIONS, voucherCode } from "../../../lib/members";

// A discount code for one member. It's recorded against them, then an email
// opens with the code in it — sending is the creator's mail app, not a pretend.
export default function VoucherModal({ member, onClose, onCreate }) {
  const [percent, setPercent] = useState(VOUCHER_OPTIONS[0]);
  if (!member) return null;
  const first = member.name.split(" ")[0];
  const code = voucherCode(member, percent);

  return (
    <Modal
      open
      onClose={onClose}
      title="Send a voucher"
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} data-tip="Close without making a voucher">
            Cancel
          </button>
          <button
            className="btn btn-coral"
            data-tip="Saves the code on their record and opens an email with it"
            onClick={() => {
              onCreate(member, percent);
              onClose();
            }}
          >
            Create and email
          </button>
        </>
      }
    >
      <p className="confirm-msg">How much off for {first}?</p>
      <div className="segbtns">
        {VOUCHER_OPTIONS.map((n) => (
          <button
            key={n}
            className={`seg${percent === n ? " on" : ""}`}
            aria-pressed={percent === n}
            data-tip={`${n}% off their next payment`}
            onClick={() => setPercent(n)}
          >
            {n}% off
          </button>
        ))}
      </div>
      <p className="hint">
        Their code will be <code className="md-code">{code}</code> — {percent}% off their next payment.
      </p>
    </Modal>
  );
}
