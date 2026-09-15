// The membership page as rendered: regressions found in audits, pinned so
// they stay fixed. Rules about data belong in membership.test.js instead.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ok, done, source, clean } from "./harness";
import MembershipPage from "../src/components/dashboard/membership/MembershipPage.jsx";
import MembershipTable from "../src/components/dashboard/membership/MembershipTable.jsx";
import MemberViewModal from "../src/components/dashboard/membership/MemberViewModal.jsx";
import PlanFormModal from "../src/components/dashboard/membership/PlanFormModal.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import {
  initialBundles as B,
  initialEverydayLessons as L,
  initialMembershipFeatures as F,
  initialProgrammes as P,
  initialStudioPlans as PL,
} from "../src/data/mockData";
import { orderedFeatures, sortedPlans } from "../src/lib/membership";

const noop = () => {};
const R = (el) => clean(renderToString(<MemoryRouter>{el}</MemoryRouter>));
const plans = sortedPlans(PL);
const page = clean(renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter><MembershipPage /></MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
const pageSrc = source("src/components/dashboard/membership/MembershipPage.jsx");
const ctx = source("src/context/AppDataContext.jsx");
const css = source("src/styles/membership.css");

/* ---- the page ---- */
ok("three tabs", page.includes("Plans") && page.includes("Bundles") && page.includes("Extra benefits"));
ok("four summary figures", (page.match(/class="msum-b"/g) || []).length === 4);
ok("the cheapest way in is the lowest price", page.includes("£18"));
ok("a published plan that opens nothing is flagged", page.includes("Opens nothing") && page.includes("on sale but opens nothing"));
ok("hidden draft rows are counted under the table", /\d+ draft rows? (is|are) not shown/.test(page));

/* ---- the table ---- */
const table = R(<MembershipTable includeDrafts features={orderedFeatures(F)} plans={plans} bundles={B}
  programmes={P} lessons={L} onEditPlan={noop} onTogglePlanBundle={noop} onToggleFeature={noop}
  onTogglePublished={noop} onEdit={noop} onMove={noop} onDelete={noop} />);
ok("a column per plan, each with a pencil", (table.match(/class="mt-edit"/g) || []).length === plans.length);
ok("a draft row is marked when drafts are included", table.includes(">Draft<"));
// `mt-sub` once named both the price line and the expanded row; the span's
// display:block landed on the <tr> and pulled it out of the table.
ok("expanded rows don't share a class with the price line",
  source("src/components/dashboard/membership/MembershipTable.jsx").includes('className="mt-inrow"') && !css.includes(".mt-sub td"));

/* ---- plans that open everything ---- */
// Reading plan.bundles says an everything plan uses nothing; planHasBundle is
// the only correct question.
ok("a bundle's users include the everything plan", pageSrc.includes("usedBy={plans.filter((p) => planHasBundle(p, b.id))}"));
ok("members see the everything plan's ticks",
  (R(<MemberViewModal open plans={plans} bundles={B} programmes={P} lessons={L} features={F} onClose={noop} />)
    .match(/mv-yes/g) || []).length > 0);

/* ---- the plan form ---- */
const pform = source("src/components/dashboard/membership/PlanFormModal.jsx");
ok("switching to Everything keeps the picks", pform.includes("bundles: form.bundles || []"));
ok("a plan of benefits only can be saved", R(<PlanFormModal open initialStep={2} bundles={B} features={F} programmes={P} lessons={L}
  editing={{ id: "x", name: "Perks", months: 1, amount: 5, scope: "picked", bundles: [], extras: ["mf1"] }}
  onClose={noop} onSave={noop} />).includes("Benefits only"));

/* ---- the data layer ---- */
ok("everything new starts as a draft", (ctx.match(/status: "draft"/g) || []).length >= 3);
ok("new bundles and benefits go to the end of the order", (ctx.match(/nextMembershipOrder\(bundles, membershipFeatures\)/g) || []).length === 2);
ok("deleting a benefit removes it from plans", /deleteMembershipFeature[\s\S]{0,400}extras: \(p\.extras/.test(ctx));
ok("deleting a bundle removes it from plans", /deleteBundle[\s\S]{0,400}bundles: \(p\.bundles/.test(ctx));
ok("one move action for both kinds of row", ctx.includes("const moveMembershipRow"));

done();
