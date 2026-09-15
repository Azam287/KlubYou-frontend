import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import SearchInput from "../../common/SearchInput";
import JoinLink from "../shared/JoinLink";
import useCopyLink from "../shared/useCopyLink";
import { formatDayMonth, formatTime, formatWhen } from "../../../lib/datetime";
import { initialsOf, mailtoFor } from "../../../lib/members";
import { matchesQuery, needsSearch } from "../../../lib/search";
import {
  JOIN_OPENS_MINS,
  LATE_MINS,
  SESSION_MINS,
  TIMELINE_STEP,
  arrivalLabel,
  historyOf,
  sessionOf,
  sessionReport,
} from "../../../lib/attendance";
import {
  attendancePathOf,
  hostNameOf,
  joinLinkOf,
  personalLinkOf,
  targetOfEntry,
} from "../../../lib/sessions";

const PHASE = {
  live: { pill: "live", label: "On now" },
  held: { pill: "active", label: "Held" },
  upcoming: { pill: "sched", label: "Coming up" },
};

const SHOW = [
  { key: "all", label: "Everyone", tip: "Everyone this session was for, and anyone else who came" },
  { key: "came", label: "Came", tip: "Came through their link, or you marked them" },
  { key: "missed", label: "Didn't come", tip: "Could have come, and didn't" },
];

// One session: its link, who came and when, how it compares with the last few,
// and the register — where anyone can be marked present or absent by hand.
export default function SessionAttendancePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { studio, members, studioPlans, bundles, programmes, everydayLessons, attendance, markAttendance } =
    useAppData();
  const copy = useCopyLink();
  const [show, setShow] = useState("all");
  const [search, setSearch] = useState("");

  const data = useMemo(
    () => ({ members, plans: studioPlans, bundles, programmes, lessons: everydayLessons, attendance }),
    [members, studioPlans, bundles, programmes, everydayLessons, attendance]
  );
  const session = useMemo(() => sessionOf(sessionId, data), [sessionId, data]);
  const report = useMemo(() => (session ? sessionReport(session, data) : null), [session, data]);
  const history = useMemo(() => (session ? historyOf(session, data) : []), [session, data]);

  usePageHeader(
    session ? session.title : "Attendance",
    session ? `${formatWhen(session.startsAt)} · ${session.sourceName}` : ""
  );

  const back = (
    <button className="backlink" data-tip="Back to every session" onClick={() => navigate("/dashboard/attendance")}>
      <Icon name="back" size={16} strokeWidth={2.2} /> All attendance
    </button>
  );

  if (!session) {
    return (
      <section className="panel">
        {back}
        <p className="sec-empty">
          This session isn&apos;t there any more — the class or lesson it belonged to was deleted.
        </p>
      </section>
    );
  }

  const link = joinLinkOf(studio.handle, targetOfEntry(session));
  const phase = PHASE[report.phase];
  const upcoming = report.phase === "upcoming";
  const start = new Date(session.startsAt).getTime();
  const fixPath = session.kind === "programme" ? `/dashboard/programmes/${session.sourceId}` : "/dashboard/classes";
  const maxBucket = Math.max(1, ...report.timeline.map((b) => b.count));
  const missed = report.rows.filter((r) => !r.present && r.eligible).length;

  const rows = report.rows.filter(
    (r) =>
      (show === "all" || (show === "came" ? r.present : !r.present && r.eligible)) &&
      matchesQuery([r.member.name, r.member.email], search)
  );

  return (
    <section className="panel">
      {back}

      <div className="cardbox att-link">
        <div className="att-link-main">
          <span className={`pill ${phase.pill}`}>
            <i /> {phase.label}
          </span>
          <JoinLink link={link} />
          <p className="hint">
            {session.kind === "programme"
              ? "This class's own link. "
              : "The same link every session — which one it counts for depends on when it's used. "}
            Every member gets a personal copy, so going through it marks them present. It opens{" "}
            {JOIN_OPENS_MINS} minutes before the start.
          </p>
        </div>
        <div className="att-host">
          <span className="jlink-l">Sends them to</span>
          {session.venueUrl ? (
            <span>
              <b>{hostNameOf(session.venueUrl)}</b>
              <small>{session.venueUrl}</small>
            </span>
          ) : (
            <span className="warn-text">
              Nowhere yet — add the Zoom, Meet or YouTube link.{" "}
              <Link to={fixPath} data-tip="Go to where the hosting link is set">
                Add it
              </Link>
            </span>
          )}
        </div>
      </div>

      <div className="msum">
        <div className="msum-b" data-tip="Came through their link, or marked by you — out of everyone it was for">
          <span>{upcoming ? "Can come" : "Came"}</span>
          <b>
            {upcoming ? report.expected : report.came}{" "}
            {!upcoming && <small>of {report.expected}</small>}
          </b>
        </div>
        <div className="msum-b" data-tip="Of the members whose plan or purchase opens it, how many came">
          <span>Turn-up</span>
          <b>{upcoming || report.rate === null ? "—" : `${report.rate}%`}</b>
        </div>
        <div className="msum-b" data-tip={`Came through their link more than ${LATE_MINS} minutes after the start`}>
          <span>Late</span>
          <b>
            {report.late} <small>{report.onTime} on time</small>
          </b>
        </div>
        <div className="msum-b" data-tip="Their first class or lesson with you">
          <span>First time</span>
          <b>{report.firstTimers}</b>
        </div>
        <div className="msum-b" data-tip="Marked present by you rather than through their link">
          <span>Marked by you</span>
          <b>{report.marked}</b>
        </div>
      </div>

      <div className="att-grid">
        <div className="cardbox">
          <div className="box-h">
            <h3>When people arrived</h3>
            <span className="mut">
              {report.peak
                ? `Busiest from ${formatTime(new Date(start + report.peak.from * 60000).toISOString())}`
                : "No one through the link yet"}
            </span>
          </div>
          <div className="att-tl" role="img" aria-label="Arrivals through the link, in five-minute steps">
            {report.timeline.map((b) => {
              const from = new Date(start + b.from * 60000).toISOString();
              const to = new Date(start + (b.from + TIMELINE_STEP) * 60000).toISOString();
              return (
                <div
                  key={b.from}
                  className={`att-tl-b${b.from === 0 ? " start" : ""}${b.from < 0 ? " early" : ""}`}
                  data-tip={`${b.count} came in ${formatTime(from)}–${formatTime(to)}`}
                >
                  <i style={{ height: `${(b.count / maxBucket) * 100}%` }} />
                </div>
              );
            })}
          </div>
          {/* Placed by where each minute falls on the bars: the link opens
              before the start, so "Start" isn't at the left edge. */}
          <div className="att-tl-x" aria-hidden="true">
            {[-JOIN_OPENS_MINS, 0, 30, SESSION_MINS].map((m) => (
              <span key={m} style={{ left: `${((m + JOIN_OPENS_MINS) / (SESSION_MINS + JOIN_OPENS_MINS)) * 100}%` }}>
                {m === 0 ? "Start" : m < 0 ? `${m} min` : `+${m}`}
              </span>
            ))}
          </div>
          <p className="hint">
            A link sees when someone comes in, not how long they stay — watch time needs Zoom or
            YouTube connected.
          </p>
        </div>

        <div className="cardbox">
          <div className="box-h">
            <h3>{session.kind === "programme" ? "Classes in this programme" : "Recent sessions"}</h3>
            <span className="mut">How many came</span>
          </div>
          {history.length ? (
            <div className="att-hist">
              {history.map((h) => (
                <Link
                  key={h.session.id}
                  to={attendancePathOf(h.session.id)}
                  className={`att-hist-b${h.session.id === session.id ? " on" : ""}`}
                  data-tip={`${formatWhen(h.session.startsAt)} · ${h.came} of ${h.expected} came`}
                >
                  <b>{h.came}</b>
                  <span className="att-hist-bar">
                    <i style={{ height: `${h.expected ? Math.min(100, (h.came / h.expected) * 100) : 0}%` }} />
                  </span>
                  <small>{formatDayMonth(h.session.startsAt)}</small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="hint">Nothing earlier to compare with yet.</p>
          )}
        </div>
      </div>

      <div className="cardbox" style={{ padding: "16px 8px" }}>
        <div className="box-h att-roster-h">
          <h3>{upcoming ? "Who can come" : "Register"}</h3>
          {!upcoming && (
            <div className="chips" role="group" aria-label="Show">
              {SHOW.map((f) => (
                <button
                  key={f.key}
                  className={`chip${show === f.key ? " on" : ""}`}
                  aria-pressed={show === f.key}
                  onClick={() => setShow(f.key)}
                  data-tip={f.tip}
                >
                  {f.label}{" "}
                  <span className="chip-n">
                    {f.key === "all" ? report.rows.length : f.key === "came" ? report.came : missed}
                  </span>
                </button>
              ))}
            </div>
          )}
          {needsSearch(report.rows.length) && (
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email"
              label="Search this register by name or email"
            />
          )}
        </div>
        <div className="tbl-wrap">
          <table className="tbl att-tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 12 }}>Member</th>
                <th>Arrived</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="mem-empty">
                  <td colSpan={3}>
                    {report.rows.length
                      ? "No one here matches."
                      : "No members have access to this yet — add it to a membership bundle, or sell the programme."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const first = r.member.name.split(" ")[0];
                  return (
                    <tr key={r.member.id} className={r.present ? "att-came-row" : undefined}>
                      <td>
                        <span className="who">
                          <span className="av">{initialsOf(r.member.name)}</span>
                          <span>
                            {r.member.name}
                            {r.first && <span className="att-first">First time</span>}
                            <small>{r.eligible ? r.member.email : "No longer has access to this"}</small>
                          </span>
                        </span>
                      </td>
                      <td data-label="Arrived">
                        {upcoming ? (
                          <span className="mut">—</span>
                        ) : (
                          <span className="att-arr">
                            {r.present && r.via === "link" && <b>{formatTime(r.at)}</b>}
                            <span
                              className={`pill ${
                                !r.present ? "lapsed" : r.late ? "expiring" : r.via === "marked" ? "sched" : "active"
                              }`}
                            >
                              <i /> {arrivalLabel(r)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="tar att-act">
                        {upcoming ? (
                          <span className="tip-wrap" data-tip="You can mark attendance once it starts">
                            <button className="btn btn-ghost btn-sm" disabled>
                              Mark present
                            </button>
                          </span>
                        ) : (
                          <button
                            className={`btn btn-sm ${r.present ? "btn-ghost" : "btn-coral"}`}
                            onClick={() => markAttendance(session, r.member, !r.present)}
                            data-tip={
                              r.present
                                ? `${first} didn't really come — take them off the register`
                                : `${first} came in another way — put them on the register`
                            }
                          >
                            {r.present ? "Mark absent" : "Mark present"}
                          </button>
                        )}
                        <KebabMenu
                          size="sm"
                          tip={`${first}'s link and email`}
                          items={[
                            {
                              label: "Copy their link",
                              icon: "link",
                              tip: `Copy ${first}'s own link — using it marks them present`,
                              onClick: () => copy(personalLinkOf(link, r.member.id), `${first}'s link copied`),
                            },
                            {
                              label: "Send email",
                              icon: "mail",
                              tip: "Opens an email to them in your mail app",
                              onClick: () => {
                                window.location.href = mailtoFor(r.member, {
                                  subject: session.title,
                                  body: `Hi ${first},\n\nHere's your link: https://${personalLinkOf(link, r.member.id)}\n\n`,
                                });
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
