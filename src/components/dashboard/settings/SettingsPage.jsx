import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Modal from "../../common/Modal";
import { takenHandles } from "../../../data/mockData";
import { CURRENCIES, currencySymbol, deviceTimezone, offsetLabel, timezoneList } from "../../../lib/locale";
import {
  HANDLE_MAX,
  NAME_MAX,
  PAGE_DOMAIN,
  currencyLabel,
  normaliseHandle,
  pageAddressOf,
  settingsChanges,
  settingsConsequences,
  settingsOf,
  settingsProblems,
  timezoneLabel,
} from "../../../lib/settings";

// Zones grouped by region ("Europe", "America"…), so the list reads like an atlas
// rather than 400 names in a row.
function groupedZones() {
  const groups = new Map();
  for (const tz of timezoneList()) {
    const region = tz.includes("/") ? tz.split("/")[0] : "Other";
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(tz);
  }
  return [...groups.entries()];
}

// The studio's name, page address, currency and time zone. Edits are a draft
// until saved; saving anything that breaks links or relabels prices says so first.
export default function SettingsPage() {
  usePageHeader("Settings", "Your studio's name, page address, currency and time zone.");
  const { studio, updateSettings } = useAppData();
  const [draft, setDraft] = useState(() => settingsOf(studio));
  const [confirming, setConfirming] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const zones = useMemo(groupedZones, []);
  const device = deviceTimezone();
  const problems = settingsProblems(draft, { current: studio.handle, taken: takenHandles });
  const changes = settingsChanges(studio, draft);
  const consequences = settingsConsequences(studio, draft);
  const dirty = changes.length > 0;
  const canSave = dirty && Object.keys(problems).length === 0;
  const handle = normaliseHandle(draft.handle);

  const save = () => (consequences.length ? setConfirming(true) : updateSettings(draft));

  return (
    <section className="panel settings">
      <div className="cardbox set-card">
        <div className="set-row">
          <div className="set-l">
            <label className="lbl" htmlFor="set-name">
              Studio name
            </label>
            <p className="hint">Shown at the top of your page, in emails and in the sidebar.</p>
          </div>
          <div className="set-r">
            <input
              id="set-name"
              className="field"
              value={draft.name}
              maxLength={NAME_MAX + 20}
              onChange={(e) => set({ name: e.target.value })}
            />
            {problems.name && <p className="set-err">{problems.name}</p>}
          </div>
        </div>

        <div className="set-row">
          <div className="set-l">
            <label className="lbl" htmlFor="set-handle">
              Page address
            </label>
            <p className="hint">Where people find your page. Members&apos; class links use it too.</p>
          </div>
          <div className="set-r">
            <div className="handle">
              <span className="pre">{PAGE_DOMAIN}/</span>
              <input
                id="set-handle"
                value={draft.handle}
                maxLength={HANDLE_MAX + 10}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => set({ handle: e.target.value })}
              />
            </div>
            {problems.handle ? (
              <p className="set-err">{problems.handle}</p>
            ) : changes.includes("handle") ? (
              <p className="set-ok">{pageAddressOf(handle)} is available</p>
            ) : (
              <p className="hint">Your page is at {pageAddressOf(studio.handle)}</p>
            )}
            {changes.includes("handle") && !problems.handle && (
              <p className="set-warn">
                Links you&apos;ve already shared to {pageAddressOf(studio.handle)} will stop working.
              </p>
            )}
          </div>
        </div>

        <div className="set-row">
          <div className="set-l">
            <label className="lbl" htmlFor="set-currency">
              Currency
            </label>
            <p className="hint">Every price on your page and in the dashboard is shown in this.</p>
          </div>
          <div className="set-r">
            <select
              id="set-currency"
              className="field"
              value={draft.currency}
              onChange={(e) => set({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyLabel(c.code)}
                </option>
              ))}
            </select>
            {changes.includes("currency") ? (
              <p className="set-warn">Nothing is converted — a price of 40 stays 40. Check your prices after.</p>
            ) : (
              <p className="hint">Prices look like {currencySymbol(draft.currency)}40.</p>
            )}
          </div>
        </div>

        <div className="set-row">
          <div className="set-l">
            <label className="lbl" htmlFor="set-tz">
              Time zone
            </label>
            <p className="hint">
              Class times, &ldquo;today&rdquo;, the schedule, this month&apos;s earnings and payout day all use it —
              wherever you&apos;re looking from.
            </p>
          </div>
          <div className="set-r">
            <select
              id="set-tz"
              className="field"
              value={draft.timezone}
              onChange={(e) => set({ timezone: e.target.value })}
            >
              {zones.map(([region, list]) => (
                <optgroup key={region} label={region}>
                  {list.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")} ({offsetLabel(tz)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="hint">{timezoneLabel(draft.timezone)} there now</p>
            {device !== draft.timezone && (
              <button
                type="button"
                className="btn btn-ghost btn-sm set-device"
                onClick={() => set({ timezone: device })}
                data-tip={`Use ${device.replace(/_/g, " ")}, the zone this device is set to`}
              >
                Use this device&apos;s time zone
              </button>
            )}
          </div>
        </div>

        <div className="set-foot">
          <span className="mut">
            {dirty ? `${changes.length} unsaved change${changes.length === 1 ? "" : "s"}` : "Everything is saved"}
          </span>
          <span className="tip-wrap" data-tip={dirty ? "Put back what's saved" : "Nothing to undo"}>
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setDraft(settingsOf(studio))}>
              Discard
            </button>
          </span>
          <span
            className="tip-wrap"
            data-tip={
              !dirty
                ? "Nothing has changed yet"
                : canSave
                  ? consequences.length
                    ? "Save — you'll see what changes first"
                    : "Save your changes"
                  : "Fix the highlighted fields first"
            }
          >
            <button type="button" className="btn btn-coral" disabled={!canSave} onClick={save}>
              Save changes
            </button>
          </span>
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Save these settings?"
        maxWidth={480}
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setConfirming(false)}
              data-tip="Keep editing — nothing is saved"
            >
              Cancel
            </button>
            <button
              className="btn btn-coral"
              onClick={() => {
                setConfirming(false);
                updateSettings(draft);
              }}
              data-tip="Save — these take effect straight away"
            >
              Save changes
            </button>
          </>
        }
      >
        <ul className="set-conseq">
          {consequences.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
