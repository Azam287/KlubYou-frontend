import { money } from "../../../lib/stats";

// Renders the last-6-months earnings line. The series carries real amounts and
// this component projects them into the viewBox — previously the data itself
// stored SVG pixel coordinates, which meant the chart had no actual
// relationship to the earnings figure shown beside it.
const LEFT = 20;
const RIGHT = 580;
const TOP = 26;
const BASE = 180;

export default function EarningsChart({ series }) {
  if (!series?.length) return null;

  const max = Math.max(...series.map((p) => p.amount), 1);
  const step = series.length > 1 ? (RIGHT - LEFT) / (series.length - 1) : 0;
  const xOf = (i) => LEFT + i * step;
  const yOf = (amount) => BASE - (amount / max) * (BASE - TOP);

  const points = series.map((p, i) => ({ ...p, cx: xOf(i), cy: yOf(p.amount) }));
  const line = points.map((p) => `${p.cx} ${p.cy}`).join(" L ");
  const linePath = `M${line}`;
  const areaPath = `M${points[0].cx} ${points[0].cy} L ${line} L ${points[points.length - 1].cx} ${BASE} L ${points[0].cx} ${BASE} Z`;
  const last = points[points.length - 1];

  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Earnings</h3>
        <span className="mut">
          {money(series.reduce((t, p) => t + p.amount, 0))} over the last {series.length} months
        </span>
      </div>
      <svg
        viewBox="0 0 600 200"
        width="100%"
        style={{ height: "auto" }}
        fill="none"
        role="img"
        aria-label={`Earnings by month: ${series.map((p) => `${p.month} ${money(p.amount)}`).join(", ")}`}
      >
        <defs>
          <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F15B41" stopOpacity=".28" />
            <stop offset="1" stopColor="#F15B41" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={LEFT} y1={BASE} x2="595" y2={BASE} stroke="#E5E1EC" />
        <line x1={LEFT} y1="120" x2="595" y2="120" stroke="#ECE9F1" />
        <line x1={LEFT} y1="60" x2="595" y2="60" stroke="#ECE9F1" />
        <path d={areaPath} fill="url(#earningsFill)" />
        <path d={linePath} stroke="#F15B41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#F15B41">
          {points.map((p, i) => (
            <circle
              key={p.key}
              cx={p.cx}
              cy={p.cy}
              r={i === points.length - 1 ? 4.5 : 3.5}
              stroke={i === points.length - 1 ? "#fff" : undefined}
              strokeWidth={i === points.length - 1 ? 2 : undefined}
            >
              {/* Hover a point for its month and amount. */}
              <title>{`${p.key}: ${money(p.amount)}`}</title>
            </circle>
          ))}
        </g>
        <text
          x={last.cx}
          y={Math.max(last.cy - 12, 14)}
          textAnchor="end"
          fill="#221A38"
          fontSize="13"
          fontFamily="Bricolage Grotesque"
          fontWeight="700"
        >
          {money(last.amount)}
        </text>
        <g fill="#5B5470" fontSize="12" fontFamily="Hanken Grotesk" textAnchor="middle">
          {points.map((p) => (
            <text key={p.key} x={p.cx} y="196">
              {p.month}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
