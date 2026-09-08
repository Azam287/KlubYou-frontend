import { useState } from "react";
import Modal from "../../../common/Modal";

export default function DeleteClassModal({ open, onClose, onConfirm }) {
  const [scope, setScope] = useState("one");

  const handleClose = () => {
    setScope("one");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Delete class"
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={() => {
              onConfirm(scope);
              handleClose();
            }}
          >
            Delete
          </button>
        </>
      }
    >
      <p style={{ color: "var(--ink-soft)", marginBottom: 16 }}>
        This can't be undone. What would you like to delete?
      </p>
      <div className="ctrl">
        <div className="segbtns">
          <button className={`seg${scope === "one" ? " on" : ""}`} onClick={() => setScope("one")}>
            This class only
          </button>
          <button className={`seg${scope === "series" ? " on" : ""}`} onClick={() => setScope("series")}>
            The whole series
          </button>
        </div>
      </div>
    </Modal>
  );
}
