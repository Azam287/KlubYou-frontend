import { useState } from "react";
import Modal from "../../../common/Modal";
import Icon from "../../../common/Icon";
import { PROGRAMME_TYPES, scheduleWindow } from "../../../../lib/programme";
import RunWindowFields from "../RunWindowFields";

const emptyForm = { name: "", description: "", introVideo: "", type: "live", startsOn: "", weeks: 8 };

// Type first. It decides the whole shape of the programme and can't be changed
// afterwards, so it's asked before anything else rather than buried under the
// name and description.
export default function NewProgrammeModal({ open, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const reset = () => {
    setForm(emptyForm);
    setStep(1);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New programme"
      maxWidth={560}
      footer={
        step === 1 ? (
          <>
            <button
              className="btn btn-ghost"
              onClick={handleClose}
              data-tip="Close without creating anything"
            >
              Cancel
            </button>
            <button
              className="btn btn-coral"
              onClick={() => setStep(2)}
              data-tip="Next: its name, description and dates"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(1)}
              data-tip="Back to choosing live or recorded"
            >
              Back
            </button>
            <span
              className="tip-wrap"
              data-tip={
                !form.name.trim()
                  ? "Give it a name first"
                  : !form.description.trim()
                    ? "Add a description first — it's what buyers read"
                    : form.type === "live" && !scheduleWindow(form)
                      ? "Set when it runs first"
                      : "Create it as a draft — nothing is on sale until you publish"
              }
            >
              <button
                className="btn btn-coral"
                // Name and description are what a buyer reads, so a programme
                // can't start without them. The intro video can follow — you may
                // not have filmed it yet, and publishing asks for it anyway.
                disabled={
                  !form.name.trim() ||
                  !form.description.trim() ||
                  (form.type === "live" && !scheduleWindow(form))
                }
                onClick={() => {
                  onCreate(form);
                  reset();
                }}
              >
                Create programme
              </button>
            </span>
          </>
        )
      }
    >
      <div className="steps">
        <span className={`step${step === 1 ? " on" : " done"}`}>
          <i>{step > 1 ? <Icon name="check" size={12} strokeWidth={3.2} /> : 1}</i> Type
        </span>
        <span className="step-line" />
        <span className={`step${step === 2 ? " on" : ""}`}>
          <i>2</i> Details
        </span>
      </div>

      {step === 1 ? (
        <>
          <h2 className="modal-q">What are you making?</h2>
          <p className="modal-qs">
            This shapes the whole programme, so it's the first thing we ask. You can't change it
            later.
          </p>
          <div className="picks">
            {Object.values(PROGRAMME_TYPES).map((t) => (
              <div
                key={t.key}
                className={`pick tall${form.type === t.key ? " sel" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                onKeyDown={(e) => e.key === "Enter" && setForm((f) => ({ ...f, type: t.key }))}
              >
                <span className="pico">
                  <Icon name={t.icon} size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <b>{t.label}</b>
                  <span>{t.blurb}</span>
                  <span className="pick-more">{t.detail}</span>
                </div>
                {form.type === t.key && (
                  <span className="pick-tick">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="modal-q">Name your {PROGRAMME_TYPES[form.type].label.toLowerCase()} programme</h2>
          <p className="modal-qs">{PROGRAMME_TYPES[form.type].detail}</p>
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
            <label className="lbl">Intro video</label>
            <input
              className="field"
              placeholder="Link to a short trailer — YouTube, Vimeo, anywhere"
              value={form.introVideo}
              onChange={(e) => setForm((f) => ({ ...f, introVideo: e.target.value }))}
            />
            <p className="hint">
              The only part of this programme anyone can watch without buying it. You can add it
              later, but you'll need it before you publish.
            </p>
          </div>
          {form.type === "live" && (
            <RunWindowFields
              startsOn={form.startsOn}
              weeks={form.weeks}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          )}

          <p className="hint">
            It starts as a draft — nothing is visible to members until you publish it.
          </p>
        </>
      )}
    </Modal>
  );
}
