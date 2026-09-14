import { useMemo, useState } from "react";
import { usePageHeader } from "../../../context/PageHeaderContext";
import { useAppData } from "../../../context/AppDataContext";
import Icon from "../../common/Icon";
import ConfirmModal from "../../common/ConfirmModal";
import PlanCard from "./PlanCard";
import MembershipTable from "./MembershipTable";
import MemberViewModal from "./MemberViewModal";
import PlanFormModal from "./PlanFormModal";
import BundleCard from "./BundleCard";
import BundleFormModal from "./BundleFormModal";
import ExtraCard from "./ExtraCard";
import FeatureFormModal from "./FeatureFormModal";
import { memberStats } from "../../../lib/stats";
import {
  featureCountFor,
  isDraftItem,
  isLiveItem,
  liveFeatures,
  orderedFeatures,
  planHasBundle,
  planHasExtra,
  planIsHollow,
  planName,
  publishedOnly,
  bestSellerOf,
  planPrice,
  sortedPlans,
  togglePlanExtra,
  togglePlanBundle,
} from "../../../lib/membership";

const TABS = [
  { key: "plans", label: "Plans" },
  { key: "bundles", label: "Bundles" },
  { key: "extras", label: "Extra benefits" },
];

// The one subscription that unlocks everything, and what "everything" means.
//
// Programmes are sold on their own; this is the other tier. Editing it here is
// editing what members see — the comparison table below is the same data the
// public page renders, not a second copy of it.
export default function MembershipPage() {
  const {
    studioPlans,
    membershipFeatures,
    programmes,
    everydayLessons,
    members,
    addStudioPlan,
    updateStudioPlan,
    setBestSellerPlan,
    setPlanBundles,
    setPlanExtras,
    bundles,
    addBundle,
    updateBundle,
    moveMembershipRow,
    deleteBundle,
    removeStudioPlan,
    addMembershipFeature,
    updateMembershipFeature,
    deleteMembershipFeature,
  } = useAppData();

  const [tab, setTab] = useState("plans");
  // Two ways to read the same thing: what a member sees, and the version with
  // every control on it. Neither is a separate copy of the data.
  const [memberView, setMemberView] = useState(false);
  // Two ways to look at the same plans: the table, where you set what each one
  // opens, and the cards, where you read them as products.
  const [planView, setPlanView] = useState("table");
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleEditing, setBundleEditing] = useState(null);
  const [bundleDelete, setBundleDelete] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [planEditing, setPlanEditing] = useState(null);
  // Which step the plan form opens on — the card can jump straight to content.
  const [planStep, setPlanStep] = useState(1);
  const [planDelete, setPlanDelete] = useState(null);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [featureEditing, setFeatureEditing] = useState(null);
  const [featureDelete, setFeatureDelete] = useState(null);

  const plans = useMemo(() => sortedPlans(studioPlans), [studioPlans]);
  // Draft plans aren't on sale, so they aren't columns. They're still cards
  // above, which is where you publish one.
  const livePlans = useMemo(() => publishedOnly(plans), [plans]);
  const features = useMemo(() => orderedFeatures(membershipFeatures), [membershipFeatures]);
  // What's actually on sale: the cards count against this, not against a list
  // with drafts in it.
  const liveExtras = useMemo(() => liveFeatures(features), [features]);
  const subscribers = useMemo(() => memberStats(members).studio, [members]);
  // Rows the table doesn't show, because unpublished things aren't part of what
  // members get. Said out loud underneath, so unpublishing isn't a trapdoor.
  const draftRows = useMemo(
    () => [...bundles, ...features].filter(isDraftItem).length,
    [bundles, features]
  );
  // Published plans that open nothing — bought, and worth nothing to whoever
  // bought them.
  const emptyLive = useMemo(
    () => livePlans.filter((p) => planIsHollow(p, bundles, programmes, everydayLessons)),
    [livePlans, bundles, programmes, everydayLessons]
  );

  // The header button follows the tab: one obvious thing to add, wherever you
  // are, rather than three buttons that are mostly wrong.
  const addAction = useMemo(() => {
    const open = {
      plans: () => {
        setPlanEditing(null);
        setPlanOpen(true);
      },
      bundles: () => {
        setBundleEditing(null);
        setBundleOpen(true);
      },
      extras: () => {
        setFeatureEditing(null);
        setFeatureOpen(true);
      },
    }[tab];
    const label = { plans: "New plan", bundles: "New bundle", extras: "New benefit" }[tab];
    return (
      <button className="btn btn-coral" onClick={open}>
        <Icon name="plus" size={16} strokeWidth={2.2} /> {label}
      </button>
    );
  }, [tab]);

  usePageHeader(
    "Membership",
    "Plans people buy, the bundles they open, and the extra benefits that come with them.",
    addAction
  );

  const openPlan = (plan, step = 1) => {
    setPlanEditing(plan);
    setPlanStep(step);
    setPlanOpen(true);
  };

  const openFeature = (feature) => {
    setFeatureEditing(feature);
    setFeatureOpen(true);
  };

  return (
    <section className="panel">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? " on" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="tab-n">
              {t.key === "plans" ? plans.length : t.key === "bundles" ? bundles.length : features.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <>
          {/* What the membership is doing, from the data rather than from a
              paragraph — the explanation moved under the heading, where it's
              read once. */}
          <div className="msum">
            <div className="msum-b">
              <span>On a membership</span>
              <b>{subscribers}</b>
            </div>
            <div className="msum-b">
              <span>Plans on sale</span>
              <b>
                {livePlans.length}
                {plans.length > livePlans.length && (
                  <small> of {plans.length}</small>
                )}
              </b>
            </div>
            <div className="msum-b">
              <span>Cheapest way in</span>
              <b>
                {livePlans.length
                  ? planPrice(
                      livePlans.reduce((a, b) => ((b.amount || 0) < (a.amount || 0) ? b : a))
                    )
                  : "—"}
              </b>
            </div>
            <div className="msum-b">
              <span>Best seller</span>
              <b className="msum-name">
                {bestSellerOf(livePlans) ? planName(bestSellerOf(livePlans)) : "Not set"}
              </b>
            </div>
          </div>

          {/* On sale and opening nothing. The cards say it on the card, but
              the table is the default view and said nothing at all — and this
              is the one state where a member pays for an empty plan. */}
          {emptyLive.length > 0 && (
            <div className="banner warn">
              <span className="bi">
                <Icon name="info" size={20} />
              </span>
              <div>
                <b>
                  {emptyLive.length === 1
                    ? `${planName(emptyLive[0])} is on sale but opens nothing`
                    : `${emptyLive.length} plans are on sale but open nothing`}
                </b>
                <p>
                  {emptyLive.map((p) => planName(p)).join(", ")} —
                  {" "}
                  every bundle chosen is still a draft, or none is chosen. Give each one a published
                  bundle, or unpublish the plan until it has something in it.
                </p>
              </div>
            </div>
          )}

          <div className="phead">
            <div>
              <h3>{planView === "table" ? "What each plan opens" : "Your plans"}</h3>
              <p className="mut">
                {planView === "cards"
                  ? "A plan is what someone buys: a length, a price, and the bundles it opens."
                  : "Bundles and extras down the side, plans across the top."}
              </p>
            </div>

            <div className="phead-tools">
              <div className="viewpick">
                <button
                  className={`viewbtn${planView === "table" ? " on" : ""}`}
                  aria-pressed={planView === "table"}
                  title="Table — what each plan opens"
                  onClick={() => setPlanView("table")}
                >
                  <Icon name="table" size={16} strokeWidth={1.9} />
                </button>
                <button
                  className={`viewbtn${planView === "cards" ? " on" : ""}`}
                  aria-pressed={planView === "cards"}
                  title="Cards — the plans as products"
                  onClick={() => setPlanView("cards")}
                >
                  <Icon name="list" size={16} strokeWidth={1.9} />
                </button>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={() => setMemberView(true)}>
                <Icon name="page" size={14} strokeWidth={2} /> Preview as member
              </button>
            </div>
          </div>

          {planView === "cards" ? (
            plans.length ? (
              <div className="plan-row">
                {plans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    included={featureCountFor(features, p)}
                    total={liveExtras.length}
                    bundles={bundles}
                    programmes={programmes}
                    lessons={everydayLessons}
                    onEdit={(pl) => openPlan(pl, 1)}
                    onBundle={(pl) => openPlan(pl, 2)}
                    onPublish={(pl) =>
                      updateStudioPlan(pl.id, { status: isLiveItem(pl) ? "draft" : "published" })
                    }
                    onBestSeller={setBestSellerPlan}
                    onDelete={setPlanDelete}
                  />
                ))}
              </div>
            ) : (
              <p className="sec-empty">
                No plans yet. Add at least one length for people to subscribe to.
              </p>
            )
          ) : (
            <>
              <MembershipTable
                features={features}
                plans={livePlans}
                bundles={bundles}
                programmes={programmes}
                lessons={everydayLessons}
                onEditPlan={(pl) => openPlan(pl, 1)}
                onTogglePlanBundle={(plan, bundle) =>
                setPlanBundles(plan.id, togglePlanBundle(plan, bundle.id))
                }
                onToggleFeature={(plan, feature) =>
                setPlanExtras(plan.id, togglePlanExtra(plan, feature.id))
                }
                onTogglePublished={(row) => {
                const status = isLiveItem(row.bundle || row.feature) ? "draft" : "published";
                return row.kind === "bundle"
                  ? updateBundle(row.bundle.id, { status })
                  : updateMembershipFeature(row.feature.id, { status });
                }}
                onEdit={(row) =>
                row.kind === "bundle"
                  ? (setBundleEditing(row.bundle), setBundleOpen(true))
                  : openFeature(row.feature)
                }
                // Either kind, one sequence — the neighbour it swaps with may
                // well be the other sort of row.
                onMove={(row, dir) => moveMembershipRow(row.bundle?.id || row.feature.id, dir)}
                onDelete={(row) =>
                  row.kind === "bundle" ? setBundleDelete(row.bundle) : setFeatureDelete(row.feature)
                }
                />
              <p className="tcap">
                {livePlans.length
                  ? "Click a cell to put a bundle or an extra in a plan. The eye publishes a row; the ⋯ menu reorders it."
                  : "No plan is published, so there are no columns yet. Publish one from the cards view."}
                {draftRows > 0 && (
                  <>
                    {" "}
                    <b>
                      {draftRows} draft {draftRows === 1 ? "row is" : "rows are"} not shown
                    </b>{" "}
                    — a draft isn&apos;t part of what members get. Publish it from the Bundles or
                    Extra benefits tab.
                  </>
                )}
              </p>
            </>
          )}
        </>
      )}

      {tab === "bundles" && (
        <>
          <div className="banner">
            <span className="bi">
              <Icon name="info" size={20} />
            </span>
            <div>
              <b>A bundle is a named set of your content</b>
              <p>
                Plans draw on bundles rather than holding content themselves, so the same set can
                back several plans — change &quot;Daily classes&quot; once and every plan using it
                changes with it. A bundle is always a named list: &quot;everything&quot; is
                something a plan can be, not a bundle.
              </p>
            </div>
          </div>

          {bundles.length ? (
            <div className="bundle-grid">
              {bundles.map((b) => (
                <BundleCard
                  key={b.id}
                  bundle={b}
                  programmes={programmes}
                  lessons={everydayLessons}
                  usedBy={plans.filter((p) => planHasBundle(p, b.id))}
                  onEdit={(bundle) => {
                    setBundleEditing(bundle);
                    setBundleOpen(true);
                  }}
                  onPublish={(b) =>
                    updateBundle(b.id, { status: isLiveItem(b) ? "draft" : "published" })
                  }
                  onDelete={setBundleDelete}
                />
              ))}
            </div>
          ) : (
            <p className="sec-empty">
              No bundles yet. Make one, then a plan can open it.
            </p>
          )}
        </>
      )}

      {tab === "extras" && (
        <>
          <div className="banner">
            <span className="bi">
              <Icon name="info" size={20} />
            </span>
            <div>
              <b>Anything that isn&apos;t a programme or a lesson</b>
              <p>
                A monthly check-in, a discount, a printed plan — a benefit you provide rather than
                content you publish. Which plans include one is chosen on the plan, the same way
                bundles are.
              </p>
            </div>
          </div>

          {features.length ? (
            <div className="bundle-grid">
              {features.map((f) => (
                <ExtraCard
                  key={f.id}
                  extra={f}
                  usedBy={plans.filter((p) => planHasExtra(p, f.id))}
                  onEdit={openFeature}
                  onPublish={(x) =>
                    updateMembershipFeature(x.id, { status: isLiveItem(x) ? "draft" : "published" })
                  }
                  onDelete={setFeatureDelete}
                />
              ))}
            </div>
          ) : (
            <p className="sec-empty">
              No extra benefits yet. Add one — a perk with no content behind it.
            </p>
          )}
        </>
      )}

      <MemberViewModal
        open={memberView}
        plans={plans}
        bundles={bundles}
        programmes={programmes}
        lessons={everydayLessons}
        features={features}
        onClose={() => setMemberView(false)}
      />

      <PlanFormModal
        key={`${planEditing?.id || "new-plan"}-${planStep}`}
        open={planOpen}
        initialStep={planStep}
        editing={planEditing}
        bundles={bundles}
        features={features}
        programmes={programmes}
        lessons={everydayLessons}
        onClose={() => {
          setPlanOpen(false);
          setPlanEditing(null);
          setPlanStep(1);
        }}
        onSave={({ bundles: chosen, extras: chosenExtras, ...plan }) => {
          if (!planEditing) {
            return addStudioPlan({ ...plan, bundles: chosen, extras: chosenExtras });
          }
          updateStudioPlan(planEditing.id, plan);
          setPlanBundles(planEditing.id, chosen);
          setPlanExtras(planEditing.id, chosenExtras);
        }}
      />

      <BundleFormModal
        key={bundleEditing?.id || "new-bundle"}
        open={bundleOpen}
        editing={bundleEditing}
        programmes={programmes}
        lessons={everydayLessons}
        onClose={() => {
          setBundleOpen(false);
          setBundleEditing(null);
        }}
        onSave={(bundle) =>
          bundleEditing ? updateBundle(bundleEditing.id, bundle) : addBundle(bundle)
        }
      />

      <FeatureFormModal
        key={featureEditing?.id || "new-feature"}
        open={featureOpen}
        editing={featureEditing}
        onClose={() => {
          setFeatureOpen(false);
          setFeatureEditing(null);
        }}
        onSave={(feature) =>
          featureEditing
            ? updateMembershipFeature(featureEditing.id, feature)
            : addMembershipFeature(feature)
        }
      />

      <ConfirmModal
        open={!!planDelete}
        title="Remove plan"
        message={`Remove "${planDelete ? planName(planDelete) : ""}"?`}
        detail="Members already on it keep what they paid for. Nobody new can choose it."
        confirmLabel="Remove plan"
        onConfirm={() => removeStudioPlan(planDelete.id)}
        onClose={() => setPlanDelete(null)}
      />

      <ConfirmModal
        open={!!bundleDelete}
        title="Delete bundle"
        message={`Delete "${bundleDelete?.name}"?`}
        detail={
          bundleDelete && plans.filter((p) => planHasBundle(p, bundleDelete.id)).length
            ? `${plans.filter((p) => planHasBundle(p, bundleDelete.id)).length} plan(s) draw on it — they'll open less. The content itself is untouched.`
            : "No plan uses it. The content itself is untouched."
        }
        confirmLabel="Delete bundle"
        onConfirm={() => deleteBundle(bundleDelete.id)}
        onClose={() => setBundleDelete(null)}
      />

      <ConfirmModal
        open={!!featureDelete}
        title="Remove from the membership"
        message={`Remove "${featureDelete?.title}" from what members get?`}
        detail="It disappears from every plan and from your public page."
        confirmLabel="Remove it"
        onConfirm={() => deleteMembershipFeature(featureDelete.id)}
        onClose={() => setFeatureDelete(null)}
      />
    </section>
  );
}
