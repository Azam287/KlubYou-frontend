import { Link, useNavigate } from "react-router-dom";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import JoinLink from "../shared/JoinLink";
import { attendancePathOf, hostNameOf } from "../../../lib/sessions";
import { formatRelative, formatWhen } from "../../../lib/datetime";
import {
  currentSession,
  isOver,
  isPaused,
  nextRun,
  patternLabel,
  repeats,
  runsPerWeek,
  timeLabel,
} from "../../../lib/everyday";

// One card for every lesson, repeating or not. Its state is derived — a class
// that stored mode: "live" was still saying "Live now" days after it ended.
//
// `link` is the members' link (what gets sent out); `latest` is the report of
// its most recent session, if it has run.
export default function LessonCard({ item, link, latest, onEdit, onToggle, onDelete }) {
  const navigate = useNavigate();
  const paused = isPaused(item);
  const live = currentSession(item);
  const next = nextRun(item);
  const over = isOver(item);
  const recurring = repeats(item);

  const state = paused
    ? { pill: "lapsed", label: "Paused" }
    : live
      ? { pill: "live", label: "Live now" }
      : over
        ? { pill: "lapsed", label: "Ended" }
        : recurring
          ? { pill: "active", label: `${runsPerWeek(item)}×/week` }
          : { pill: "sched", label: "Scheduled" };

  return (
    <div className={`lcard${paused || over ? " dim" : ""}${live ? " on-air" : ""}`}>
      <div className="lcard-time">
        <b>{timeLabel(item.time)}</b>
        <span>{patternLabel(item)}</span>
      </div>

      <div className="lcard-main">
        <h4>{item.title}</h4>
        <div className="lcard-next">
          {paused ? (
            <span className="mut">Paused — no sessions until you start it again</span>
          ) : live ? (
            <span className="mut">Happening now — members are joining through their own links</span>
          ) : over ? (
            <span className="mut">Ran {formatWhen(item.date ? `${item.date}T${item.time}` : null)}</span>
          ) : next ? (
            <>
              <Icon name="clock" size={14} strokeWidth={2} />
              Next {formatWhen(next)}
              <span className="lcard-rel">{formatRelative(next)}</span>
            </>
          ) : (
            <span className="mut">No days chosen, so it never runs</span>
          )}
        </div>
        <div className="lcard-link">
          {item.venueUrl ? (
            <>
              <JoinLink
                link={link}
                label=""
                tip={
                  recurring
                    ? "Copy the members' link — the same one every session"
                    : "Copy the members' link — send this, not the Zoom or Meet address"
                }
              />
              <span className="jlink-host">→ {hostNameOf(item.venueUrl)}</span>
            </>
          ) : (
            <>
              <span className="vplat none">No link yet</span>
              <span className="lcard-url mut">
                Add the Zoom, Meet or YouTube link — the members&apos; link has nowhere to send people
              </span>
            </>
          )}
        </div>
        {latest && (
          <Link
            className="lcard-att"
            to={attendancePathOf(latest.session.id)}
            data-tip="See who came, and mark anyone who came another way"
          >
            <Icon name="check" size={14} strokeWidth={2.2} />
            {latest.phase === "live" ? "On now" : "Last time"}: {latest.came} of {latest.expected}{" "}
            {latest.phase === "live" ? "in so far" : "came"}
          </Link>
        )}
      </div>

      <div className="lcard-act">
        <span className={`pill ${state.pill}`}>
          <i /> {state.label}
        </span>
        <button
          data-tip={item.venueUrl ? "Change its name, time, days or link" : "Add the joining link — members can't join without it"}
          className={`btn btn-sm ${item.venueUrl ? "btn-ghost" : "btn-coral"}`}
          onClick={() => onEdit(item)}
        >
          {item.venueUrl ? "Edit" : "Add link"}
        </button>
        <KebabMenu
          size="sm"
          tip="Edit, pause or remove this lesson"
          items={[
            {
              label: "Edit lesson",
              icon: "clock",
              tip: "Change its name, time, days or link",
              onClick: () => onEdit(item),
            },
            {
              label: "See attendance",
              icon: "check",
              tip: "Every session of it, and who came",
              onClick: () => navigate(`/dashboard/attendance?for=lesson:${item.id}`),
            },
            {
              label: paused ? "Start it again" : "Pause it",
              icon: "pause",
              tip: paused ? "Start it running again on its days" : "Stop it running for now — nothing is deleted",
              onClick: () => onToggle(item.id),
            },
            null,
            {
              label: "Remove",
              icon: "trash",
              danger: true,
              tip: "Delete it — members can no longer join it",
              onClick: () => onDelete(item.id),
            },
          ]}
        />
      </div>
    </div>
  );
}
