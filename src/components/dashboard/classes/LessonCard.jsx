import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
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
export default function LessonCard({ item, onEdit, onToggle, onDelete, onCopyLink }) {
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
              <span className="vplat zoom">{recurring ? "Same link every time" : "Joining link"}</span>
              <span className="lcard-url">{item.venueUrl}</span>
              <button className="copy" title="Copy link" onClick={() => onCopyLink(item.venueUrl)}>
                <Icon name="copy" size={15} strokeWidth={1.7} />
              </button>
            </>
          ) : (
            <>
              <span className="vplat none">No link yet</span>
              <span className="lcard-url mut">Members can&apos;t join until you add one</span>
            </>
          )}
        </div>
      </div>

      <div className="lcard-act">
        <span className={`pill ${state.pill}`}>
          <i /> {state.label}
        </span>
        <button
          className={`btn btn-sm ${item.venueUrl ? "btn-ghost" : "btn-coral"}`}
          onClick={() => onEdit(item)}
        >
          {item.venueUrl ? "Edit" : "Add link"}
        </button>
        <KebabMenu
          size="sm"
          items={[
            { label: "Edit lesson", icon: "clock", onClick: () => onEdit(item) },
            {
              label: paused ? "Start it again" : "Pause it",
              icon: "pause",
              onClick: () => onToggle(item.id),
            },
            null,
            { label: "Remove", icon: "trash", danger: true, onClick: () => onDelete(item.id) },
          ]}
        />
      </div>
    </div>
  );
}
