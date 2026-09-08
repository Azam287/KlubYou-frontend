import KebabMenu from "../../common/KebabMenu";
import { useAppData } from "../../../context/AppDataContext";

const STATUS_PILL = {
  active: { cls: "active", label: "Active" },
  inactive: { cls: "lapsed", label: "Inactive" },
  lead: { cls: "lead", label: "Lead" },
};

export default function MemberRow({ member }) {
  const { memberAction } = useAppData();
  const pill = member.expiring ? { cls: "expiring", label: "Expiring" } : STATUS_PILL[member.status];

  const items = [];
  if (member.status !== "lead") {
    items.push({ label: "Gift extra days", icon: "gift", onClick: () => memberAction("gift", member.id) });
  }
  items.push({ label: "Send email", icon: "mail", onClick: () => memberAction("email", member.id) });
  items.push({ label: "Send voucher", icon: "voucher", onClick: () => memberAction("voucher", member.id) });
  if (member.plan === "membership" && member.status === "active") {
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
      <td>{member.planLabel}</td>
      <td>
        <span className={`pill ${pill.cls}`}>
          <i /> {pill.label}
        </span>
      </td>
      <td>{member.joined}</td>
      <td>{member.renews}</td>
      <td>{member.attendance}</td>
      <td className="tar">
        <KebabMenu items={items} />
      </td>
    </tr>
  );
}
