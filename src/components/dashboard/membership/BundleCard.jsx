import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import {
  MEMBERSHIP_STATUS,
  bundleLessons,
  bundleProgrammes,
  bundleSummary,
  isEmptyBundle,
  isLiveItem,
  planName,
} from "../../../lib/membership";

// A bundle, and every plan currently drawing on it — because the cost of
// editing one is "which plans does this change?", and that question should be
// answered on the card rather than in your head.
export default function BundleCard({ bundle, programmes, lessons, usedBy, onEdit, onPublish, onDelete }) {
  const empty = isEmptyBundle(bundle, programmes, lessons);
  const progs = bundleProgrammes(bundle, programmes);
  const less = bundleLessons(bundle, lessons);

  return (
    <div className={`bundle${empty ? " empty" : ""}${isLiveItem(bundle) ? "" : " draft"}`}>
      <div className="bundle-h">
        <div>
          <h4>
            {bundle.name}{" "}
            <span className={`pill ${MEMBERSHIP_STATUS[bundle.status || "draft"].pill} bundle-status`}>
              <i /> {MEMBERSHIP_STATUS[bundle.status || "draft"].label}
            </span>
          </h4>
          {bundle.description && <p>{bundle.description}</p>}
        </div>
        <KebabMenu
          size="sm"
          items={[
            { label: "Edit bundle", icon: "link", onClick: () => onEdit(bundle) },
            {
              label: isLiveItem(bundle) ? "Unpublish" : "Publish",
              icon: isLiveItem(bundle) ? "eyeOff" : "eye",
              onClick: () => onPublish(bundle),
            },
            null,
            { label: "Delete bundle", icon: "trash", danger: true, onClick: () => onDelete(bundle) },
          ]}
        />
      </div>

      <div className="bundle-sum">
        <span className={empty ? "mut warn-text" : "mut"}>
          {bundleSummary(bundle, programmes, lessons)}
        </span>
      </div>

      {(progs.length > 0 || less.length > 0) && (
        <div className="bundle-items">
          {progs.map((p) => (
            <span className="bchip prog" key={p.id}>
              <Icon name="programmes" size={12} strokeWidth={2} /> {p.name}
            </span>
          ))}
          {less.map((l) => (
            <span className="bchip lesson" key={l.id}>
              <Icon name="classes" size={12} strokeWidth={2} /> {l.title}
            </span>
          ))}
        </div>
      )}

      <div className="bundle-used">
        {usedBy.length ? (
          <>
            In {usedBy.length} plan{usedBy.length === 1 ? "" : "s"}:{" "}
            <b>{usedBy.map(planName).join(", ")}</b>
          </>
        ) : (
          <span className="mut">Not in any plan yet</span>
        )}
      </div>
    </div>
  );
}
