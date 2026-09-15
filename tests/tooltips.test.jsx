// Every control on the membership page carries a tooltip, and a disabled one
// says what it is waiting for. See components/common/TooltipLayer.jsx.
import { renderToString } from "react-dom/server";
import { ok, done, source } from "./harness";
import { MemoryRouter } from "react-router-dom";
import MembershipPage from "../src/components/dashboard/membership/MembershipPage.jsx";
import MembershipTable from "../src/components/dashboard/membership/MembershipTable.jsx";
import PlanCard from "../src/components/dashboard/membership/PlanCard.jsx";
import BundleCard from "../src/components/dashboard/membership/BundleCard.jsx";
import ExtraCard from "../src/components/dashboard/membership/ExtraCard.jsx";
import PlanFormModal from "../src/components/dashboard/membership/PlanFormModal.jsx";
import BundleFormModal from "../src/components/dashboard/membership/BundleFormModal.jsx";
import FeatureFormModal from "../src/components/dashboard/membership/FeatureFormModal.jsx";
import MemberViewModal from "../src/components/dashboard/membership/MemberViewModal.jsx";
import ConfirmModal from "../src/components/common/ConfirmModal.jsx";
import { ToastProvider } from "../src/context/ToastContext.jsx";
import { AppDataProvider } from "../src/context/AppDataContext.jsx";
import { PageHeaderProvider } from "../src/context/PageHeaderContext.jsx";
import { initialBundles as B, initialStudioPlans as PL, initialProgrammes as P,
  initialEverydayLessons as L, initialMembershipFeatures as F } from "../src/data/mockData.js";
import { sortedPlans, orderedFeatures } from "../src/lib/membership.js";
import { placeTooltip, TIP_GAP, TIP_EDGE } from "../src/lib/tooltip.js";

const noop = () => {};
const R = (el) => renderToString(<MemoryRouter>{el}</MemoryRouter>);
const plans = sortedPlans(PL);
const read = (p) => source(`src/${p}`);

// Every <button> either carries its own tip or sits directly inside a
// tip-wrap (a disabled button can't be hovered, so the wrapper holds it) or a
// cell that holds it (the locked table cells).
function untipped(html) {
  const out = [];
  const re = /<button\b[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    if (/\sdata-tip="[^"]+"/.test(m[0])) continue;
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    const wrapped = /<(span|td)\b[^>]*\sdata-tip="[^"]+"[^>]*>\s*$/.test(before);
    if (wrapped) continue;
    out.push(m[0].slice(0, 90));
  }
  return out;
}
const covered = (label, html) => {
  const missing = untipped(html);
  const count = (html.match(/<button\b/g) || []).length;
  ok(`${label}: all ${count} buttons have a tooltip`, count > 0 && missing.length === 0, missing.join(" | "));
};

/* ---- every rendered surface ---- */
covered("plans tab (table view)", renderToString(
  <ToastProvider><AppDataProvider><PageHeaderProvider><MemoryRouter><MembershipPage /></MemoryRouter></PageHeaderProvider></AppDataProvider></ToastProvider>));
covered("table with drafts", R(<MembershipTable includeDrafts features={orderedFeatures(F)} plans={plans} bundles={B}
  programmes={P} lessons={L} onEditPlan={noop} onTogglePlanBundle={noop} onToggleFeature={noop}
  onTogglePublished={noop} onEdit={noop} onMove={noop} onDelete={noop} />));
for (const p of plans) covered(`plan card "${p.name}"`, R(<PlanCard plan={p} included={1} total={3} bundles={B}
  programmes={P} lessons={L} onEdit={noop} onBundle={noop} onPublish={noop} onBestSeller={noop} onDelete={noop} />));
covered("bundle card", R(<BundleCard bundle={B[0]} programmes={P} lessons={L} usedBy={[]} onEdit={noop} onPublish={noop} onDelete={noop} />));
covered("benefit card", R(<ExtraCard extra={F[0]} usedBy={[]} onEdit={noop} onPublish={noop} onDelete={noop} />));
covered("plan form, step 1 (blank)", R(<PlanFormModal open bundles={B} features={F} programmes={P} lessons={L} onClose={noop} onSave={noop} />));
covered("plan form, step 2", R(<PlanFormModal open initialStep={2} editing={plans[1]} bundles={B} features={F} programmes={P} lessons={L} onClose={noop} onSave={noop} />));
covered("bundle form", R(<BundleFormModal open programmes={P} lessons={L} onClose={noop} onSave={noop} />));
covered("benefit form", R(<FeatureFormModal open onClose={noop} onSave={noop} />));
covered("member preview", R(<MemberViewModal open plans={plans} bundles={B} programmes={P} lessons={L} features={F} onClose={noop} />));

/* ---- disabled buttons say what they're waiting for ---- */
const blankPlan = R(<PlanFormModal open bundles={B} features={F} programmes={P} lessons={L} onClose={noop} onSave={noop} />);
ok("an unnamed plan's Next says to name it", blankPlan.includes('data-tip="Give the plan a name first"'));
const noPrice = R(<PlanFormModal open editing={{ id: "x", name: "Trial", months: 1, amount: "" }} bundles={B} features={F}
  programmes={P} lessons={L} onClose={noop} onSave={noop} />);
ok("...a priceless one says to price it", noPrice.includes("Set a price above £0") || noPrice.includes("Set a price above &#xA3;0") || noPrice.includes("Set a price above"));
const emptyPlan = R(<PlanFormModal open initialStep={2} editing={{ id: "x", name: "E", months: 1, amount: 5, scope: "picked", bundles: [], extras: [] }}
  bundles={B} features={F} programmes={P} lessons={L} onClose={noop} onSave={noop} />);
ok("an empty plan's Save says what's missing", emptyPlan.includes("Pick a bundle or a benefit"));
const blankBundle = R(<BundleFormModal open programmes={P} lessons={L} onClose={noop} onSave={noop} />);
ok("an unnamed bundle says to name it", blankBundle.includes("Give the bundle a name first"));
const namedEmpty = R(<BundleFormModal open editing={{ id: "x", name: "N", programmes: [], lessons: [] }} programmes={P} lessons={L} onClose={noop} onSave={noop} />);
ok("...a named empty one says to tick something", namedEmpty.includes("Tick at least one programme or lesson"));
ok("an unnamed benefit says to name it", R(<FeatureFormModal open onClose={noop} onSave={noop} />).includes("Give the benefit a name first"));
ok("a disabled button's wrapper passes hover through", /\.tip-wrap > :disabled \{[^}]*pointer-events: none/s.test(read("styles/globals.css")));

/* ---- the table's specifics ---- */
const table = R(<MembershipTable features={orderedFeatures(F)} plans={plans} bundles={B} programmes={P} lessons={L}
  onEditPlan={noop} onTogglePlanBundle={noop} onToggleFeature={noop} onTogglePublished={noop} onEdit={noop} onMove={noop} onDelete={noop} />).replace(/&#x27;/g, "'");
ok("a locked cell explains itself on the cell", /<td[^>]*data-tip="Full studio year opens everything/.test(table));
ok("...since the disabled button passes hover to it", /\.mt-cell\.locked \{[^}]*pointer-events: none/s.test(read("styles/membership.css")));
ok("an open cell says what a click does", table.includes("Not in Starter — click to add it") || table.includes("In Starter — click to take it out"));
ok("the eye says which way it goes", table.includes("Unpublish — members stop seeing it"));
ok("the caret counts what it opens", /Show the \d+ things? in this bundle/.test(table));
ok("the pencil names the plan", table.includes("Edit Half year — name, length, price and what it opens"));
ok("icon-only controls still have labels", /class="mt-eye[^"]*"[^>]*aria-label=/.test(table) && table.includes('aria-label="Edit Half year"'));
ok("no native title tooltips left to double up", !/<(button|span|td)\b[^>]*\stitle="/.test(table));

/* ---- menus: items only render while open, so checked at source ---- */
for (const f of ["MembershipTable", "PlanCard", "BundleCard", "ExtraCard"]) {
  const s = read(`components/dashboard/membership/${f}.jsx`);
  const menu = s.slice(s.indexOf("<KebabMenu"), s.indexOf("/>", s.indexOf("items={[")) + 2);
  const labels = (menu.match(/\blabel:/g) || []).length;
  const tips = (menu.match(/\btip:/g) || []).length;
  ok(`${f}: the menu and each of its ${labels} items have a tip`, /<KebabMenu[^>]*\btip="/.test(menu) && labels > 0 && tips === labels, `${tips}/${labels}`);
}
const kebab = read("components/common/KebabMenu.jsx");
ok("menu item tips sit beside the menu, not over it", kebab.includes('data-tip-side={item.tip ? "left" : undefined}'));
ok("...and the trigger's tip goes away while it's open", kebab.includes("data-tip={open ? undefined : tip}"));
const pageSrc = read("components/dashboard/membership/MembershipPage.jsx");
ok("the header add button (rendered from an effect) has a tip per tab",
  pageSrc.includes("data-tip={ADD_TIP[tab]}") && ["plans:", "bundles:", "extras:"].every((k) => pageSrc.includes(`  ${k} "`)));
ok("every delete confirmation has tips on both buttons", (pageSrc.match(/cancelTip=/g) || []).length === 3 && (pageSrc.match(/confirmTip=/g) || []).length === 3);
covered("confirm dialog", R(<ConfirmModal open title="t" message="m" confirmTip="Delete it" cancelTip="Keep it" onConfirm={noop} onClose={noop} />));
ok("the layer is mounted once for the whole app", (read("App.jsx").match(/<TooltipLayer \/>/g) || []).length === 1);

/* ---- placement ---- */
const vp = { width: 1000, height: 800 };
const size = { width: 120, height: 30 };
const rect = (left, top, w = 40, h = 30) => ({ left, top, width: w, height: h, right: left + w, bottom: top + h });
let t = placeTooltip(rect(400, 400), size, vp);
ok("above by default, centred", t.side === "top" && t.top === 400 - 30 - TIP_GAP && t.left === 420 - 60, JSON.stringify(t));
t = placeTooltip(rect(400, 10), size, vp);
ok("flips below when there's no room above", t.side === "bottom" && t.top === 40 + TIP_GAP, JSON.stringify(t));
t = placeTooltip(rect(2, 400), size, vp);
ok("pushed back on screen at the left edge", t.left === TIP_EDGE, JSON.stringify(t));
ok("...with the arrow still pointing at the control", t.arrow === 22 - TIP_EDGE, JSON.stringify(t));
t = placeTooltip(rect(990, 400, 10), size, vp);
ok("pushed back on screen at the right edge", t.left + size.width === vp.width - TIP_EDGE, JSON.stringify(t));
ok("...and the arrow never leaves the bubble", t.arrow <= size.width - 10, JSON.stringify(t));
t = placeTooltip(rect(500, 400), size, vp, "left");
ok("a side can be asked for", t.side === "left" && t.left === 500 - 120 - TIP_GAP, JSON.stringify(t));
t = placeTooltip(rect(50, 400), size, vp, "left");
ok("...and flips when it doesn't fit", t.side === "right" && t.left === 90 + TIP_GAP, JSON.stringify(t));
t = placeTooltip(rect(400, 400), size, vp, "sideways");
ok("an unknown side falls back to top", t.side === "top");

done();
