import { Link } from "react-router-dom";
import Icon from "../../common/Icon";
import JoinLink from "../shared/JoinLink";
import { formatRelative, formatWhen } from "../../../lib/datetime";
import { attendancePathOf, hostNameOf } from "../../../lib/sessions";

const PLATFORM_LABEL = { yt: "YouTube", zoom: "Zoom", none: "No link yet" };

// The headline of a live programme: whichever class members need next — the one
// happening right now if there is one, otherwise the next one up. Both are
// derived from the schedule, never stored, so neither can go stale.
// `link` is the class's members' link; `report` its attendance so far.
export default function UpcomingClassCard({ classItem, live, link, report, onUpdateLink }) {
  if (!classItem) {
    return (
      <div className="upnext empty">
        <div className="upnext-l">
          <span className="upnext-lbl">Up next</span>
          <h3>No upcoming class</h3>
          <p className="upnext-meta">
            Every class in this programme has already run. Add another, or leave it — members
            keep access to what they bought.
          </p>
        </div>
      </div>
    );
  }

  const venue = classItem.venue || { platform: "none", url: "" };
  const hasLink = !!venue.url;

  return (
    <div className="upnext">
      <div className="upnext-l">
        <span className="upnext-lbl">
          <i /> {live ? "On now" : "Up next"}
        </span>
        <h3>{classItem.title}</h3>
        <p className="upnext-meta">
          <Icon name="clock" size={14} strokeWidth={2} />
          {formatWhen(classItem.startsAt)}
          <span className="upnext-rel">
            {live ? "in progress" : formatRelative(classItem.startsAt)}
          </span>
        </p>
        {live && report && (
          <Link
            className="upnext-att"
            to={attendancePathOf(report.session.id)}
            data-tip="Watch people arrive, and mark anyone who came another way"
          >
            {report.came} of {report.expected} in so far
          </Link>
        )}
      </div>

      <div className="upnext-r">
        <div className="upnext-link">
          {hasLink ? (
            <>
              <JoinLink link={link} label="" />
              <span className="jlink-host">→ {hostNameOf(venue.url)}</span>
            </>
          ) : (
            <>
              <span className={`vplat ${venue.platform}`}>{PLATFORM_LABEL[venue.platform]}</span>
              <span className="upnext-url mut">
                {live ? "This class is on and nobody can get in" : "Members can't join until you add one"}
              </span>
            </>
          )}
        </div>
        <button
          data-tip={
            hasLink
              ? "Change where it's hosted — the members' link stays the same"
              : "Add the Zoom, Meet or YouTube link — members can't join without it"
          }
          className={`btn ${hasLink ? "btn-ghost" : "btn-coral"}`}
          onClick={() => onUpdateLink(classItem)}
        >
          <Icon name="link" size={15} strokeWidth={2} /> {hasLink ? "Update link" : "Add link"}
        </button>
      </div>
    </div>
  );
}
