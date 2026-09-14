import { scheduleWindow, windowLabel } from "../../../lib/programme";
import { formatDayMonth } from "../../../lib/datetime";

// The two fields that define how long a live programme runs, shared by the
// create and edit forms so both ask the question the same way. Start date plus
// a length in weeks — the end date is shown but never typed, so the two halves
// can't contradict each other.
export default function RunWindowFields({ startsOn, weeks, onChange }) {
  const window = scheduleWindow({ startsOn, weeks });

  return (
    <>
      <div className="two-col">
        <div className="ctrl">
          <label className="lbl">First class on</label>
          <input
            className="field"
            type="date"
            value={startsOn || ""}
            onChange={(e) => onChange({ startsOn: e.target.value })}
          />
        </div>
        <div className="ctrl">
          <label className="lbl">Runs for</label>
          <div className="weeks-in">
            <input
              className="field"
              type="number"
              min="1"
              max="52"
              value={weeks ?? ""}
              onChange={(e) => onChange({ weeks: e.target.value })}
            />
            <span>weeks</span>
          </div>
        </div>
      </div>
      <p className="hint">
        {window
          ? `Runs ${windowLabel(window)} — a weekly class fills it with ${window.weeks} sessions, ending ${formatDayMonth(window.lastDay)}.`
          : "Set these first: they decide how many classes a recurring series creates."}
      </p>
    </>
  );
}
