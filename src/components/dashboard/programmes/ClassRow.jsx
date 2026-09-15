import { Link } from "react-router-dom";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import { formatWhen } from "../../../lib/datetime";
import { attendancePathOf } from "../../../lib/sessions";

const PLATFORM_LABEL = { yt: "YouTube", zoom: "Zoom", none: "No link yet" };

export default function ClassRow({
  classItem,
  isUpcoming,
  isLive,
  report,
  onCopyLink,
  onEditLink,
  onChangeTiming,
  onToggleActive,
  onDelete,
  onOpenAttendance,
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
          {/* Once it has started, who came — counted from their links. */}
          {report && !report.session.draft && report.phase !== "upcoming" && (
            <>
              {" · "}
              <Link
                className="ci-att"
                to={attendancePathOf(report.session.id)}
                data-tip="See who came, and mark anyone who came another way"
              >
                {report.came} of {report.expected} {report.phase === "live" ? "in so far" : "came"}
              </Link>
            </>
          )}
        </small>
      </div>
      <div className="ci-venue">
        <span className={`vplat ${venue.platform}`}>{PLATFORM_LABEL[venue.platform]}</span>
        {venue.url && <span className="vurl">{venue.url}</span>}
      </div>
      {/* A class with no link is the one thing that blocks publishing, so it
          gets a direct action rather than hiding inside the kebab menu. */}
      {needsLink && (
        <button
          className="btn btn-coral btn-sm"
          onClick={() => onEditLink(classItem)}
          data-tip="Add the joining link — members can't join without it"
        >
          <Icon name="link" size={14} strokeWidth={2} /> Add link
        </button>
      )}
      <KebabMenu
        size="sm"
        tip="Change, move, cancel or delete this class"
        items={[
          {
            label: "Copy members' link",
            icon: "copy",
            tip: "The link to send out — it marks people present, then sends them on",
            onClick: () => onCopyLink(classItem),
          },
          {
            label: "See attendance",
            icon: "check",
            tip: report?.phase === "upcoming" ? "Who can come — marking opens once it starts" : "Who came, and when",
            onClick: () => onOpenAttendance(classItem),
          },
          {
            label: "Change hosting link",
            icon: "link",
            tip: "Paste a new Zoom, Meet or YouTube link — the members' link stays the same",
            onClick: () => onEditLink(classItem),
          },
          {
            label: "Move to another time",
            icon: "clock",
            tip: "Change the date or time — this class or the whole series",
            onClick: () => onChangeTiming(classItem),
          },
          {
            // "Cancel" says what members see; "inactive" said nothing.
            label: classItem.active ? "Cancel this class" : "Put it back on",
            icon: "pause",
            tip: classItem.active ? "Members see it as cancelled — you can put it back" : "Put it back on the schedule",
            onClick: () => onToggleActive(classItem),
          },
          null,
          {
            label: "Delete class",
            icon: "trash",
            danger: true,
            tip: "Delete it — you choose this class or the whole series",
            onClick: () => onDelete(classItem),
          },
        ]}
      />
    </div>
  );
}
