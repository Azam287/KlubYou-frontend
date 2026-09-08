import { useState } from "react";
import Modal from "../../../common/Modal";

const LENGTHS = ["1 month", "3 months", "6 months", "12 months"];

export default function AddPlanModal({ open, onClose, onSave }) {
  const [length, setLength] = useState(LENGTHS[0]);
  const [price, setPrice] = useState("");

  const handleClose = () => {
    setLength(LENGTHS[0]);
    setPrice("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add a plan"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={() => {
              onSave({ length, price: `£${price || 0}` });
              handleClose();
            }}
          >
            Save plan
          </button>
        </>
      }
    >
      <div className="two-col">
        <div className="ctrl">
          <label className="lbl">Length</label>
          <select className="field" value={length} onChange={(e) => setLength(e.target.value)}>
            {LENGTHS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="ctrl">
          <label className="lbl">Price (£)</label>
          <input
            className="field"
            type="number"
            placeholder="18"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
