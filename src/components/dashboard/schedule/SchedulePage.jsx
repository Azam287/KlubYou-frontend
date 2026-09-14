import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import { useToast } from "../../../context/ToastContext";
import Icon from "../../common/Icon";
import VenueLinkModal from "../shared/VenueLinkModal";
import ScheduleDay from "./ScheduleDay";
import { addDays, liveNow, nextUp, startOfWeek, weekOf } from "../../../lib/schedule";
import { formatDayMonth, formatRelative, formatWhen } from "../../../lib/datetime";

// Everything the studio runs, in one week. Assembled on every render from the
// programmes and lessons themselves — there is no schedule stored anywhere, so
// this can't fall out of step with the pages that own the classes.
export default function SchedulePage() {
  const { programmes, everydayLessons, updateClassLink, updateEverydayLesson } = useAppData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [linkTarget, setLinkTarget] = useState(null);

  const data = useMemo(
    () => ({ programmes, lessons: everydayLessons }),
    [programmes, everydayLessons]
  );

  const week = useMemo(
    () => weekOf(addDays(startOfWeek(new Date()), offset * 7), data),
    [offset, data]
  );
  const next = useMemo(() => nextUp(data), [data]);
  const onAir = useMemo(() => liveNow(data), [data]);

  usePageHeader(
    "Schedule",
    "Every class and lesson you run, in one week. Nothing here is scheduled separately."
  );

  const copyLink = (url) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).catch(() => {});
    showToast("Link copied");
  };

  // Every entry belongs to something else — the schedule is a view of them, so
  // opening one means going to the page that owns it.
  const openSource = (item) => {
    if (item.kind === "programme") navigate(`/dashboard/programmes/${item.sourceId}`);
    else navigate("/dashboard/classes");
  };

  // ...except adding a missing link, which is the whole reason you'd notice a
  // gap here. Sending you to another page to fix it would waste the finding.
  const saveLink = (url) => {
    if (!linkTarget) return;
    if (linkTarget.kind === "programme") updateClassLink(linkTarget.sourceId, linkTarget.refId, url);
    else updateEverydayLesson(linkTarget.refId, { venueUrl: url });
  };

  const whichWeek = offset === 0 ? "This week" : offset === -1 ? "Last week" : offset === 1 ? "Next week" : null;

  return (
    <section className="panel">
      {onAir.length > 0 ? (
        <div className="sched-now on">
          <span className="sched-now-lbl">
            <i /> On now
          </span>
          <b>{onAir.map((e) => e.title).join(" · ")}</b>
          <span className="mut">Members are joining through their own links</span>
        </div>
      ) : next ? (
        <div className="sched-now">
          <span className="sched-now-lbl">Next up</span>
          <b>{next.title}</b>
          <span className="mut">
            {formatWhen(next.startsAt)} · {formatRelative(next.startsAt)} · {next.sourceName}
          </span>
        </div>
      ) : (
        <div className="sched-now">
          <span className="sched-now-lbl">Next up</span>
          <b>Nothing scheduled</b>
          <span className="mut">Add a class to a programme, or an everyday lesson.</span>
        </div>
      )}

      <div className="sched-bar">
        <div className="sched-nav">
          <button className="sqbtn" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week">
            <Icon name="back" size={16} strokeWidth={2.2} />
          </button>
          <button className="sqbtn flip" onClick={() => setOffset((o) => o + 1)} aria-label="Next week">
            <Icon name="back" size={16} strokeWidth={2.2} />
          </button>
          {offset !== 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setOffset(0)}>
              Back to this week
            </button>
          )}
        </div>
        <div className="sched-range">
          {whichWeek && <span className={`pill ${offset === 0 ? "live" : "sched"}`}>{whichWeek}</span>}
          <b>
            {formatDayMonth(week.from)} — {formatDayMonth(addDays(week.from, 6))}
          </b>
          <span className="mut">
            {week.total} class{week.total === 1 ? "" : "es"}
          </span>
          {/* Worth chasing, so it's counted rather than left to be spotted. */}
          {week.missingLinks > 0 && (
            <span className="pill expiring">
              <i /> {week.missingLinks} need{week.missingLinks === 1 ? "s" : ""} a link
            </span>
          )}
        </div>
      </div>

      {/* The dots mean nothing on their own — this is what they stand for. */}
      <div className="sched-legend">
        <span>
          <i className="sdot prog" /> Programme class
        </span>
        <span>
          <i className="sdot lesson" /> Everyday lesson
        </span>
        <span>
          <i className="sdot once" /> One-off class
        </span>
      </div>

      <div className="sched-week">
        {week.days.map((day) => (
          <ScheduleDay
            key={day.date}
            day={day}
            onOpen={openSource}
            onFixLink={setLinkTarget}
            onCopyLink={copyLink}
          />
        ))}
      </div>

      <VenueLinkModal
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        initialUrl=""
        title={linkTarget ? `Add a link for ${linkTarget.title}` : "Add link"}
        onSave={saveLink}
      />
    </section>
  );
}
