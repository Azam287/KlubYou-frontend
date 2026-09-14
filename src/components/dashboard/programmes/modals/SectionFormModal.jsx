import { useState } from "react";
import Modal from "../../../common/Modal";

// Add a section, or rename one. Renaming was the missing half: a section title
// could be set once and never corrected, while `updateSection` sat in the
// context with nothing calling it.
export default function SectionFormModal({ open, editing, onClose, onSave }) {
  const [title, setTitle] = useState(editing?.title || "");

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? "Rename section" : "Add a section"}
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            disabled={!title.trim()}
            onClick={() => {
              onSave(title.trim());
              handleClose();
            }}
          >
            {editing ? "Save name" : "Add section"}
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Section name</label>
        <input
          className="field"
          placeholder="e.g. Week 1 · Foundations"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="hint">Sections group videos in the order members work through them.</p>
      </div>
    </Modal>
  );
}
