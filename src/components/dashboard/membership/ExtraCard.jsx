import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import { MEMBERSHIP_STATUS, isLiveItem, planName } from "../../../lib/membership";

// An extra benefit, shaped like a bundle card so the two tabs read the same
// way. It carries no content — that's what makes it an extra rather than a
// bundle — so the card says which plans include it instead.
// Where it sits in the table is decided in the table, so this card doesn't
// offer a second way to do it.
export default function ExtraCard({ extra, usedBy, onEdit, onPublish, onDelete }) {
  const status = MEMBERSHIP_STATUS[extra.status || "draft"];

  return (
    <div className={`bundle${isLiveItem(extra) ? "" : " draft"}`}>
      <div className="bundle-h">
        <div>
          <h4>
            {extra.title}{" "}
            <span className={`pill ${status.pill} bundle-status`}>
              <i /> {status.label}
            </span>
          </h4>
          {extra.detail && <p>{extra.detail}</p>}
        </div>
        <KebabMenu
          size="sm"
          items={[
            { label: "Rename", icon: "link", onClick: () => onEdit(extra) },
            {
              label: isLiveItem(extra) ? "Unpublish" : "Publish",
              icon: isLiveItem(extra) ? "eyeOff" : "eye",
              onClick: () => onPublish(extra),
            },
            null,
            { label: "Delete", icon: "trash", danger: true, onClick: () => onDelete(extra) },
          ]}
        />
      </div>

      <div className="bundle-sum">
        <span className="bchip lesson">
          <Icon name="gift" size={12} strokeWidth={2} /> Perk
        </span>
        <span className="mut">No content — a benefit you provide</span>
      </div>

      <div className="bundle-used">
        {usedBy.length ? (
          <>
            In {usedBy.length} plan{usedBy.length === 1 ? "" : "s"}:{" "}
            <b>{usedBy.map(planName).join(", ")}</b>
          </>
        ) : (
          <span className="mut">Not in any plan yet — add it on the plan</span>
        )}
      </div>
    </div>
  );
}
