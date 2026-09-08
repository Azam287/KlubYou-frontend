// Renders the last-6-months earnings sparkline. Points come from
// mockData.earningsSeries so the shape is easy to swap for real data later.
export default function EarningsChart({ series }) {
  const line = series.map((p) => `${p.x} ${p.y}`).join(" L ");
  const areaPath = `M${series[0].x} ${series[0].y} L ${line} L ${series[series.length - 1].x} 180 L ${series[0].x} 180 Z`;
  const linePath = `M${series[0].x} ${series[0].y} L ${line}`;

  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Earnings</h3>
        <span className="mut">Last 6 months</span>
      </div>
      <svg viewBox="0 0 600 200" width="100%" style={{ height: "auto" }} fill="none">
        <defs>
          <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F15B41" stopOpacity=".28" />
            <stop offset="1" stopColor="#F15B41" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="20" y1="180" x2="595" y2="180" stroke="#E5E1EC" />
        <line x1="20" y1="120" x2="595" y2="120" stroke="#ECE9F1" />
        <line x1="20" y1="60" x2="595" y2="60" stroke="#ECE9F1" />
        <path d={areaPath} fill="url(#earningsFill)" />
        <path d={linePath} stroke="#F15B41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#F15B41">
          {series.map((p, i) => (
            <circle
              key={p.month}
              cx={p.x}
              cy={p.y}
              r={i === series.length - 1 ? 4.5 : 3.5}
              stroke={i === series.length - 1 ? "#fff" : undefined}
              strokeWidth={i === series.length - 1 ? 2 : undefined}
            />
          ))}
        </g>
        <g fill="#5B5470" fontSize="12" fontFamily="Hanken Grotesk" textAnchor="middle">
          {series.map((p) => (
            <text key={p.month} x={p.x} y="196">
              {p.month}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
