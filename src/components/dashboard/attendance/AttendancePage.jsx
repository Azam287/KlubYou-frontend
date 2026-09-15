import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Pagination from "../../common/Pagination";
import SearchInput from "../../common/SearchInput";
import { formatDayMonth, formatWhen } from "../../../lib/datetime";
import { initialsOf, mailtoFor } from "../../../lib/members";
import { isLive, isPublished } from "../../../lib/programme";
import { matchesQuery } from "../../../lib/search";
import { DEFAULT_PAGE_SIZE, paginate } from "../../../lib/paging";
import {
  HISTORY_WEEKS,
  QUIET_DAYS,
  attendanceSummary,
  matchesSessionFilter,
  quietMembers,
  recentSessions,
  sessionReport,
} from "../../../lib/attendance";
import { attendancePathOf } from "../../../lib/sessions";

// Who came to what, across every live class and lesson. Nothing on this page is
// stored except the attendance records themselves — expected numbers, rates and
// who's gone quiet are all worked out (lib/attendance.js).
export default function AttendancePage() {
  usePageHeader(
    "Attendance",
    "Who came to your live classes and lessons — counted the moment they use their link."
  );
  const { members, studioPlans, bundles, programmes, everydayLessons, attendance } = useAppData();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(() => params.get("for") || "all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const refilter = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  const data = useMemo(
    () => ({ members, plans: studioPlans, bundles, programmes, lessons: everydayLessons, attendance }),
    [members, studioPlans, bundles, programmes, everydayLessons, attendance]
  );
  const reports = useMemo(() => recentSessions(data).map((s) => sessionReport(s, data)), [data]);
  const quiet = useMemo(() => quietMembers(data), [data]);
  const live = reports.filter((r) => r.phase === "live");
  const summary = attendanceSummary(reports);

  const shown = reports.filter(
    (r) =>
      matchesSessionFilter(r.session, filter) && matchesQuery([r.session.title, r.session.sourceName], search)
  );
  const paged = paginate(shown, page, pageSize);
  const filtered = filter !== "all" || search.trim() !== "";
  const liveProgrammes = programmes.filter((p) => isLive(p) && isPublished(p));

  return (
    <section className="panel">
      {live.map((r) => (
        <div className="sched-now on att-now" key={r.session.id}>
          <span className="sched-now-lbl">
            <i /> On now
          </span>
          <b>{r.session.title}</b>
          <span className="mut">
            {r.came} of {r.expected} in so far · {r.session.sourceName}
          </span>
          <Link
            className="btn btn-ghost btn-sm"
            to={attendancePathOf(r.session.id)}
            data-tip="Watch people arrive, and mark anyone who came in another way"
          >
            Open
          </Link>
        </div>
      ))}

      <div className="msum">
        <div className="msum-b" data-tip={`Sessions held in the last ${HISTORY_WEEKS} weeks, including any on now`}>
          <span>Sessions</span>
          <b>
            {summary.sessions} <small>last {HISTORY_WEEKS} weeks</small>
          </b>
        </div>
        <div className="msum-b" data-tip="People per session, on average">
          <span>Average</span>
          <b>
            {summary.average} <small>a session</small>
          </b>
        </div>
        <div
          className="msum-b"
          data-tip="Of the members whose plan or purchase opened a session, how many came"
        >
          <span>Turn-up</span>
          <b>{summary.rate === null ? "—" : `${summary.rate}%`}</b>
        </div>
        <div className="msum-b" data-tip="Joined through their link more than 5 minutes after the start">
          <span>Came late</span>
          <b>{summary.late}</b>
        </div>
      </div>

      {quiet.length > 0 && (
        <div className="cardbox att-quiet">
          <div className="box-h">
            <h3>Haven&apos;t come in {QUIET_DAYS} days</h3>
            <span className="mut">They could have — a check-in might bring them back</span>
          </div>
          <ul className="att-quiet-l">
            {quiet.slice(0, 6).map(({ member, lastAt }) => (
              <li key={member.id}>
                <span className="who">
                  <span className="av">{initialsOf(member.name)}</span>
                  <span>
                    {member.name}
                    <small>{lastAt ? `Last came ${formatDayMonth(lastAt)}` : "Hasn't come to a class yet"}</small>
                  </span>
                </span>
                <a
                  className="btn btn-ghost btn-sm"
                  href={mailtoFor(member, {
                    subject: "We've missed you",
                    body: `Hi ${member.name.split(" ")[0]},\n\n`,
                  })}
                  data-tip="Opens an email to them in your mail app"
                >
                  Email
                </a>
              </li>
            ))}
          </ul>
          {quiet.length > 6 && <p className="hint">And {quiet.length - 6} more.</p>}
        </div>
      )}

      <div className="filters">
        <label className="sr-only" htmlFor="att-for">
          Show sessions of
        </label>
        <select
          id="att-for"
          className="field selectw"
          value={filter}
          onChange={(e) => refilter(setFilter)(e.target.value)}
        >
          <option value="all">Every class and lesson</option>
          <optgroup label="Everyday lessons">
            <option value="lessons">All lessons and one-offs</option>
            {everydayLessons.map((l) => (
              <option key={l.id} value={`lesson:${l.id}`}>
                {l.title}
              </option>
            ))}
          </optgroup>
          {liveProgrammes.length > 0 && (
            <optgroup label="Programmes">
              <option value="programmes">All programme classes</option>
              {liveProgrammes.map((p) => (
                <option key={p.id} value={`programme:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <SearchInput
          value={search}
          onChange={refilter(setSearch)}
          placeholder="Search sessions"
          label="Search sessions by class or lesson name"
        />
      </div>

      <div className="cardbox" style={{ padding: "16px 8px" }}>
        <div className="tbl-wrap">
          <table className="tbl att-tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 12 }}>Session</th>
                <th>When</th>
                <th>Came</th>
                <th>Late</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.items.length === 0 ? (
                <tr className="mem-empty">
                  <td colSpan={5}>
                    {filtered ? (
                      <>
                        No sessions match.{" "}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setFilter("all");
                            setSearch("");
                            setPage(1);
                          }}
                          data-tip="Show every session again"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      `Nothing has run in the last ${HISTORY_WEEKS} weeks.`
                    )}
                  </td>
                </tr>
              ) : (
                paged.items.map((r) => (
                  <tr key={r.session.id}>
                    <td>
                      <Link className="att-name" to={attendancePathOf(r.session.id)} data-tip="See who came">
                        {r.session.title}
                        <small>{r.session.sourceName}</small>
                      </Link>
                    </td>
                    <td data-label="When">
                      {formatWhen(r.session.startsAt)}
                      {r.phase === "live" && (
                        <span className="pill live att-pill">
                          <i /> On now
                        </span>
                      )}
                    </td>
                    <td data-label="Came">
                      <span className="att-came">
                        <b>{r.came}</b> of {r.expected}
                        <span className="att-bar" aria-hidden="true">
                          <i style={{ width: `${r.expected ? Math.min(100, (r.came / r.expected) * 100) : 0}%` }} />
                        </span>
                      </span>
                    </td>
                    <td data-label="Late">{r.late || "—"}</td>
                    <td className="tar">
                      <Link
                        className="btn btn-ghost btn-sm"
                        to={attendancePathOf(r.session.id)}
                        data-tip="See who came and mark attendance"
                      >
                        Attendance
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          {...paged}
          size={pageSize}
          onPage={setPage}
          onSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          noun="sessions"
        />
      </div>
    </section>
  );
}
