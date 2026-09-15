import Icon from "./Icon";
import { PAGE_SIZES, pageWindow } from "../../lib/paging";

// Under a table: how many there are and which you're looking at, the pages,
// and how many to a page. `noun` is plural ("members", "payments").
export default function Pagination({ page, pages, from, to, total, size, onPage, onSize, noun = "items" }) {
  if (!total) return null;

  return (
    <nav className="pager" aria-label={`${noun[0].toUpperCase()}${noun.slice(1)} pages`}>
      <span className="pager-count" aria-live="polite">
        Showing {from}–{to} of {total} {noun}
      </span>

      {pages > 1 && (
        <div className="pager-pages">
          <span className="tip-wrap" data-tip={page === 1 ? "You're on the first page" : "Previous page"}>
            <button
              className="pager-btn"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => onPage(page - 1)}
            >
              <Icon name="chevronLeft" size={15} strokeWidth={2.4} />
            </button>
          </span>
          {pageWindow(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="pager-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                className={`pager-btn${n === page ? " on" : ""}`}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                data-tip={n === page ? `Page ${n} — you're here` : `Go to page ${n}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            )
          )}
          <span className="tip-wrap" data-tip={page === pages ? "You're on the last page" : "Next page"}>
            <button
              className="pager-btn"
              aria-label="Next page"
              disabled={page === pages}
              onClick={() => onPage(page + 1)}
            >
              <Icon name="chevronRight" size={15} strokeWidth={2.4} />
            </button>
          </span>
        </div>
      )}

      {total > PAGE_SIZES[0] && (
        <label className="pager-size">
          <span>Per page</span>
          <select className="field" value={size} onChange={(e) => onSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
