import { Link } from "react-router-dom";
import { formatWhen } from "../../../lib/datetime";
import { attendancePathOf, sessionIdOf } from "../../../lib/sessions";

const DOT = { programme: "prog", lesson: "lesson", oneoff: "once" };

// What's on right now and next, from the same timetable the Schedule page
// builds — programme classes and everyday lessons alike.
export default function ComingUp({ live, next, cameAt }) {
  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Coming up</h3>
        <Link className="mut" to="/dashboard/schedule" data-tip="See the whole week">
          Full schedule
        </Link>
      </div>
      {live.length === 0 && next.length === 0 ? (
        <p className="hint">Nothing scheduled in the next 7 days.</p>
      ) : (
        <ul className="upc">
          {live.map((e) => (
            <li key={e.id} className="upc-i live">
              <span className="upc-when">
                <i aria-hidden="true" /> On now
              </span>
              <span className="upc-t">
                <b>{e.title}</b>
                <small>
                  {e.sourceName}
                  {cameAt && (
                    <>
                      {" · "}
                      <Link
                        to={attendancePathOf(sessionIdOf(e))}
                        data-tip="Watch people arrive, and mark anyone who came another way"
                      >
                        {cameAt(e)} in so far
                      </Link>
                    </>
                  )}
                </small>
              </span>
            </li>
          ))}
          {next.map((e) => (
            <li key={e.id} className="upc-i">
              <span className="upc-when">{formatWhen(e.startsAt)}</span>
              <span className="upc-t">
                <b>
                  <span className={`sdot ${DOT[e.kind] || "prog"}`} /> {e.title}
                </b>
                <small>
                  {e.sourceName}
                  {!e.venueUrl && <span className="warn-text"> · no joining link</span>}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
