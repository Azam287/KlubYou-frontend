export default function CoverColorPicker({ swatches, active, onPick }) {
  return (
    <div className="eg">
      <h4>Cover colour</h4>
      <div className="swatches">
        {swatches.map((s) => (
          <span
            key={s.id}
            className={`sw${active === s.gradient ? " on" : ""}`}
            style={{ background: s.color }}
            onClick={() => onPick(s.gradient)}
            role="button"
            tabIndex={0}
            aria-label={`Use ${s.id} cover colour`}
            onKeyDown={(e) => e.key === "Enter" && onPick(s.gradient)}
          />
        ))}
      </div>
    </div>
  );
}
