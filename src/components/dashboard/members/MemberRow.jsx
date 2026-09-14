import KebabMenu from "../../common/KebabMenu";
import { useAppData } from "../../../context/AppDataContext";
import { formatMonthYear, formatRenewal } from "../../../lib/datetime";
import { isExpiring } from "../../../lib/stats";

const STATUS_PILL = {
  active: { cls: "active", label: "Active" },
  inactive: { cls: "lapsed", label: "Inactive" },
  lead: { cls: "lead", label: "Lead" },
};

// What a member has access to, worked out from their plan rather than stored as
// a second string that can fall out of step with it.
function accessLabel(member, programmes) {
  if (member.plan === "studio") {
    return member.planLength ? `Studio · ${member.planLength}` : "Studio subscription";
  }
  if (member.plan === "programme") {
    const programme = programmes.find((p) => p.id === member.programmeId);
    return programme ? `Programme · ${programme.name}` : "Programme";
  }
  return "— visited page";
}

export default function MemberRow({ member }) {
  const { memberAction, programmes } = useAppData();
  const pill = isExpiring(member)
    ? { cls: "expiring", label: "Expiring" }
    : STATUS_PILL[member.status];

  const items = [];
  if (member.status !== "lead") {
    items.push({ label: "Gift extra days", icon: "gift", onClick: () => memberAction("gift", member.id) });
  }
  items.push({ label: "Send email", icon: "mail", onClick: () => memberAction("email", member.id) });
  items.push({ label: "Send voucher", icon: "voucher", onClick: () => memberAction("voucher", member.id) });
  if (member.plan === "studio" && member.status === "active") {
    items.push(null);
    items.push({
      label: "Stop subscription",
      icon: "stop",
      danger: true,
      onClick: () => memberAction("stop", member.id),
    });
  }

  return (
    <tr>
      <td>
        <div className="who">
          <span className="av">{member.initials}</span>
          <div>
            {member.name}
            <small>{member.email}</small>
          </div>
        </div>
      </td>
      <td>{accessLabel(member, programmes)}</td>
      <td>
        <span className={`pill ${pill.cls}`}>
          <i /> {pill.label}
        </span>
      </td>
      <td>{formatMonthYear(member.joinedAt)}</td>
      <td>{member.plan === "none" ? "—" : formatRenewal(member.renewsAt)}</td>
      <td>{member.attendedOf ? `${member.attended} / ${member.attendedOf}` : "—"}</td>
      <td className="tar">
        <KebabMenu items={items} />
      </td>
    </tr>
  );
}
