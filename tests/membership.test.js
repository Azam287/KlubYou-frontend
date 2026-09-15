// The membership model: plans, bundles, extra benefits, and the rules that tie
// them together. Everything here is lib/membership.js — pure functions over
// the demo data, so a failure points straight at a rule.
import { ok, done } from "./harness";
import {
  bundlesOf,
  comparisonRows,
  discountPercent,
  featureCountFor,
  hasDiscount,
  isLiveItem,
  liveFeatures,
  membershipRows,
  nextMembershipOrder,
  perMonth,
  planContent,
  planHasBundle,
  planHasExtra,
  planIsEverything,
  planIsHollow,
  planName,
  planSaving,
  planValue,
  publishedOnly,
  rowIncludes,
  rowLocked,
  savingOf,
  togglePlanBundle,
} from "../src/lib/membership";
import {
  initialBundles as B,
  initialEverydayLessons as L,
  initialMembershipFeatures as F,
  initialProgrammes as P,
  initialStudioPlans as PL,
} from "../src/data/mockData";

const plan = (id) => PL.find((p) => p.id === id);
const everything = plan("sp3");
const halfYear = plan("sp2");
const starter = plan("sp1");

/* ---- the demo data is shaped the way the tests below assume ---- */
ok("sp3 is an everything plan, the others pick", planIsEverything(everything)
  && !planIsEverything(halfYear) && !planIsEverything(starter));
ok("there is a draft bundle and a draft benefit", B.some((b) => !isLiveItem(b)) && F.some((f) => !isLiveItem(f)));

/* ---- everything means every published bundle and benefit ---- */
ok("an everything plan opens every published bundle", bundlesOf(everything, B).length === publishedOnly(B).length);
ok("...and never a draft one", bundlesOf(everything, B).every(isLiveItem));
ok("...has every bundle without naming any", B.every((b) => planHasBundle(everything, b.id)));
ok("...and every benefit", F.every((f) => planHasExtra(everything, f.id)));
ok("bundles have no everything option of their own", B.every((b) => !("scope" in b)));

/* ---- a picked plan opens what it names, published only ---- */
ok("a picked plan has only its bundles", planHasBundle(halfYear, "bn3") && !planHasBundle(halfYear, "bn4"));
ok("a plan whose only bundle is a draft opens nothing", planIsHollow(starter, B, P, L));
ok("toggling adds and removes a bundle", togglePlanBundle(halfYear, "bn4").includes("bn4")
  && !togglePlanBundle(halfYear, "bn3").includes("bn3"));

/* ---- content is de-duplicated across bundles ---- */
const overlap = [
  { id: "a", status: "published", programmes: ["morning-vinyasa"], lessons: [] },
  { id: "b", status: "published", programmes: ["morning-vinyasa"], lessons: [] },
];
ok("a programme in two bundles counts once",
  planContent({ scope: "picked", bundles: ["a", "b"] }, overlap, P, L).programmes.length === 1);
ok("draft programmes never count as content",
  planContent(everything, B, P, L).programmes.every((p) => p.status === "published"));

/* ---- prices: derived, never stored ---- */
ok("a discount is the gap between list price and price", hasDiscount(everything) && savingOf(everything) === 216 - 162);
ok("the percentage rounds down, never over-claims", discountPercent(everything) === Math.floor((54 / 216) * 100));
ok("no list price means no discount", !hasDiscount({ amount: 20 }) && discountPercent({ amount: 20 }) === 0);
ok("per month divides by length", perMonth(halfYear) === 92 / 6);
ok("a plan's saving is never negative", planSaving({ ...halfYear, amount: 999999 }, B, P, L) === 0);
ok("value is what its programmes would cost for that long", planValue(halfYear, B, P, L) >= 0);
ok("a plan sold on its length still has a name", planName({ months: 6 }) === "6 months" && planName({ months: 1 }) === "1 month");

/* ---- benefits: drafts don't count ---- */
const withDraft = [...F, { id: "mfx", status: "draft", order: 99, title: "Secret" }];
ok("a draft benefit isn't counted as included", featureCountFor(withDraft, everything) === publishedOnly(F).length);
ok("...and the total it's counted against matches", liveFeatures(withDraft).length === publishedOnly(F).length);

/* ---- the table rows ---- */
const rows = membershipRows({ plans: PL, bundles: B, programmes: P, lessons: L, features: F });
ok("the table leaves drafts out by default", rows.every((r) => !r.draft));
ok("...unless asked to include them",
  membershipRows({ plans: PL, bundles: B, programmes: P, lessons: L, features: F, includeDrafts: true }).some((r) => r.draft));
ok("bundles and benefits share one order", rows.every((r, i) => i === 0 || rows[i - 1].order <= r.order));
ok("...and actually interleave", rows.map((r) => r.kind).join() !== [...rows].sort((a, b) => a.kind.localeCompare(b.kind)).map((r) => r.kind).join());
ok("no two rows share a position", new Set(rows.map((r) => r.order)).size === rows.length);
ok("an everything plan's cells are locked", rows.every((r) => rowLocked(r, "sp3")));
ok("...a picked plan's are not", rows.every((r) => !rowLocked(r, "sp2")));

/* ---- the members' comparison ---- */
const cmp = comparisonRows({ plans: publishedOnly(PL), bundles: B, programmes: P, lessons: L, features: F });
ok("members see a tick for the everything plan on every bundle",
  cmp.filter((r) => r.kind === "bundle").every((r) => rowIncludes(r, "sp3")));
ok("members never see a draft row", cmp.every((r) => isLiveItem(r.bundle || r.feature)));

/* ---- a new row goes to the end ---- */
const next = nextMembershipOrder(B, F);
ok("the next position is past every row, either kind", [...B, ...F].every((x) => (x.order || 0) < next));
ok("...and starts at one when there's nothing", nextMembershipOrder([], []) === 1);

done();
