import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import { formatWhen } from "../../../lib/datetime";

const PLATFORM_LABEL = { yt: "YouTube", zoom: "Zoom", none: "No link yet" };

export default function ClassRow({
  classItem,
  isUpcoming,
  isLive,
  onEditLink,
  onChangeTiming,
  onToggleActive,
  onDelete,
}) {
  const venue = classItem.venue || { platform: "none", url: "" };
  const needsLink = classItem.active && !venue.url;

  return (
    <div
      className={`crow${!classItem.active ? " muted" : ""}${isUpcoming ? " upnext-row" : ""}${
        needsLink ? " needs-link" : ""
      }`}
    >
      <div className="ci-name">
        <b>
          {classItem.title}
          {isUpcoming && <span className="upnext-tag">{isLive ? "On now" : "Up next"}</span>}
        </b>
        <small>
          {formatWhen(classItem.startsAt)}
          {typeof classItem.attended === "number" ? ` · ${classItem.attended} attended` : ""}
        </small>
      </div>
      <div className="ci-venue">
        <span className={`vplat ${venue.platform}`}>{PLATFORM_LABEL[venue.platform]}</span>
        {venue.url && <span className="vurl">{venue.url}</span>}
      </div>
      {/* A class with no link is the one thing that blocks publishing, so it
          gets a direct action rather than hiding inside the kebab menu. */}
      {needsLink && (
        <button className="btn btn-coral btn-sm" onClick={() => onEditLink(classItem)}>
          <Icon name="link" size={14} strokeWidth={2} /> Add link
        </button>
      )}
      <KebabMenu
        size="sm"
        items={[
          { label: "Change joining link", icon: "link", onClick: () => onEditLink(classItem) },
          { label: "Move to another time", icon: "clock", onClick: () => onChangeTiming(classItem) },
          {
            // "Cancel" says what members see; "inactive" said nothing.
            label: classItem.active ? "Cancel this class" : "Put it back on",
            icon: "pause",
            onClick: () => onToggleActive(classItem),
          },
          null,
          { label: "Delete class", icon: "trash", danger: true, onClick: () => onDelete(classItem) },
        ]}
      />
    </div>
  );
}
