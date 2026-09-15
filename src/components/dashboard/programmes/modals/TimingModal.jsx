import { useEffect, useState } from "react";
import Modal from "../../../common/Modal";
import { fromDateTimeInputs, toDateInput, toTimeInput } from "../../../../lib/datetime";

export default function TimingModal({ open, onClose, onSave, initialStartsAt, seriesCount = 0 }) {
  const [scope, setScope] = useState("one");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (open) {
      setScope("one");
      setDate(toDateInput(initialStartsAt));
      setTime(toTimeInput(initialStartsAt));
      setNotify(true);
    }
  }, [open, initialStartsAt]);

  const handleClose = () => {
    setScope("one");
    setDate("");
    setTime("");
    setNotify(true);
    onClose();
  };

  const handleSave = () => {
    const startsAt = fromDateTimeInputs(date, time) || initialStartsAt || null;
    onSave({ startsAt, scope, notify });
    handleClose();
  };

  // The series option only appears when there is a series to act on — it used
  // to be offered unconditionally and never did anything.
  const hasSeries = seriesCount > 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change class timing"
      footer={
        <>
          <button
            className="btn btn-ghost"
            onClick={handleClose}
            data-tip="Close without changing anything"
          >
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={handleSave}
            data-tip="Save the new date and time"
          >
            Save changes
          </button>
        </>
      }
    >
      {hasSeries && (
        <div className="ctrl">
          <label className="lbl">Apply to</label>
          <div className="segbtns">
            <button
              className={`seg${scope === "one" ? " on" : ""}`}
              onClick={() => setScope("one")}
              data-tip="Change only this class"
            >
              This class only
            </button>
            <button
              className={`seg${scope === "series" ? " on" : ""}`}
              onClick={() => setScope("series")}
              data-tip="Change every class in the series"
            >
              All {seriesCount} in the series
            </button>
          </div>
          <p className="hint">
            {scope === "series"
              ? `Every class in this series moves by the same amount, keeping the gaps between them.`
              : "Only the occurrence you picked will move."}
          </p>
        </div>
      )}
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
