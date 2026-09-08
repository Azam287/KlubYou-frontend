import Icon from "../../common/Icon";

export default function StatCard({ label, icon, value, delta, flat }) {
  return (
    <div className="cardbox stat">
      <div className="top">
        {label}
        <span className="sico">
          <Icon name={icon} size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="val num">{value}</div>
      <div className={`delta${flat ? " flat" : ""}`}>{delta}</div>
    </div>
  );
}
