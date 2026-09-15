// When a search finds nothing: says what was searched for and offers the way
// back, rather than a blank space that looks like there's nothing there at all.
export default function SearchEmpty({ query, noun = "items", onClear }) {
  return (
    <p className="sec-empty search-empty">
      No {noun} match &ldquo;{query.trim()}&rdquo;.{" "}
      <button type="button" className="btn btn-ghost btn-sm" data-tip="Clear the search and show everything" onClick={onClear}>
        Clear search
      </button>
    </p>
  );
}
