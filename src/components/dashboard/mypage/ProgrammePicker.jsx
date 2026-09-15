import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../common/Icon";
import { PROGRAMME_TYPES, contentSummary } from "../../../lib/programme";
import SearchInput from "../../common/SearchInput";
import { matchesQuery, needsSearch } from "../../../lib/search";

// Which published programmes the page shows. Everything published starts
// ticked; untick one to keep it off the page without unpublishing it — it
// stays on sale, just not advertised here.
export default function ProgrammePicker({ published, hidden = [], drafts = 0, onToggle, onShowAll }) {
  const shown = published.filter((p) => !hidden.includes(p.id)).length;
  const allShown = shown === published.length;
  const [search, setSearch] = useState("");
  const listed = published.filter((p) => matchesQuery([p.name, PROGRAMME_TYPES[p.type]?.label], search));

  return (
    <>

      {needsSearch(published.length) && (
        <SearchInput className="in-form" value={search} onChange={setSearch} placeholder="Search programmes" />
      )}

      {published.length && !listed.length ? (
        <p className="hint">No programmes match your search.</p>
      ) : published.length ? (
        <div className="bundle-pick pp-pick">
          {listed.map((p) => {
            const on = !hidden.includes(p.id);
            return (
              <label className={`bundle-row${on ? " on" : ""}`} key={p.id}>
                <input type="checkbox" checked={on} onChange={() => onToggle(p.id, !on)} />
                <div>
                  <b>{p.name}</b>
                  <small>
                    {(PROGRAMME_TYPES[p.type] || PROGRAMME_TYPES.live).label} · {contentSummary(p)}
                  </small>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="hint">No published programmes yet — publish one and it appears here.</p>
      )}

      <div className="pp-actions">
        {published.length > 0 && (
          <span
            className="tip-wrap"
            data-tip={allShown ? "Every published programme is already on your page" : "Put every published programme back on your page"}
          >
            <button className="btn btn-ghost btn-sm" disabled={allShown} onClick={onShowAll}>
              <Icon name="check" size={14} strokeWidth={2.4} /> Show all
            </button>
          </span>
        )}
        <Link
          className="btn btn-ghost btn-sm"
          to="/dashboard/programmes"
          data-tip="Add, edit or publish programmes on their own page"
        >
          Edit programmes
        </Link>
      </div>

      {drafts > 0 && (
        <p className="hint">
          {drafts} draft {drafts === 1 ? "programme isn't" : "programmes aren't"} listed — publish{" "}
          {drafts === 1 ? "it" : "them"} first.
        </p>
      )}
    </>
  );
}
