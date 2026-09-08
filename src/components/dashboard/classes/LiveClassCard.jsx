import Icon from "../../common/Icon";

const MODE = {
  live: { pill: "live", label: "Live now", icon: "video" },
  scheduled: { pill: "sched", label: "Scheduled", icon: "classes" },
  draft: { pill: "lapsed", label: "Draft", icon: "classes" },
};

export default function LiveClassCard({ item, onEdit, onAddLink }) {
  const cfg = MODE[item.mode];

  return (
    <div className="class-card">
      <div className="class-top">
        <span className="ci">
          <Icon name={cfg.icon} size={22} strokeWidth={1.8} />
        </span>
        <div>
          <h4>{item.title}</h4>
          <div className="cm">{item.meta}</div>
        </div>
        <div className="act-btns">
          <span className={`pill ${cfg.pill}`}>
            <i /> {cfg.label}
          </span>
          {item.mode === "live" && (
            <button className="btn btn-ghost" style={{ padding: ".5rem .9rem" }}>
              Open link
            </button>
          )}
          {item.mode === "scheduled" && (
            <button className="btn btn-ghost" style={{ padding: ".5rem .9rem" }} onClick={() => onEdit(item)}>
              Edit
            </button>
          )}
          {item.mode === "draft" && (
            <button className="btn btn-coral" style={{ padding: ".5rem .9rem" }} onClick={() => onAddLink(item)}>
              Add link
            </button>
          )}
        </div>
      </div>
      {item.flow && (
        <div className="flow">
          {item.flow.map((step) => (
            <div className={`fstep${step.done ? " donef" : ""}`} key={step.label}>
              <b>{step.label}</b>
              {step.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
