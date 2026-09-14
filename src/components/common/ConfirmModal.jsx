import Modal from "./Modal";

// One confirmation for every destructive action that isn't a class (which has
// its own, because it also asks about the series). Deleting a section used to
// happen on a single click with nothing between the menu and the loss.
export default function ConfirmModal({
  open,
  title,
  message,
  detail,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          {/* Coral, matching the class-deletion modal — this app has no separate
              danger colour, and inventing one here would make two. */}
          <button
            className="btn btn-coral"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-msg">{message}</p>
      {detail && <p className="hint">{detail}</p>}
    </Modal>
  );
}
