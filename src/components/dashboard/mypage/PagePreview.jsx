import { useState } from "react";
import Icon from "../../common/Icon";
import { money } from "../../../lib/stats";
import {
  PROGRAMME_TYPES,
  contentSummary,
  hasIntro,
  isPublished,
  leadOffer,
  offersOf,
} from "../../../lib/programme";
import { patternLabel, repeats, timeLabel } from "../../../lib/everyday";
import {
  comparisonRows,
  publishedOnly,
  contentSummaryOf,
  planContent,
  planName,
  discountPercent,
  hasDiscount,
  listPrice,
  planLabel,
  planPrice,
  sortedPlans,
} from "../../../lib/membership";

// A drop-in isn't a modelled offer kind yet, so its price is illustrative —
// everything else here reads straight from the studio/programme data.
const DROPIN_PRICE = "£8";

// The public page mirrors the two access tiers: one studio subscription that
// unlocks everything, then each programme sold on its own underneath.
export default function PagePreview({
  studio,
  coverGradient,
  pagePlans,
  studioPlans,
  programmes,
  everydayLessons,
  membershipFeatures,
  bundles,
  memberCount,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(
    sortedPlans(publishedOnly(studioPlans))[0]?.id
  );
  const isOn = (key) => pagePlans.find((p) => p.key === key)?.on;
  // Draft programmes never reach the public page, however they're priced —
  // previously a single offer was enough to publish an empty programme.
  const sellable = (programmes || []).filter((p) => isPublished(p) && offersOf(p).length > 0);
  // What a drop-in actually buys a seat at: the lessons that repeat. A paused
  // one isn't running, and a one-off is gone before anyone reads the page.
  const running = (everydayLessons || []).filter(
    (l) => l.active !== false && l.venueUrl && repeats(l)
  );
  // What the subscription actually gets you, named rather than implied — and
  // taken from the selected plan's bundle, since "every programme" stopped
  // being true once shorter plans could carry fewer.
  // Only from what's on sale, and falling back to the first of those: the id is
  // held from the first render, so unpublishing the chosen plan left the public
  // page describing a plan nobody can buy.
  const livePlans = sortedPlans(publishedOnly(studioPlans));
  const selectedPlan = livePlans.find((p) => p.id === selectedPlanId) || livePlans[0] || null;
  const includedLine =
    [
      selectedPlan ? contentSummaryOf(selectedPlan, bundles, programmes, everydayLessons) : null,
      running.length ? `${running.length} weekly class${running.length === 1 ? "" : "es"}` : null,
    ]
      .filter(Boolean)
      .join(" and ") || "Everything you publish";
  const includedText = `${includedLine} — one price, cancel anytime.`;

  return (
    <div className="browser">
      <div className="browser-bar">
        <div className="dots">
          <i />
          <i />
          <i />
        </div>
        <div className="browser-url">
          <Icon name="lock" size={12} strokeWidth={2} />
          klubyou.co/{studio.handle}
        </div>
      </div>
      <div className="browser-view">
        <div className="pubpage">
          <div className="pp-cover" style={{ background: coverGradient }} />
          <div className="pp-head">
            <div className="pp-av">
              <Icon name="person" size={34} strokeWidth={1.7} />
            </div>
            <h2 className="pp-name">{studio.name}</h2>
            <p className="pp-tag">{studio.tagline}</p>
            <div className="pp-stats">
              <span>
                <b>{memberCount}</b> members
              </span>
              <span>
                <b>{studio.classesPerWeek}</b> classes / week
              </span>
              <span>
                <b>{studio.rating}</b> rating
              </span>
            </div>
          </div>
          <div className="pp-section first">
            <p className="pp-about">{studio.about}</p>
          </div>
          <div className="pp-section">
            <h3 className="pp-h">Choose your plan</h3>
            <div className="pp-plans">
              {isOn("studio") && livePlans.length > 0 && (
                <div className="pp-plan feat">
                  <div className="pt">
                    <h5>{selectedPlan ? planName(selectedPlan) : "Studio subscription"}</h5>
                  </div>
                  {/* Named rather than implied: "everything you publish" left a
                      visitor counting for themselves. */}
                  <p className="pdesc">
                    {selectedPlan?.description || includedText}
                  </p>
                  {/* What the chosen length actually unlocks, straight from the
                      membership table — not a second list to keep in step. */}
                  <div className="pp-opts">
                    {livePlans.map((p) => (
                      <button
                        key={p.id}
                        className={`pp-opt${selectedPlan?.id === p.id ? " on" : ""}`}
                        onClick={() => setSelectedPlanId(p.id)}
                      >
                        {planLabel(p)} · {planPrice(p)}
                        {hasDiscount(p) && <s>{money(listPrice(p))}</s>}
                      </button>
                    ))}
                  </div>
                  {selectedPlan && (
                    <ul className="pp-inc">
                      {/* The programmes this length actually bundles, named —
                          "every programme" wasn't true of the shorter plans. */}
                      {planContent(selectedPlan, bundles, programmes, everydayLessons).programmes.map((prog) => (
                        <li key={prog.id}>
                          <Icon name="check" size={12} strokeWidth={3} /> {prog.name}
                        </li>
                      ))}
                      {planContent(selectedPlan, bundles, programmes, everydayLessons).lessons
                        .slice(0, 3)
                        .map((l) => (
                          <li key={l.id}>
                            <Icon name="check" size={12} strokeWidth={3} /> {l.title}
                          </li>
                        ))}
                      {/* The same rows the membership table shows, so anything
                          hidden there is hidden here too. */}
                      {comparisonRows({
                        plans: publishedOnly(studioPlans),
                        bundles,
                        programmes,
                        lessons: everydayLessons,
                        features: membershipFeatures,
                      })
                        .filter((r) => r.kind === "extra" && r.plans.includes(selectedPlan.id))
                        .slice(0, 3)
                        .map((r) => (
                          <li key={r.id}>
                            <Icon name="check" size={12} strokeWidth={3} /> {r.title}
                          </li>
                        ))}
                    </ul>
                  )}
                  <button className="pp-btn">
                    Subscribe
                    {selectedPlan && hasDiscount(selectedPlan)
                      ? ` — save ${discountPercent(selectedPlan)}%`
                      : ""}
                  </button>
                </div>
              )}

              {isOn("programmes") &&
                sellable.map((p) => {
                  const lead = leadOffer(p);
                  const meta = PROGRAMME_TYPES[p.type] || PROGRAMME_TYPES.live;
                  return (
                    <div className="pp-plan" key={p.id}>
                      <div className="pt">
                        <h5>{p.name}</h5>
                        <span className="price">{lead?.price}</span>
                      </div>
                      <p className="pdesc">
                        {meta.label} · {contentSummary(p)}
                        {p.pricing?.certificate ? " · certificate included" : ""}
                      </p>
                      {/* The trailer is the only thing a visitor can watch
                          before paying, so the page offers it by name. */}
                      {hasIntro(p) && (
                        <button className="pp-watch">
                          <Icon name="video" size={13} strokeWidth={2} /> Watch the intro
                        </button>
                      )}
                      <button className="pp-btn">
                        {lead?.kind === "subscription" ? "Subscribe" : "Buy programme"}
                      </button>
                    </div>
                  );
                })}

              {isOn("dropin") && (
                <div className="pp-plan">
                  <div className="pt">
                    <h5>Drop-in class</h5>
                    <span className="price">{DROPIN_PRICE}</span>
                  </div>
                  {/* A drop-in is a seat in one session, so what's actually
                      running daily is the useful thing to name here. */}
                  <p className="pdesc">
                    {running.length
                      ? running
                          .map((l) => `${l.title} · ${patternLabel(l)} ${timeLabel(l.time)}`)
                          .join(" — ")
                      : "One session · pay as you go"}
                  </p>
                  <button className="pp-btn">Book a class</button>
                </div>
              )}
            </div>
          </div>
          <div className="pp-foot">
            Powered by <b>KlubYou</b>
          </div>
        </div>
      </div>
    </div>
  );
}
