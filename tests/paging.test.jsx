// Pagination: the rules in src/lib/paging.js and the shared Pagination bar.
import { renderToString } from "react-dom/server";
import { ok, done, clean } from "./harness";
import Pagination from "../src/components/common/Pagination.jsx";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, clampPage, pageCount, pageWindow, paginate } from "../src/lib/paging";

const noop = () => {};
const R = (el) => clean(renderToString(el));
const list = Array.from({ length: 24 }, (_, i) => i + 1);

ok("ten a page by default, with 25 and 50 to choose", DEFAULT_PAGE_SIZE === 10 && PAGE_SIZES.join() === "10,25,50");
ok("page count rounds up, and an empty list still has one page", pageCount(24, 10) === 3 && pageCount(20, 10) === 2 && pageCount(0, 10) === 1);
ok("the first page", paginate(list, 1, 10).items.join() === "1,2,3,4,5,6,7,8,9,10" && paginate(list, 1, 10).from === 1 && paginate(list, 1, 10).to === 10);
ok("the last page holds what's left", paginate(list, 3, 10).items.join() === "21,22,23,24" && paginate(list, 3, 10).to === 24);
ok("a page past the end lands on the last one", paginate(list, 9, 10).page === 3 && paginate(list, 9, 10).items.length === 4);
ok("...and a page before the start on the first", clampPage(0, 24, 10) === 1 && clampPage(-2, 24, 10) === 1);
ok("a list that shrinks keeps you on a page that exists", paginate(list.slice(0, 12), 3, 10).page === 2);
ok("nothing to show is 0–0 of 0", paginate([], 1, 10).from === 0 && paginate([], 1, 10).to === 0 && paginate([], 1, 10).total === 0);
ok("every item appears on exactly one page", [1, 2, 3].flatMap((p) => paginate(list, p, 10).items).join() === list.join());

ok("few pages: all of them", pageWindow(1, 3).join() === "1,2,3");
ok("many pages: first, last, and around the current one", pageWindow(6, 12).join() === "1,…,5,6,7,…,12");
ok("near the start", pageWindow(1, 12).join() === "1,2,…,12");
ok("near the end", pageWindow(12, 12).join() === "1,…,11,12");
ok("a gap of one page shows the page, not …", pageWindow(3, 12).join() === "1,2,3,4,…,12" && pageWindow(4, 12).join() === "1,2,3,4,5,…,12");

const bar = R(<Pagination {...paginate(list, 2, 10)} size={10} noun="members" onPage={noop} onSize={noop} />);
ok("the bar says what you're looking at", bar.includes("Showing 11–20 of 24 members") && bar.includes('aria-live="polite"'));
ok("...marks the current page", /aria-current="page" aria-label="Page 2"/.test(bar));
ok("...and is a labelled navigation", bar.includes('<nav class="pager" aria-label="Members pages">'));
const first = R(<Pagination {...paginate(list, 1, 10)} size={10} noun="members" onPage={noop} onSize={noop} />);
ok("previous is off on the first page, and says why", /You're on the first page[^>]*>\s*<button class="pager-btn" aria-label="Previous page" disabled=""/.test(first));
const last = R(<Pagination {...paginate(list, 3, 10)} size={10} noun="members" onPage={noop} onSize={noop} />);
ok("next is off on the last page", /aria-label="Next page" disabled=""/.test(last));
const one = R(<Pagination {...paginate(list.slice(0, 6), 1, 10)} size={10} noun="payments" onPage={noop} onSize={noop} />);
ok("one page: just the count, no page buttons or size", one.includes("Showing 1–6 of 6 payments") && !one.includes("pager-btn") && !one.includes("Per page"));
ok("nothing to show: no bar at all", R(<Pagination {...paginate([], 1, 10)} size={10} noun="members" onPage={noop} onSize={noop} />) === "");
const untipped = (html) => [...html.matchAll(/<button\b[^>]*>/g)].filter((x) => !/data-tip="/.test(x[0])
  && !/<span\b[^>]*data-tip="[^"]+"[^>]*>\s*$/.test(html.slice(Math.max(0, x.index - 300), x.index)));
ok("every page button has a tooltip", untipped(bar + first + last).length === 0);

done();
