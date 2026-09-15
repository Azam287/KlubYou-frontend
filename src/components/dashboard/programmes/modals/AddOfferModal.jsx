import { useState } from "react";
import Modal from "../../../common/Modal";
import Icon from "../../../common/Icon";
import { OFFER_KINDS } from "../../../../lib/programme";
import { currencySymbol } from "../../../../lib/locale";

const LENGTHS = ["1 month", "3 months", "6 months", "12 months"];

// An offer unlocks this programme on its own — either bought once outright or
// subscribed to. (The studio-wide subscription is managed on My page, since it
// covers every programme rather than any single one.)
export default function AddOfferModal({ open, onClose, onSave }) {
  const [kind, setKind] = useState("oneoff");
  const [label, setLabel] = useState("");
  const [length, setLength] = useState(LENGTHS[0]);
  const [price, setPrice] = useState("");

  const handleClose = () => {
    setKind("oneoff");
    setLabel("");
    setLength(LENGTHS[0]);
    setPrice("");
    onClose();
  };

  const handleSave = () => {
    onSave(
      kind === "subscription"
        // The number only: it's shown in whatever currency the studio uses.
        ? { kind, length, price: String(Number(price) || 0) }
        : { kind, label: label || "Full programme", price: String(Number(price) || 0) }
    );
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add an offer"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose} data-tip="Close without adding">
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={handleSave}
            data-tip="Add this offer to the programme"
          >
            Save offer
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">How is it sold?</label>
        <div className="picks two">
          {Object.values(OFFER_KINDS).map((k) => (
            <div
              key={k.key}
              className={`pick${kind === k.key ? " sel" : ""}`}
              onClick={() => setKind(k.key)}
            >
              <span className="pico">
                <Icon name={k.key === "subscription" ? "payments" : "course"} size={18} strokeWidth={1.8} />
              </span>
              <div>
                <b>{k.label}</b>
                <span>{k.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {kind === "subscription" ? (
          <div className="ctrl">
            <label className="lbl">Length</label>
            <select className="field" value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTHS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="ctrl">
            <label className="lbl">What they get</label>
            <input
              className="field"
              placeholder="Full programme"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        )}
        <div className="ctrl">
          <label className="lbl">Price ({currencySymbol().trim()})</label>
          <input
            className="field"
            type="number"
            placeholder="40"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      <p className="hint">
        This unlocks only this programme. Studio subscribers can already reach it.
      </p>
    </Modal>
  );
}
