import { useState } from "react";
import Modal from "../../../common/Modal";

// A video's title could be typed once, when it was added inline, and never
// corrected — the row only offered its link, its visibility and its deletion.
export default function RenameVideoModal({ open, video, onClose, onSave }) {
  const [title, setTitle] = useState(video?.title || "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename video"
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            disabled={!title.trim()}
            onClick={() => {
              onSave(title.trim());
              onClose();
            }}
          >
            Save name
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Video title</label>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
    </Modal>
  );
}
