import KebabMenu from "../../common/KebabMenu";

const PLATFORM_LABEL = { yt: "YouTube", zoom: "Zoom", none: "No link yet" };

export default function ClassRow({ classItem, onEditLink, onChangeTiming, onToggleActive, onDelete }) {
  const venue = classItem.venue || { platform: "none", url: "" };

  return (
    <div className={`crow${!classItem.active ? " muted" : ""}`}>
      <div className="ci-name">
        <b>{classItem.title}</b>
        <small>{classItem.when}</small>
      </div>
      <div className="ci-venue">
        <span className={`vplat ${venue.platform}`}>{PLATFORM_LABEL[venue.platform]}</span>
        {venue.url && <span className="vurl">{venue.url}</span>}
      </div>
      <KebabMenu
        size="sm"
        items={[
          { label: "Edit class link", icon: "link", onClick: () => onEditLink(classItem) },
          { label: "Change timing", icon: "clock", onClick: () => onChangeTiming(classItem) },
          {
            label: classItem.active ? "Mark inactive" : "Mark active",
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
