import { useState } from "react";
import Modal from "../../../common/Modal";

export default function TimingModal({ open, onClose, onSave }) {
  const [scope, setScope] = useState("one");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notify, setNotify] = useState(true);

  const handleClose = () => {
    setScope("one");
    setDate("");
    setTime("");
    setNotify(true);
    onClose();
  };

  const handleSave = () => {
    onSave({ when: [date, time].filter(Boolean).join(" · "), scope, notify });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change class timing"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-coral" onClick={handleSave}>
            Save changes
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Apply to</label>
        <div className="segbtns">
          <button className={`seg${scope === "one" ? " on" : ""}`} onClick={() => setScope("one")}>
            This class only
          </button>
          <button className={`seg${scope === "series" ? " on" : ""}`} onClick={() => setScope("series")}>
            The whole series
          </button>
        </div>
        <p className="hint">
          {scope === "series"
            ? "Every class in this recurring series will move to the new time."
            : "Only the occurrence you picked will move."}
        </p>
      </div>
      <div className="two-col">
        <div className="ctrl">
          <label className="lbl">New date</label>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="ctrl">
          <label className="lbl">New time</label>
          <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <label className="checkrow">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        <div>
          <b>Notify members of the change</b>
          <small>We'll email everyone enrolled about the new time.</small>
        </div>
      </label>
    </Modal>
  );
}
