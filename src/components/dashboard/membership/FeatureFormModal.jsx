import { useState } from "react";
import Modal from "../../common/Modal";


// An extra benefit: a perk with no content behind it. Which plans include one
// is decided on the plan, next to its bundles, so this form is only what the
// benefit is. It used to ask which lengths got it, which put the answer in two
// places facing each other.
export default function FeatureFormModal({ open, editing, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    title: editing?.title || "",
    detail: editing?.detail || "",
  }));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit benefit" : "New extra benefit"}
      maxWidth={480}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            disabled={!form.title.trim()}
            onClick={() => {
              onSave({ ...form, title: form.title.trim(), detail: form.detail.trim() });
              onClose();
            }}
          >
            {editing ? "Save benefit" : "Add benefit"}
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">What they get</label>
        <input
          className="field"
          placeholder="e.g. Nutrition & detox plans"
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>

      <div className="ctrl">
        <label className="lbl">Detail (optional)</label>
        <input
          className="field"
          placeholder="e.g. with Maya Okonkwo"
          value={form.detail}
          onChange={(e) => set({ detail: e.target.value })}
        />
      </div>

      <p className="hint">
        It arrives as a draft. Publish it, then put it in a plan on the Plans tab — a benefit
        doesn&apos;t choose its own plans.
      </p>
    </Modal>
  );
}
