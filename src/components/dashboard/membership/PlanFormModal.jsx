import { useState } from "react";
import Modal from "../../common/Modal";
import Icon from "../../common/Icon";
import { money } from "../../../lib/stats";
import {
  bundleSummary,
  planIsEverything,
  publishedOnly,
  contentSummaryOf,
  discountPercent,
  perMonthLabel,
  planIsHollow,
  planSaving,
  planValue,
  toggleInList,
} from "../../../lib/membership";

const blank = {
  name: "",
  description: "",
  months: 3,
  amount: "",
  listPrice: "",
  scope: "picked",
  bundles: [],
  extras: [],
};

// Building a plan is two questions, asked separately: what it is and what's in
// it. Both used to be one long form, and the content — the part that decides
// whether the price is fair — was the bit buried at the bottom.
export default function PlanFormModal({
  open,
  editing,
  initialStep = 1,
  bundles = [],
  features = [],
  programmes = [],
  lessons = [],
  onClose,
  onSave,
}) {
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState(() => (editing ? { ...blank, ...editing } : blank));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const months = Number(form.months) || 0;
  const amount = Number(form.amount) || 0;
  const list = Number(form.listPrice) || 0;
  const preview = { ...form, months, amount, listPrice: list };
  const off = discountPercent(preview);
  const listTooLow = list > 0 && list < amount;
  const detailsDone = !!form.name.trim() && months >= 1 && amount > 0 && !listTooLow;

  const everything = planIsEverything(form);
  // Only published things can be put in a plan.
  const liveBundles = publishedOnly(bundles);
  const liveExtras = publishedOnly(features);
  const noBundles = !everything && planIsHollow(preview, bundles, programmes, lessons);
  const chosenExtras = (form.extras || []).length;
  // Nothing at all — not merely "no content". Extras alone are a plan too.
  const hollow = noBundles && chosenExtras === 0;
  const saving = planSaving(preview, bundles, programmes, lessons);

  const save = () => {
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      months,
      amount,
      listPrice: list || amount,
      scope: everything ? "all" : "picked",
      bundles: form.bundles || [],
      extras: form.extras || [],
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit plan" : "New plan"}
      maxWidth={540}
      footer={
        step === 1 ? (
          <>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-coral" disabled={!detailsDone} onClick={() => setStep(2)}>
              Choose what's in it
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn-coral" disabled={hollow} onClick={save}>
              {editing ? "Save plan" : "Add plan"}
            </button>
          </>
        )
      }
    >
      <div className="steps">
        <span className={`step${step === 1 ? " on" : " done"}`}>
          <i>{step > 1 ? <Icon name="check" size={12} strokeWidth={3.2} /> : 1}</i> The plan
        </span>
        <span className="step-line" />
        <span className={`step${step === 2 ? " on" : ""}`}>
          <i>2</i> What's in it
        </span>
      </div>

      {step === 1 ? (
        <>
          <div className="ctrl">
            <label className="lbl">Plan name</label>
            <input
              className="field"
              placeholder="e.g. Starter, Full studio year"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          <div className="ctrl">
            <label className="lbl">Description</label>
            <textarea
              className="field"
              placeholder="What this plan is for, in a line"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          <div className="two-col">
            <div className="ctrl">
              <label className="lbl">Length (months)</label>
              <input
                className="field"
                type="number"
                min="1"
                max="36"
                value={form.months}
                onChange={(e) => set({ months: e.target.value })}
              />
            </div>
            <div className="ctrl">
              <label className="lbl">Price (£)</label>
              <input
                className="field"
                type="number"
                min="1"
                placeholder="92"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
              />
            </div>
          </div>

          <div className="ctrl">
            <label className="lbl">Full price (£, optional)</label>
            <input
              className="field"
              type="number"
              min="0"
              placeholder="What it would cost without the offer"
              value={form.listPrice}
              onChange={(e) => set({ listPrice: e.target.value })}
            />
            <p className={`hint${listTooLow ? " warn" : ""}`}>
              {listTooLow
                ? "The full price can't be lower than what you're charging."
                : off > 0
                  ? `Shown as ${money(list)} crossed out, ${off}% off.`
                  : "Leave it empty if this isn't discounted."}
            </p>
          </div>

          {months > 0 && amount > 0 && (
            <p className="hint">
              Works out at <b>{perMonthLabel(preview)}</b>.
            </p>
          )}
        </>
      ) : (
        <>
          <h2 className="modal-q">What does {form.name.trim() || "this plan"} open up?</h2>
          <p className="modal-qs">
            Everything you have, or a chosen set of bundles. A bundle is a named set of content you
            manage on its own tab, so the same set can back more than one plan.
          </p>

          <div className="ctrl">
            <div className="segbtns">
              <button
                className={`seg${everything ? " on" : ""}`}
                onClick={() => set({ scope: "all" })}
              >
                Everything
              </button>
              <button
                className={`seg${everything ? "" : " on"}`}
                onClick={() => set({ scope: "picked" })}
              >
                Choose bundles
              </button>
            </div>
          </div>

          {everything ? (
            /* Everything means everything, now and later — including bundles and
               extras made after this plan. Letting exceptions be picked out of it
               would make it a chosen set, which is the other option. */
            <div className="plan-sum">
              <b>Everything you offer</b>
              <span>
                All {liveBundles.length} bundle{liveBundles.length === 1 ? "" : "s"} and every extra, plus
                anything you add later. Nothing can be left out of this plan — for that, choose
                bundles instead.
              </span>
            </div>
          ) : (
            <>
              <div className="ctrl">
                <label className="lbl">Bundles</label>
                {liveBundles.length ? (
                  <div className="bundle-pick">
                    {liveBundles.map((b) => {
                      const on = (form.bundles || []).includes(b.id);
                      return (
                        <label className={`bundle-row${on ? " on" : ""}`} key={b.id}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => set({ bundles: toggleInList(form.bundles, b.id) })}
                          />
                          <div>
                            <b>{b.name}</b>
                            <small>{bundleSummary(b, programmes, lessons)}</small>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="hint warn">
                    No published bundles yet. Make one on the Bundles tab and publish it.
                  </p>
                )}
              </div>

              {/* Extras are chosen here too, so one form decides everything the
                  plan opens rather than half of it living on each extra. The
                  section is always rendered — when it was conditional it went
                  missing silently the moment its data didn't arrive. */}
              <div className="ctrl">
                <label className="lbl">Extra benefits</label>
                {liveExtras.length ? (
                  <div className="bundle-pick">
                    {liveExtras.map((f) => {
                      const on = (form.extras || []).includes(f.id);
                      return (
                        <label className={`bundle-row${on ? " on" : ""}`} key={f.id}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => set({ extras: toggleInList(form.extras, f.id) })}
                          />
                          <div>
                            <b>{f.title}</b>
                            <small>{f.detail || "Included"}</small>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="hint">
                    No published extras yet. Add one on the Extras tab — a perk with no content
                    behind it, like a monthly check-in.
                  </p>
                )}
              </div>
            </>
          )}

          <div className={`plan-sum${hollow ? " warn" : ""}`}>
            <b>
              {hollow
                ? "This plan opens nothing"
                : noBundles
                  ? `${chosenExtras} extra${chosenExtras === 1 ? "" : "s"}, no content`
                  : contentSummaryOf(preview, bundles, programmes, lessons)}
            </b>
            <span>
              {hollow
                ? "Pick a bundle or an extra — nobody should be sold an empty plan."
                : noBundles
                  ? "Benefits only — no programmes or lessons come with this plan."
                  : saving > 0
                    ? `Worth ${money(planValue(preview, bundles, programmes, lessons))} bought separately — this plan saves ${money(saving)}.`
                    : `Everything in ${(form.bundles || []).length} bundle${
                        (form.bundles || []).length === 1 ? "" : "s"
                      }${chosenExtras ? ` and ${chosenExtras} extra${chosenExtras === 1 ? "" : "s"}` : ""}, for ${money(amount)}.`}
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}
