import Icon from "../../common/Icon";
import { formatTime } from "../../../lib/datetime";
import { partsOf } from "../../../lib/locale";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Which page an entry came from. The dot is a shorthand for the label in the
// legend above — never the only thing saying it, since the source is also
// written under every title.
const SOURCE = { programme: "prog", lesson: "lesson", oneoff: "once" };

// One day of the week view. Empty days are rendered too — a gap in the
// timetable is information, and collapsing them hides it.
export default function ScheduleDay({ day, onOpen, onFixLink, onCopyLink, cameAt = () => null }) {
  // The studio's calendar day, not the browser's.
  const date = partsOf(day.date);

  return (
    <div
      className={`sday${day.today ? " today" : ""}${day.past ? " past" : ""}${
        day.entries.length ? "" : " empty"
      }`}
    >
      <div className="sday-h">
        <b>{DAYS[date.weekday]}</b>
        <span>{date.day}</span>
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
              {/* The same three rows for every entry, whatever the column width:
                  time and the action, then the name, then where it's from.
                  A wrapping flex row put the time beside the name in one card
                  and above it in the next, and the copy button wandered. */}
              <div className="sitem-top">
                <span className={`sdot ${SOURCE[e.kind] || "lesson"}`} />
                <span className="sitem-t">{formatTime(e.startsAt)}</span>
                {!e.venueUrl && !e.cancelled ? (
                  // A session nobody can join is the one thing on this page worth
                  // acting on, so it's a button rather than a grey label.
                  <button
                    className="btn btn-coral btn-sm sitem-fix"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onFixLink(e);
                    }}
                    data-tip="Add the joining link — members can't join without it"
                  >
                    Add link
                  </button>
                ) : (
                  e.venueUrl && (
                    <button
                      className="copy"
                      aria-label="Copy members' link"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onCopyLink(e);
                      }}
                      data-tip="Copy the members' link — it counts who came"
                    >
                      <Icon name="copy" size={14} strokeWidth={1.7} />
                    </button>
                  )
                )}
              </div>
              <b className="sitem-name">{e.title}</b>
              <small className="sitem-src">
                {[
                  e.sourceName,
                  e.draft && "Draft",
                  e.cancelled && "Cancelled",
                  cameAt(e) !== null && `${cameAt(e)} came`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
              {e.clash && !e.cancelled && (
                <span
                  className="pill expiring sitem-clash"
                  data-tip="Another class starts within half an hour of this one"
                >
                  <i /> Clash
                </span>
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
