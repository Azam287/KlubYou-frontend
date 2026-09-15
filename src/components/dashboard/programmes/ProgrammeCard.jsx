import { useNavigate } from "react-router-dom";
import Icon from "../../common/Icon";
import { contentSummary, isPublished, leadOffer, offerPrice, PROGRAMME_TYPES } from "../../../lib/programme";

export default function ProgrammeCard({ programme }) {
  const navigate = useNavigate();
  const meta = PROGRAMME_TYPES[programme.type] || PROGRAMME_TYPES.live;
  const lead = leadOffer(programme);
  const draft = !isPublished(programme);

  return (
    <button
      className="prog-card"
      onClick={() => navigate(`/dashboard/programmes/${programme.id}`)}
      data-tip={`Open ${programme.name}`}
    >
      <div className="prog-thumb" style={{ background: programme.thumbGradient }}>
        <Icon
          name={programme.icon === "leaf" ? "heart" : "personKey"}
          size={34}
          strokeWidth={1.6}
          color="#fff"
          style={{ opacity: 0.8 }}
        />
        {draft && <span className="prog-draft">Draft</span>}
      </div>
      <div className="prog-b">
        <div className="prog-badges">
          <span className={`badge ${programme.type}`}>
            <Icon name={meta.icon} size={13} strokeWidth={2} />
            {meta.label}
          </span>
        </div>
        <h4>{programme.name}</h4>
        <p>{programme.description}</p>
        <div className="prog-stat">
          {contentSummary(programme)}
          {/* Spell out the alternative: "studio only" read like a restriction
              rather than the pricing choice it is. */}
          {lead ? ` · from ${offerPrice(lead)}` : " · subscribers only, no separate price"}
        </div>
      </div>
    </button>
  );
}
