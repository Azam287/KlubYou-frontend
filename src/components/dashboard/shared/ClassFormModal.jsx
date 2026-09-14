import { useMemo, useState } from "react";
import Modal from "../../common/Modal";
import { formatDayMonth, fromDateTimeInputs, toDateInput } from "../../../lib/datetime";
import { REPEAT_PATTERNS, expandSeries } from "../../../lib/programme";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  pattern: "once",
  count: 8,
  venueUrl: "",
  shareLink: true,
};

// The "add a class" form for a live programme. Standalone sessions moved to
// Everyday lessons, so this is only ever used inside a programme now — which is
// why recurrence is always on offer here.
//
// Recurrence is real here: the dates it will create are computed and previewed
// before you commit. The old version collected a "Repeats" value and threw it
// away, always creating exactly one class.
export default function ClassFormModal({
  open,
  onClose,
  onSubmit,
  titlePlaceholder,
  window: runWindow = null,
}) {
  const [form, setForm] = useState(emptyForm);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const startsAt = fromDateTimeInputs(form.date, form.time);
  // Inside a programme the run window decides how many classes a series makes,
  // so there is no count to type — it fills the window and stops.
  const dates = useMemo(() => {
    const limit = runWindow ? { until: runWindow.endsOn } : { count: form.count };
    return expandSeries(startsAt, form.pattern, limit);
  }, [startsAt, form.pattern, form.count, runWindow]);

  // A class outside the window would never be part of the programme's run, so
  // it's refused with the reason rather than silently created outside it.
  const windowError = (() => {
    if (!runWindow || !startsAt) return null;
    const t = new Date(startsAt).getTime();
    if (t < new Date(runWindow.startsOn).getTime())
      return `The programme starts on ${formatDayMonth(runWindow.startsOn)} — pick that day or later.`;
    if (t >= new Date(runWindow.endsOn).getTime())
      return `The programme ends on ${formatDayMonth(runWindow.lastDay)} — pick an earlier day, or extend it in Edit details.`;
    return null;
  })();

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const handleSave = () => {
    onSubmit({ ...form, startsAt, dates });
    setForm(emptyForm);
  };

  const repeating = form.pattern !== "once" && dates.length > 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add class"
      maxWidth={560}
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-coral" onClick={handleSave} disabled={!startsAt || !!windowError}>
            {repeating ? `Create ${dates.length} classes` : "Save class"}
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Class name</label>
        <input
          className="field"
          placeholder={titlePlaceholder || "e.g. Sunrise Vinyasa"}
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>

      <div className="two-col">
        <div className="ctrl">
          <label className="lbl">Starts</label>
          <input
            className="field"
            type="date"
            value={form.date}
            min={runWindow ? toDateInput(runWindow.startsOn) : undefined}
            max={runWindow ? toDateInput(runWindow.lastDay) : undefined}
            onChange={(e) => set({ date: e.target.value })}
          />
        </div>
        <div className="ctrl">
          <label className="lbl">Time</label>
          <input className="field" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
      </div>

      <div className="ctrl">
        <label className="lbl">Repeats</label>
        <div className="segbtns">
          {Object.values(REPEAT_PATTERNS).map((p) => (
            <button
              key={p.key}
              className={`seg${form.pattern === p.key ? " on" : ""}`}
              onClick={() => set({ pattern: p.key })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {form.pattern !== "once" && !runWindow && (
        <div className="ctrl">
          <label className="lbl">How many classes</label>
          <input
            className="field"
            type="number"
            min="2"
            max="52"
            value={form.count}
            onChange={(e) => set({ count: Number(e.target.value) })}
          />
        </div>
      )}

      {form.pattern !== "once" && runWindow && (
        <p className="hint">
          Repeats until the programme ends on {formatDayMonth(runWindow.lastDay)} — that's how
          many classes this makes.
        </p>
      )}

      {repeating && (
        <div className="series-preview">
          <div className="sp-h">
            <b>This creates {dates.length} classes</b>
            <span className="mut">
              {formatDayMonth(dates[0])} — {formatDayMonth(dates[dates.length - 1])}
            </span>
          </div>
          <div className="sp-chips">
            {dates.slice(0, 10).map((d) => (
              <span key={d}>{formatDayMonth(d)}</span>
            ))}
            {dates.length > 10 && <span className="more">+{dates.length - 10} more</span>}
          </div>
          <p className="hint">
            Each one gets its own joining link and its own attendance. Change or cancel any
            single class later without touching the rest.
          </p>
        </div>
      )}

      {windowError && <p className="hint warn">{windowError}</p>}

      <div className="ctrl">
        <label className="lbl">Where is this class held?</label>
        <input
          className="field"
          placeholder="Paste your Zoom, Google Meet or YouTube link"
          value={form.venueUrl}
          onChange={(e) => set({ venueUrl: e.target.value })}
        />
        {repeating ? (
          <label className="checkrow">
            <input
              type="checkbox"
              checked={form.shareLink}
              onChange={(e) => set({ shareLink: e.target.checked })}
            />
            <div>
              <b>Use this link for every class in the series</b>
              <small>Turn off to give each class its own link later</small>
            </div>
          </label>
        ) : (
          <p className="hint">
            Members join through their own personal link, which redirects here — and their
            attendance is marked the moment they use it.
          </p>
        )}
      </div>
    </Modal>
  );
}
