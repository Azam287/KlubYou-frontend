import Icon from "../../common/Icon";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  DEFAULT_THEME,
  TEXT_PRESETS,
  accentVisible,
  bestTextOn,
  isReadable,
} from "../../../lib/page";

// Three colours and nothing else: the page, its words, and one accent for
// everything that should stand out. Borders, softer text and button labels are
// all worked out from these, so any three you pick still look like one design.
function ColourRow({ label, hint, presets, value, onPick }) {
  const custom = !presets.some((p) => p.value.toLowerCase() === value.toLowerCase());
  return (
    <div className="cl-row">
      <span className="cl-lbl">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <div className="swatches">
        {presets.map((p) => {
          const on = p.value.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={p.value}
              className={`sw${on ? " on" : ""}`}
              style={{ background: p.value }}
              aria-label={`${label}: ${p.name}`}
              aria-pressed={on}
              data-tip={p.name}
              onClick={() => onPick(p.value)}
            />
          );
        })}
        {/* Any colour at all, for when none of the presets is yours. */}
        <label
          className={`sw sw-custom${custom ? " on" : ""}`}
          style={custom ? { background: value } : undefined}
          data-tip={custom ? `Your colour (${value})` : "Pick any colour"}
        >
          <input
            type="color"
            aria-label={`${label}: pick any colour`}
            value={value}
            onChange={(e) => onPick(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default function ColourEditor({ theme: saved, onChange }) {
  // A theme saved before a colour existed (the accent came later) still edits.
  const theme = { ...DEFAULT_THEME, ...saved };
  const readable = isReadable(theme);
  const fix = bestTextOn(theme.background);
  const visible = accentVisible(theme);

  return (
    <>
      <ColourRow
        label="Background"
        presets={BACKGROUND_PRESETS}
        value={theme.background}
        onPick={(background) => onChange({ background })}
      />
      <ColourRow
        label="Text"
        presets={TEXT_PRESETS}
        value={theme.text}
        onPick={(text) => onChange({ text })}
      />
      <ColourRow
        label="Accent"
        hint="Logo, intro video, buttons and highlights"
        presets={ACCENT_PRESETS}
        value={theme.accent}
        onPick={(accent) => onChange({ accent })}
      />

      {readable ? (
        <p className="cl-ok">
          <Icon name="check" size={14} strokeWidth={3} /> Easy to read
        </p>
      ) : (
        // Changing one colour and forgetting the other is the easy way to an
        // unreadable page — so it's said, with the fix one click away.
        <div className="cl-warn">
          <span>Hard to read — the text and background are too similar.</span>
          <button
            className="btn btn-ghost btn-sm"
            data-tip="Switch the text to whichever of dark or white reads best"
            onClick={() => onChange({ text: fix })}
          >
            Use {fix === "#ffffff" ? "white" : "dark"} text
          </button>
        </div>
      )}

      {/* Button labels sort themselves out; the accent against the page is
          the one thing that can still disappear. */}
      {!visible && (
        <p className="cl-note">
          The accent is hard to see on this background — buttons and the video will blend in.
          Try a darker or brighter accent.
        </p>
      )}
    </>
  );
}
