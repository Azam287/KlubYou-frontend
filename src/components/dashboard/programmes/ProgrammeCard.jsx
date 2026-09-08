import { useNavigate } from "react-router-dom";
import Icon from "../../common/Icon";

const TYPE_LABEL = { course: "Course", membership: "Membership" };

export default function ProgrammeCard({ programme }) {
  const navigate = useNavigate();

  return (
    <button className="prog-card" onClick={() => navigate(`/dashboard/programmes/${programme.id}`)}>
      <div className="prog-thumb" style={{ background: programme.thumbGradient }}>
        <Icon name={programme.icon === "leaf" ? "heart" : "personKey"} size={34} strokeWidth={1.6} color="#fff" style={{ opacity: 0.8 }} />
      </div>
      <div className="prog-b">
        <div className="prog-badges">
          {programme.types.map((t) => (
            <span className={`badge ${t}`} key={t}>
              {TYPE_LABEL[t]}
            </span>
          ))}
        </div>
        <h4>{programme.name}</h4>
        <p>{programme.description}</p>
        <div className="prog-stat">
          {programme.membersCount} members
          {programme.course ? ` · ${programme.enrolledCount} enrolled` : ""}
        </div>
      </div>
    </button>
  );
}
