import { useState } from "react";
import Modal from "../../../common/Modal";
import RunWindowFields from "../RunWindowFields";
import { isLive, scheduleWindow } from "../../../../lib/programme";
import { toDateInput } from "../../../../lib/datetime";

// Wires up what used to be a dead "Edit details" button — the name, blurb and
// cover were displayed but not editable.
export default function EditDetailsModal({ open, programme, swatches, onClose, onSave }) {
  // Seeded at mount and keyed by the programme at the call site, so the fields
  // are never briefly those of whatever was open last.
  const [form, setForm] = useState(() => ({
    name: programme?.name || "",
    description: programme?.description || "",
    thumbGradient: programme?.thumbGradient || "",
    // A date input needs YYYY-MM-DD, while the programme stores an ISO
    // timestamp — converted here so editing doesn't blank the field.
    startsOn: toDateInput(programme?.schedule?.startsOn) || "",
    weeks: programme?.schedule?.weeks ?? "",
    introVideo: programme?.introVideo || "",
    certificate: !!programme?.pricing?.certificate,
  }));
  const live = isLive(programme);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit details"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} data-tip="Close without saving">
            Cancel
          </button>
          <span
            className="tip-wrap"
            data-tip={live && !scheduleWindow(form) ? "Set a start date and number of weeks first" : "Save the changes"}
          >
            <button
              className="btn btn-coral"
              disabled={live && !scheduleWindow(form)}
              onClick={() => {
                onSave(form);
                onClose();
              }}
            >
              Save changes
            </button>
          </span>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Programme name</label>
        <input className="field" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="ctrl">
        <label className="lbl">Description</label>
        <textarea
          className="field"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label className="lbl">Intro video</label>
        <input
          className="field"
          placeholder="Link to a short trailer — YouTube, Vimeo, anywhere"
          value={form.introVideo || ""}
          onChange={(e) => set({ introVideo: e.target.value })}
        />
        <p className="hint">What people watch before they decide to buy.</p>
      </div>

      {/* Shown on the programme page and sold on the public page as "certificate
          included" — but until now there was nowhere to switch it on. */}
      <label className="checkrow">
        <input
          type="checkbox"
          checked={!!form.certificate}
          onChange={(e) => set({ certificate: e.target.checked })}
        />
        <div>
          <b>Give a certificate at the end</b>
          <small>Members who finish get one, and your page says so</small>
        </div>
      </label>

      {live && (
        <RunWindowFields
          startsOn={form.startsOn}
          weeks={form.weeks}
          onChange={(patch) => set(patch)}
        />
      )}

      <div className="ctrl">
        <label className="lbl">Cover colour</label>
        <div className="swatches">
          {swatches.map((s) => (
            <span
              key={s.id}
              className={`sw${form.thumbGradient === s.gradient ? " on" : ""}`}
              style={{ background: s.color }}
              role="button"
              tabIndex={0}
              aria-label={`Use ${s.id} cover colour`}
              onClick={() => set({ thumbGradient: s.gradient })}
              onKeyDown={(e) => e.key === "Enter" && set({ thumbGradient: s.gradient })}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
