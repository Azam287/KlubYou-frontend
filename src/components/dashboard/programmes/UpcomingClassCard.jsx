import Icon from "../../common/Icon";
import { formatRelative, formatWhen } from "../../../lib/datetime";

const PLATFORM_LABEL = { yt: "YouTube", zoom: "Zoom", none: "No link yet" };

// The headline of a live programme: whichever class members need next — the one
// happening right now if there is one, otherwise the next one up. Both are
// derived from the schedule, never stored, so neither can go stale.
export default function UpcomingClassCard({ classItem, live, onUpdateLink, onCopyLink }) {
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
      </div>

      <div className="upnext-r">
        <div className="upnext-link">
          <span className={`vplat ${venue.platform}`}>{PLATFORM_LABEL[venue.platform]}</span>
          {hasLink ? (
            <>
              <span className="upnext-url">{venue.url}</span>
              <button className="copy" title="Copy link" onClick={() => onCopyLink(venue.url)}>
                <Icon name="copy" size={15} strokeWidth={1.7} />
              </button>
            </>
          ) : (
            <span className="upnext-url mut">
              {live
                ? "This class is on and nobody can get in"
                : "Members can't join until you add one"}
            </span>
          )}
        </div>
        <button
          className={`btn ${hasLink ? "btn-ghost" : "btn-coral"}`}
          onClick={() => onUpdateLink(classItem)}
        >
          <Icon name="link" size={15} strokeWidth={2} /> {hasLink ? "Update link" : "Add link"}
        </button>
      </div>
    </div>
  );
}
