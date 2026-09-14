import { useState } from "react";
import Modal from "../../common/Modal";
import { bundleSummary, isEmptyBundle, toggleInList } from "../../../lib/membership";
import { isPublished } from "../../../lib/programme";
import { patternLabel, repeats, timeLabel } from "../../../lib/everyday";

const PROGRAMME_LABEL = { live: "Live programme", recorded: "Recorded programme" };
const blank = { name: "", description: "", programmes: [], lessons: [] };

export default function BundleFormModal({ open, editing, programmes = [], lessons = [], onClose, onSave }) {
  const [form, setForm] = useState(() => (editing ? { ...blank, ...editing } : blank));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const liveProgrammes = (programmes || []).filter(isPublished);
  const liveLessons = (lessons || []).filter((l) => l.active !== false);
  const empty = isEmptyBundle(form, programmes, lessons);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit bundle" : "New bundle"}
      maxWidth={540}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            disabled={!form.name.trim() || empty}
            onClick={() => {
              onSave({ ...form, name: form.name.trim(), description: form.description.trim() });
              onClose();
            }}
          >
            {editing ? "Save bundle" : "Create bundle"}
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Bundle name</label>
        <input
          className="field"
          placeholder="e.g. Daily classes, Flagship programmes"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div className="ctrl">
        <label className="lbl">Description</label>
        <input
          className="field"
          placeholder="What's in it, in a line"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>

      {/* No "everything" option here: that's a property of a plan. A bundle
          that followed everything would be a second way to say the same thing. */}
      {liveProgrammes.length > 0 && (
        <div className="ctrl">
          <label className="lbl">Programmes</label>
          <div className="bundle-pick">
            {liveProgrammes.map((p) => {
              const on = (form.programmes || []).includes(p.id);
              return (
                <label className={`bundle-row${on ? " on" : ""}`} key={p.id}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ programmes: toggleInList(form.programmes, p.id) })}
                  />
                  <div>
                    <b>{p.name}</b>
                    <small>{PROGRAMME_LABEL[p.type] || ""}</small>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {liveLessons.length > 0 && (
        <div className="ctrl">
          <label className="lbl">Everyday lessons</label>
          <div className="bundle-pick">
            {liveLessons.map((l) => {
              const on = (form.lessons || []).includes(l.id);
              return (
                <label className={`bundle-row${on ? " on" : ""}`} key={l.id}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ lessons: toggleInList(form.lessons, l.id) })}
                  />
                  <div>
                    <b>{l.title}</b>
                    <small>
                      {repeats(l) ? patternLabel(l) : "One-off"} · {timeLabel(l.time)}
                    </small>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className={`plan-sum${empty ? " warn" : ""}`}>
        <b>{empty ? "Nothing in this bundle" : bundleSummary(form, programmes, lessons)}</b>
        <span>
          {empty
            ? "Tick at least one thing — an empty bundle opens nothing for the plans that use it."
            : "Plans that include this bundle open all of it."}
        </span>
      </div>
    </Modal>
  );
}
