// Search: one rule (src/lib/search.js), one box (SearchInput), used on every
// list that grows and on long pick-lists in forms.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import SearchInput from "../src/components/common/SearchInput.jsx";
import SearchEmpty from "../src/components/common/SearchEmpty.jsx";
import ProgrammesListPage from "../src/components/dashboard/programmes/ProgrammesListPage.jsx";
import ClassesPage from "../src/components/dashboard/classes/ClassesPage.jsx";
import MembersPage from "../src/components/dashboard/members/MembersPage.jsx";
import PaymentsPage from "../src/components/dashboard/payments/PaymentsPage.jsx";
import BundleFormModal from "../src/components/dashboard/membership/BundleFormModal.jsx";
import PlanFormModal from "../src/components/dashboard/membership/PlanFormModal.jsx";
import ProgrammePicker from "../src/components/dashboard/mypage/ProgrammePicker.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import { initialEverydayLessons as L, initialProgrammes as P } from "../src/data/mockData";
import { SEARCH_THRESHOLD, matchesQuery, needsSearch, queryWords, searchList } from "../src/lib/search";
import { matchesSearch } from "../src/lib/members";

const noop = () => {};
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));
const wrap = (el) => clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter>{el}</MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));

/* ---- the rule ---- */
ok("an empty search matches everything", matchesQuery("anything", "") && matchesQuery("anything", "   "));
ok("case doesn't matter", matchesQuery("Morning Vinyasa", "MORNING vinyasa"));
ok("accents don't matter, either way round", matchesQuery("Café Flow", "cafe") && matchesQuery("Cafe Flow", "café"));
ok("every word has to be there, in any order", matchesQuery("Morning Vinyasa Flow", "flow morning") && !matchesQuery("Morning Vinyasa", "morning flow"));
ok("words can be spread across fields", matchesQuery(["Emma Carter", "emma@email.com"], "carter email"));
ok("empty fields are fine", matchesQuery(["Name", null, undefined, ""], "name"));
ok("extra spaces don't count as words", queryWords("  a   b ").join() === "a,b");
ok("searchList keeps what matches", searchList(P, "breath", (p) => p.name).map((p) => p.id).join() === "breathwork-basics");
ok("pick-lists get a box only once they're long", !needsSearch(SEARCH_THRESHOLD) && needsSearch(SEARCH_THRESHOLD + 1));
ok("members use the same rule", matchesSearch({ name: "Zoë Adams", email: "zoe@x.com" }, "zoe adams"));

/* ---- the box ---- */
const empty = R(<SearchInput value="" onChange={noop} placeholder="Search things" />);
ok("the box is labelled", empty.includes('aria-label="Search things"') && empty.includes('type="search"'));
ok("no clear button until something's typed", !empty.includes("search-x"));
const typed = R(<SearchInput value="yoga" onChange={noop} placeholder="Search things" label="Search things by name" />);
ok("...then one, labelled and with a tooltip", typed.includes('aria-label="Clear search"') && typed.includes('data-tip="Clear the search (Esc)"')
  && typed.includes('aria-label="Search things by name"'));
ok("Escape clears it", source("src/components/common/SearchInput.jsx").includes('e.key === "Escape" && value'));
const none = R(<SearchEmpty query=" zumba " noun="programmes" onClear={noop} />);
ok("no matches says what was searched and offers the way back", none.includes("No programmes match “zumba”") && none.includes("Clear search") && none.includes("data-tip="));

/* ---- where it appears ---- */
ok("programmes list", wrap(<ProgrammesListPage />).includes('placeholder="Search programmes"'));
ok("everyday lessons", wrap(<ClassesPage />).includes('placeholder="Search lessons"'));
ok("members", wrap(<MembersPage />).includes('placeholder="Search by name or email"'));
ok("payments", wrap(<PaymentsPage />).includes('placeholder="Search by member or email"'));
const memSrc = source("src/components/dashboard/membership/MembershipPage.jsx");
ok("bundles and extra benefits tabs, cleared on switching tab", memSrc.includes('placeholder="Search bundles"') && memSrc.includes('placeholder="Search extra benefits"')
  && /setTab\(t\.key\);\s*setSearch\(""\);/.test(memSrc));
ok("...bundles found by what's inside them too", /matchesQuery\(\s*\[\s*b\.name,\s*b\.description,\s*\.\.\.bundleProgrammes/.test(memSrc));
ok("the old hand-rolled search boxes are gone", !source("src/components/dashboard/members/MemberFilters.jsx").includes('className="search"')
  && !source("src/components/dashboard/payments/PaymentsPage.jsx").includes('className="search"'));
ok("the plans table has none — its rows are ordered by position", !memSrc.slice(memSrc.indexOf("<MembershipTable"), memSrc.indexOf("<MembershipTable") + 400).includes("SearchInput"));

/* ---- long pick-lists in forms ---- */
const many = (n, kind) => Array.from({ length: n }, (_, i) => ({ id: `${kind}${i}`, name: `${kind} ${i}`, status: "published", type: "recorded", title: `${kind} ${i}`, time: "07:00", days: [1], active: true }));
// Kept under the threshold on purpose: the demo's lessons alone can grow past it.
ok("bundle form: a short list has no box", !R(<BundleFormModal open programmes={P} lessons={L.slice(0, 3)} onClose={noop} onSave={noop} />).includes("Search programmes and lessons"));
ok("...a long one does", R(<BundleFormModal open programmes={many(5, "prog")} lessons={many(3, "less")} onClose={noop} onSave={noop} />).includes("Search programmes and lessons"));
ok("plan form: a long list of bundles and benefits gets a box", R(<PlanFormModal open initialStep={2} bundles={many(4, "b")} features={many(4, "f").map((f) => ({ ...f, title: f.name }))}
  programmes={[]} lessons={[]} onClose={noop} onSave={noop} />).includes("Search bundles and benefits"));
ok("...a short one doesn't", !R(<PlanFormModal open initialStep={2} bundles={many(2, "b")} features={[]} programmes={[]} lessons={[]} onClose={noop} onSave={noop} />).includes("Search bundles and benefits"));
ok("My page programme picker: only when long", R(<ProgrammePicker published={many(8, "prog")} onToggle={noop} onShowAll={noop} />).includes('placeholder="Search programmes"')
  && !R(<ProgrammePicker published={many(2, "prog")} onToggle={noop} onShowAll={noop} />).includes('placeholder="Search programmes"'));
ok("ticked items a search hides are counted, not lost", source("src/components/dashboard/membership/BundleFormModal.jsx").includes("hidden by your search — still in the bundle")
  && source("src/components/dashboard/membership/PlanFormModal.jsx").includes("hidden by your search — still in the plan"));

done();
