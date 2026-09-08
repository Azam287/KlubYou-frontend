import { useState } from "react";
import Modal from "../../../common/Modal";
import Icon from "../../../common/Icon";

const emptyForm = { name: "", description: "", sellAsCourse: true, sellAsMembership: true };

export default function NewProgrammeModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyForm);

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New programme"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-coral"
            onClick={() => {
              onCreate(form);
              setForm(emptyForm);
            }}
          >
            Create programme
          </button>
        </>
      }
    >
      <div className="ctrl">
        <label className="lbl">Programme name</label>
        <input
          className="field"
          placeholder="e.g. Morning Vinyasa"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="ctrl">
        <label className="lbl">Description</label>
        <textarea
          className="field"
          placeholder="What is this programme about?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="ctrl">
        <label className="lbl">Photos</label>
        <div className="uploader">
          <Icon name="upload" size={22} strokeWidth={1.7} />
          <span>
            Drag photos here or <b>browse</b>
          </span>
        </div>
      </div>
      <div className="ctrl">
        <label className="lbl">How do you want to sell it?</label>
        <div className="picks two">
          <div
            className={`pick${form.sellAsCourse ? " sel" : ""}`}
            onClick={() => setForm((f) => ({ ...f, sellAsCourse: !f.sellAsCourse }))}
          >
            <span className="pico">
              <Icon name="course" size={18} strokeWidth={1.8} />
            </span>
            <div>
              <b>Course</b>
              <span>Fixed run with dates &amp; classes</span>
            </div>
          </div>
          <div
            className={`pick${form.sellAsMembership ? " sel" : ""}`}
            onClick={() => setForm((f) => ({ ...f, sellAsMembership: !f.sellAsMembership }))}
          >
            <span className="pico">
              <Icon name="payments" size={18} strokeWidth={1.8} />
            </span>
            <div>
              <b>Membership</b>
              <span>Recurring monthly plans</span>
            </div>
          </div>
        </div>
        <p className="hint">Pick either or both — you can change this later.</p>
      </div>
    </Modal>
  );
}
