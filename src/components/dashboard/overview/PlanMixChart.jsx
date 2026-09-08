const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PlanMixChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = (s.value / total) * CIRCUMFERENCE;
    const arc = { ...s, dash, offset: -offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Plan mix</h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
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
              />
            ))}
          </g>
          <text x="64" y="60" textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="700" fontSize="22" fill="#221A38">
            {total}
          </text>
          <text x="64" y="76" textAnchor="middle" fontFamily="Hanken Grotesk" fontSize="10" fill="#5B5470">
            members
          </text>
        </svg>
        <div className="legend" style={{ flex: 1 }}>
          {segments.map((s) => (
            <div className="row" key={s.key}>
              <span className="dot" style={{ background: s.color }} /> {s.label} <b>{s.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
