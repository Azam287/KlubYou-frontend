import { useState } from "react";
import Modal from "../../common/Modal";

const REPEAT_OPTIONS = [
  "Just this once",
  "Every day — whole course / membership",
  "Every weekday (Mon–Fri)",
  "Weekly on this day",
];

const emptyForm = { title: "", description: "", date: "", time: "", repeats: REPEAT_OPTIONS[0], venueUrl: "" };

// Shared "add a class" form — used both for a programme's class list and
// for scheduling a standalone live class from the Classes page.
export default function ClassFormModal({ open, onClose, onSubmit, titlePlaceholder }) {
  const [form, setForm] = useState(emptyForm);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const handleSave = () => {
    onSubmit(form);
    setForm(emptyForm);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add class"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-coral" onClick={handleSave}>
            Save class
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Class name</label>
        <input
          className="field"
          placeholder={titlePlaceholder || "e.g. Week 3 · Backbends"}
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label className="lbl">Description</label>
        <textarea
          className="field"
          placeholder="What will this class cover?"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <div className="two-col">
        <div className="ctrl">
          <label className="lbl">Date</label>
          <input className="field" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="ctrl">
          <label className="lbl">Time</label>
          <input className="field" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
      </div>
      <div className="ctrl">
        <label className="lbl">Repeats</label>
        <select className="field" value={form.repeats} onChange={(e) => set({ repeats: e.target.value })}>
          {REPEAT_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <p className="hint">
          A repeating class runs for the entire course or membership. Each occurrence gets its own
          link and its own attendance.
        </p>
      </div>
      <div className="ctrl">
        <label className="lbl">Where is this class held?</label>
        <input
          className="field"
          placeholder="Paste your Zoom, Google Meet or YouTube link"
          value={form.venueUrl}
          onChange={(e) => set({ venueUrl: e.target.value })}
        />
        <p className="hint">
          Members join through their own personal link, which redirects here — and their attendance
          is marked the moment they use it.
        </p>
      </div>
    </Modal>
  );
}
