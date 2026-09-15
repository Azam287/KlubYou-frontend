const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Who's here, by what they're on: each membership plan by name, programme
// buyers, and leads (lib/overview.js → membersByPlan).
export default function PlanMixChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;
  // With nobody yet there's nothing to divide, so no arcs — just the ring.
  const arcs = total
    ? segments.map((s) => {
        const dash = (s.value / total) * CIRCUMFERENCE;
        const arc = { ...s, dash, offset: -offset };
        offset += dash;
        return arc;
      })
    : [];

  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Who&apos;s here</h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${total} people`}>
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#ECE9F1" strokeWidth="18" />
          <g transform="rotate(-90 64 64)" fill="none" strokeWidth="18">
            {arcs.map((s) => (
              <circle
                key={s.key}
                cx="64"
                cy="64"
                r={RADIUS}
                stroke={s.color}
                strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
                strokeDashoffset={s.offset}
              >
                <title>{`${s.label}: ${s.value}`}</title>
              </circle>
            ))}
          </g>
          <text x="64" y="60" textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="700" fontSize="22" fill="#221A38">
            {total}
          </text>
          <text x="64" y="76" textAnchor="middle" fontFamily="Hanken Grotesk" fontSize="10" fill="#5B5470">
            {total === 1 ? "person" : "people"}
          </text>
        </svg>
        <div className="legend" style={{ flex: 1 }}>
          {segments.length ? (
            segments.map((s) => (
              <div className="row" key={s.key}>
                <span className="dot" style={{ background: s.color }} /> {s.label} <b>{s.value}</b>
              </div>
            ))
          ) : (
            <p className="hint">No one yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
