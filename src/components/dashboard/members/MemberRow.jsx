import KebabMenu from "../../common/KebabMenu";
import {
  accessOf,
  canGift,
  canResume,
  canStop,
  initialsOf,
  joinedLabel,
  progressOf,
  renewalOf,
  stateOf,
} from "../../../lib/members";

// One member. Everything in the row is worked out from what they bought and
// where they stand (lib/members.js); the name opens their details.
export default function MemberRow({ member, ctx, onOpen, onEmail, onGift, onVoucher, onStop, onResume }) {
  const access = accessOf(member, ctx);
  const state = stateOf(member, ctx);
  const renewal = renewalOf(member, ctx);
  const progress = progressOf(member, ctx);
  const first = member.name.split(" ")[0];

  const items = [
    { label: "View details", icon: "person", tip: "What they bought, payments and history", onClick: () => onOpen(member) },
    { label: "Send email", icon: "mail", tip: "Opens an email to them in your mail app", onClick: () => onEmail(member) },
  ];
  if (canGift(member, ctx)) {
    items.push({
      label: "Gift extra days",
      icon: "gift",
      tip: "Move their renewal date back — they get the days free",
      onClick: () => onGift(member),
    });
  }
  items.push({
    label: "Send voucher",
    icon: "voucher",
    tip: "Make a discount code for them and email it",
    onClick: () => onVoucher(member),
  });
  if (canStop(member, ctx)) {
    items.push(null, {
      label: "Stop renewal",
      icon: "stop",
      danger: true,
      tip: "It won't renew — they keep access until the end of the paid time",
      onClick: () => onStop(member),
    });
  }
  if (canResume(member, ctx)) {
    items.push(null, {
      label: "Resume renewal",
      icon: "check",
      tip: "Undo the stop — it will renew as normal",
      onClick: () => onResume(member),
    });
  }

  return (
    <tr>
      <td className="mem-who">
        <button className="who who-btn" data-tip={`See ${first}'s details`} onClick={() => onOpen(member)}>
          <span className="av">{initialsOf(member.name)}</span>
          <span>
            {member.name}
            <small>{member.email}</small>
          </span>
        </button>
      </td>
      <td data-label="Access">
        <span className={`mem-access${access.missing ? " missing" : ""}`}>
          {access.title}
          <small>{access.detail}</small>
        </span>
      </td>
      <td data-label="Status">
        <span className={`pill ${state.pill}`} data-tip={state.tip}>
          <i /> {state.label}
        </span>
      </td>
      <td data-label="Joined">{joinedLabel(member).replace(/^(Joined|Signed up) /, "")}</td>
      <td data-label="Renewal">{renewal.label}</td>
      <td data-label="Activity">{progress.label}</td>
      <td className="tar mem-act">
        <KebabMenu items={items} tip={`Actions for ${member.name}`} />
      </td>
    </tr>
  );
}
