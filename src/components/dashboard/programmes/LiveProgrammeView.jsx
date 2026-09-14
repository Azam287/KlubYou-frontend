import Icon from "../../common/Icon";
import ClassRow from "./ClassRow";
import UpcomingClassCard from "./UpcomingClassCard";
import {
  currentClassOf,
  runWindow,
  seriesSummary,
  sortedClasses,
  upcomingClassOf,
  windowLabel,
} from "../../../lib/programme";
import { formatDayMonth } from "../../../lib/datetime";

// A live programme: the next class is pulled to the top with its own link, and
// every class below keeps a separate link of its own.
export default function LiveProgrammeView({
  programme,
  onAddClass,
  onEditLink,
  onChangeTiming,
  onToggleActive,
  onDeleteClass,
  onCopyLink,
  onSetDates,
}) {
  const live = currentClassOf(programme);
  const upcoming = upcomingClassOf(programme);
  // Whatever members need right now: the class that is on, else the next one.
  const headline = live || upcoming;
  const classes = sortedClasses(programme);
  const series = seriesSummary(programme);
  const window = runWindow(programme);
  // Classes left over from a shorter or later window: kept, but named, since
  // silently hiding a class the creator scheduled would be worse.
  const strays = window
    ? classes.filter((c) => {
        const t = new Date(c.startsAt).getTime();
        return t < new Date(window.startsOn).getTime() || t >= new Date(window.endsOn).getTime();
      })
    : [];

  return (
    <>
      <UpcomingClassCard
        classItem={headline}
        live={!!live}
        onUpdateLink={onEditLink}
        onCopyLink={onCopyLink}
      />

      <div className="cardbox pd-sec">
        <div className="box-h">
          <h3>Schedule</h3>
          {series && (
            <span className="pill sched">
              <i /> {series.day ? `${series.day} · ` : ""}
              {series.count} classes
            </span>
          )}
        </div>

        <div className="pd-fields">
          <div className="pdf">
            <span>Runs</span>
            <b>{windowLabel(window)}</b>
          </div>
          <div className="pdf">
            <span>Length</span>
            <b>{window ? `${window.weeks} week${window.weeks === 1 ? "" : "s"}` : "—"}</b>
          </div>
          <div className="pdf">
            <span>Classes</span>
            <b>{classes.length}</b>
          </div>
          <div className="pdf">
            <span>Certificate at end</span>
            <b>{programme.pricing?.certificate ? "On" : "Off"}</b>
          </div>
        </div>

        {strays.length > 0 && (
          <p className="hint warn">
            {strays.length} class{strays.length === 1 ? "" : "es"} fall outside these dates
            {strays[0] ? ` (${formatDayMonth(strays[0].startsAt)})` : ""} — extend the programme
            or move them.
          </p>
        )}

        <div className="pd-sub">Classes in this programme — each one has its own joining link</div>
        <div className="clist">
          {classes.length ? (
            classes.map((c) => (
              <ClassRow
                key={c.id}
                classItem={c}
                isUpcoming={headline?.id === c.id}
                isLive={live?.id === c.id}
                onEditLink={onEditLink}
                onChangeTiming={onChangeTiming}
                onToggleActive={onToggleActive}
                onDelete={onDeleteClass}
              />
            ))
          ) : (
            <p className="sec-empty">No classes scheduled yet.</p>
          )}
        </div>

        {window ? (
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onAddClass}>
            <Icon name="plus" size={15} strokeWidth={2.2} /> Add class
          </button>
        ) : (
          // Without dates there's nothing to schedule against — a weekly series
          // wouldn't know how many classes to make.
          <div className="nowindow">
            <div>
              <b>Set the dates first</b>
              <small>How long the programme runs decides how many classes a weekly series creates.</small>
            </div>
            <button className="btn btn-coral btn-sm" onClick={onSetDates}>
              Set dates
            </button>
          </div>
        )}
      </div>
    </>
  );
}
