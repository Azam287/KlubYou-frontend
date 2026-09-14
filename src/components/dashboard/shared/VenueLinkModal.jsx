import { useEffect, useState } from "react";
import Modal from "../../common/Modal";

// Shared link editor — used by the upcoming-class card, the programme class
// list, a recorded lesson's video, and the Classes page's "Add link" action.
export default function VenueLinkModal({
  open,
  onClose,
  onSave,
  initialUrl = "",
  title = "Edit class link",
  label = "Where is this class held?",
  hint = "Members' personal links will now redirect to this address.",
  placeholder = "Paste your Zoom, Google Meet or YouTube link",
}) {
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
        <label className="lbl">{label}</label>
        <input
          className="field"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
        />
        <p className="hint">{hint}</p>
      </div>
    </Modal>
  );
}
