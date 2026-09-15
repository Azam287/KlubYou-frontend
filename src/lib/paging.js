// Splitting a long list into pages. Pure, so the members and payments tables
// page the same way and the rules can be tested without rendering.

export const PAGE_SIZES = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export const pageCount = (total, size) => Math.max(1, Math.ceil((total || 0) / (size || DEFAULT_PAGE_SIZE)));

// A page that exists: the list can shrink under you (a filter, a payment marked
// paid while viewing Pending), and page 3 of 2 would show an empty table.
export const clampPage = (page, total, size) => Math.min(Math.max(1, page || 1), pageCount(total, size));

export function paginate(list, page, size = DEFAULT_PAGE_SIZE) {
  const all = list || [];
  const current = clampPage(page, all.length, size);
  const start = (current - 1) * size;
  return {
    items: all.slice(start, start + size),
    page: current,
    pages: pageCount(all.length, size),
    from: all.length ? start + 1 : 0,
    to: Math.min(start + size, all.length),
    total: all.length,
  };
}

// The page numbers to show: always the first and last, the current one and its
// neighbours, and "…" for the gaps — [1, "…", 4, 5, 6, "…", 12].
export function pageWindow(page, pages) {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const out = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev === 2) out.push(prev + 1); // a gap of one is just that page
    else if (n - prev > 2) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}
