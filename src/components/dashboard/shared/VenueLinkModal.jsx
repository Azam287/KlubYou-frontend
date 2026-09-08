import { useEffect, useState } from "react";
import Modal from "../../common/Modal";

// Shared "where is this class held" link editor — used both by the
// programme class-list "Edit class link" action and the Classes page's
// "Add link" action on a draft class.
export default function VenueLinkModal({ open, onClose, onSave, initialUrl = "", title = "Edit class link" }) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) setUrl(initialUrl);
  }, [open, initialUrl]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={() => {
              onSave(url);
              onClose();
            }}
          >
            Save link
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Where is this class held?</label>
        <input
          className="field"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your Zoom, Google Meet or YouTube link"
        />
        <p className="hint">Members' personal links will now redirect to this address.</p>
      </div>
    </Modal>
  );
}
