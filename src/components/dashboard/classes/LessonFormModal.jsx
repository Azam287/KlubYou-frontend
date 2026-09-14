import { useState } from "react";
import Modal from "../../common/Modal";
import { DAY_OPTIONS, EVERY_DAY, WEEKDAYS, daysLabel, timeLabel, toggleDay } from "../../../lib/everyday";
import { formatDayMonth } from "../../../lib/datetime";

const blank = { title: "", time: "07:00", days: EVERY_DAY, date: "", venueUrl: "" };

const PRESETS = [
  { key: "everyday", label: "Every day", days: EVERY_DAY },
  { key: "weekdays", label: "Weekdays", days: WEEKDAYS },
];

// One form, two shapes, decided by the button that opened it. A one-off is
// never asked how often it repeats and an everyday lesson is never offered
// "just once" — the entry point already answered that, and asking twice is
// what made the two kinds feel like the same muddled thing.
//
// One record type still backs both (lib/everyday.js): `kind` only decides
// which half of the form to show.
export default function LessonFormModal({ open, editing, kind = "everyday", onClose, onSubmit }) {
  const once = kind === "once";

  // Seeded at mount. The caller keys this modal by the lesson being edited, so
  // opening it for a different one remounts with the right values instead of
  // showing the previous lesson's for a frame.
  const [form, setForm] = useState(() =>
    editing
      ? { ...blank, ...editing, date: editing.date || "" }
      : { ...blank, days: once ? [] : EVERY_DAY }
  );
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const incomplete = once ? !form.date : form.days.length === 0;
  const noun = once ? "class" : "lesson";

  const handleSave = () => {
    onSubmit({
      title: form.title.trim() || (once ? "Untitled class" : "Untitled lesson"),
      time: form.time,
      days: once ? [] : form.days,
      date: once ? form.date : null,
      venueUrl: form.venueUrl.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${editing ? "Edit" : "New"} ${once ? "one-off class" : "everyday lesson"}`}
      maxWidth={520}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-coral" onClick={handleSave} disabled={incomplete}>
            {editing ? "Save changes" : `Add ${noun}`}
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">{once ? "Class name" : "Lesson name"}</label>
        <input
          className="field"
          placeholder={once ? "e.g. Full Moon Workshop" : "e.g. Sunrise Flow"}
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>

      {!once && (
        <div className="ctrl">
          <label className="lbl">Runs on</label>
          <div className="segbtns">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`seg${daysLabel(form.days) === p.label ? " on" : ""}`}
                onClick={() => set({ days: p.days })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="two-col">
        {once ? (
          <div className="ctrl">
            <label className="lbl">Date</label>
            <input
              className="field"
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </div>
        ) : (
          <div className="ctrl">
            <label className="lbl">Days</label>
            <div className="daypick">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d.day}
                  className={`day${form.days.includes(d.day) ? " on" : ""}`}
                  title={d.short}
                  onClick={() => set({ days: toggleDay(form.days, d.day) })}
                >
                  {d.initial}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="ctrl">
          <label className="lbl">Starts at</label>
          <input
            className="field"
            type="time"
            value={form.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </div>
      </div>
      <p className="hint">
        {once
          ? form.date
            ? `Runs once on ${formatDayMonth(form.date)} at ${timeLabel(form.time)}, then it's done.`
            : "Pick the day it runs."
          : form.days.length
            ? `${daysLabel(form.days)} at ${timeLabel(form.time)} — one link, every session.`
            : "Pick at least one day."}
      </p>

      <div className="ctrl">
        <label className="lbl">Where members join</label>
        <input
          className="field"
          placeholder="Paste your Zoom, Google Meet or YouTube link"
          value={form.venueUrl}
          onChange={(e) => set({ venueUrl: e.target.value })}
        />
        <p className="hint">
          Members join through their own personal link, which redirects here — and their
          attendance is marked the moment they use it.
        </p>
      </div>
    </Modal>
  );
}
