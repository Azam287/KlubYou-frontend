// Searching a list, the same way everywhere.
//
// Case and accents don't matter ("cafe" finds "Café"), and every word typed has
// to appear somewhere in the item — so "morning flow" finds "Morning Vinyasa
// Flow" but not every item with "morning" in it.

// Pick-lists in forms only get a search box once they're long enough to need
// one; a box over three checkboxes is clutter.
export const SEARCH_THRESHOLD = 6;
export const needsSearch = (count) => count > SEARCH_THRESHOLD;

const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const queryWords = (query) => fold(query).split(/\s+/).filter(Boolean);

// `fields`: a string or a list of strings (empty ones are fine).
export function matchesQuery(fields, query) {
  const words = queryWords(query);
  if (!words.length) return true;
  const haystack = fold([].concat(fields).filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}

export const searchList = (list, query, fieldsOf) =>
  (list || []).filter((item) => matchesQuery(fieldsOf(item), query));
