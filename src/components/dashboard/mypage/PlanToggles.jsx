export default function PlanToggles({ plans, onToggle }) {
  return (
    <div className="eg">
      <h4>Plans on your page</h4>
      <div className="toggle-row">
        {plans.map((p) => (
          <button
            key={p.key}
            className={`tg${p.on ? " on" : ""}`}
            onClick={() => onToggle(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
