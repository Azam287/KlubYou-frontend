import { useEffect, useState } from "react";
import Modal from "../../../common/Modal";

export default function DeleteClassModal({ open, onClose, onConfirm, seriesCount = 0 }) {
  const [scope, setScope] = useState("one");

  useEffect(() => {
    if (open) setScope("one");
  }, [open]);

  const handleClose = () => {
    setScope("one");
    onClose();
  };

  // Only offered when a series actually exists — and it now genuinely removes
  // every class in it.
  const hasSeries = seriesCount > 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Delete class"
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose} data-tip="Keep the class">
            Cancel
          </button>
          <button
            data-tip={scope === "series" && hasSeries ? `Delete all ${seriesCount} classes in the series` : "Delete just this class"}
            className="btn btn-coral"
            onClick={() => {
              onConfirm(scope);
              handleClose();
            }}
          >
            {scope === "series" && hasSeries ? `Delete ${seriesCount} classes` : "Delete"}
          </button>
        </>
      }
    >
      <p className="confirm-msg">
        This can't be undone. {hasSeries ? "What would you like to delete?" : "Delete this class?"}
      </p>
      {hasSeries && (
        <div className="ctrl">
          <div className="segbtns">
            <button
              className={`seg${scope === "one" ? " on" : ""}`}
              onClick={() => setScope("one")}
              data-tip="Delete only this class"
            >
              This class only
            </button>
            <button
              className={`seg${scope === "series" ? " on" : ""}`}
              onClick={() => setScope("series")}
              data-tip="Delete every class in this series"
            >
              All {seriesCount} in the series
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
