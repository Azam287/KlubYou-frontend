import Icon from "../../common/Icon";
import { formatTime } from "../../../lib/datetime";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Which page an entry came from. The dot is a shorthand for the label in the
// legend above — never the only thing saying it, since the source is also
// written under every title.
const SOURCE = { programme: "prog", lesson: "lesson", oneoff: "once" };

// One day of the week view. Empty days are rendered too — a gap in the
// timetable is information, and collapsing them hides it.
export default function ScheduleDay({ day, onOpen, onFixLink, onCopyLink }) {
  const date = new Date(day.date);

  return (
    <div
      className={`sday${day.today ? " today" : ""}${day.past ? " past" : ""}${
        day.entries.length ? "" : " empty"
      }`}
    >
      <div className="sday-h">
        <b>{DAYS[date.getDay()]}</b>
        <span>{date.getDate()}</span>
        {day.today && <span className="sday-now">Today</span>}
      </div>

      {day.entries.length ? (
        <div className="sday-list">
          {day.entries.map((e) => (
            <div
              className={`sitem${e.cancelled ? " off" : ""}${e.clash ? " clash" : ""}`}
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(e)}
              onKeyDown={(ev) => ev.key === "Enter" && onOpen(e)}
            >
              <span className="sitem-t">{formatTime(e.startsAt)}</span>
              <span className={`sdot ${SOURCE[e.kind] || "lesson"}`} />
              <div className="sitem-n">
                <b>{e.title}</b>
                <small>
                  {e.sourceName}
                  {e.draft ? " · Draft" : ""}
                  {e.cancelled ? " · Cancelled" : ""}
                </small>
              </div>
              {e.clash && !e.cancelled && (
                <span className="pill expiring" title="Another class starts around this time">
                  <i /> Clash
                </span>
              )}
              {!e.venueUrl && !e.cancelled ? (
                // A session nobody can join is the one thing on this page worth
                // acting on, so it's a button rather than a grey label.
                <button
                  className="btn btn-coral btn-sm sitem-fix"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onFixLink(e);
                  }}
                >
                  Add link
                </button>
              ) : (
                e.venueUrl && (
                  <button
                    className="copy"
                    title="Copy joining link"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onCopyLink(e.venueUrl);
                    }}
                  >
                    <Icon name="copy" size={14} strokeWidth={1.7} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="sday-empty">Nothing on</p>
      )}
    </div>
  );
}
