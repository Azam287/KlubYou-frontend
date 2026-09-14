import Icon from "../../common/Icon";
import KebabMenu from "../../common/KebabMenu";
import { money } from "../../../lib/stats";
import {
  MEMBERSHIP_STATUS,
  bundlesOf,
  isLiveItem,
  contentSummaryOf,
  discountPercent,
  hasCustomName,
  hasDiscount,
  listPrice,
  perMonthLabel,
  planIsHollow,
  planIsEverything,
  planLabel,
  planName,
  planPrice,
  planSaving,
  planValue,
  savingOf,
} from "../../../lib/membership";

export default function PlanCard({
  plan,
  included,
  total,
  bundles,
  programmes,
  lessons,
  onEdit,
  onBundle,
  onPublish,
  onBestSeller,
  onDelete,
}) {
  const off = discountPercent(plan);
  const hollow = planIsHollow(plan, bundles, programmes, lessons);
  const worth = planValue(plan, bundles, programmes, lessons);
  const saving = planSaving(plan, bundles, programmes, lessons);
  const drawnFrom = bundlesOf(plan, bundles);

  return (
    <div className={`plan${plan.bestSeller ? " best" : ""}`}>
      {plan.bestSeller && (
        <div className="plan-flag">
          <Icon name="heart" size={13} strokeWidth={2.2} /> Best seller
        </div>
      )}

      <div className="plan-b">
        <div className="plan-h">
          <div>
            <h4>{planName(plan)}</h4>
            <span className={`pill ${MEMBERSHIP_STATUS[plan.status || "draft"].pill} bundle-status`}>
              <i /> {MEMBERSHIP_STATUS[plan.status || "draft"].label}
            </span>
            {hasCustomName(plan) && <span className="plan-len">{planLabel(plan)}</span>}
          </div>
          <KebabMenu
            size="sm"
            items={[
              { label: "Edit plan", icon: "link", onClick: () => onEdit(plan) },
              {
                label: isLiveItem(plan) ? "Unpublish" : "Publish",
                icon: isLiveItem(plan) ? "eyeOff" : "eye",
                onClick: () => onPublish(plan),
              },
              { label: "Choose bundles & extras", icon: "programmes", onClick: () => onBundle(plan) },
              {
                label: plan.bestSeller ? "Remove best seller" : "Mark as best seller",
                icon: "heart",
                onClick: () => onBestSeller(plan.id),
              },
              null,
              { label: "Remove plan", icon: "trash", danger: true, onClick: () => onDelete(plan) },
            ]}
          />
        </div>

        {plan.description && <p className="plan-desc">{plan.description}</p>}
        {!isLiveItem(plan) && (
          <p className="plan-draftnote">Not on sale — publish it to put it in the table below.</p>
        )}

        <div className="plan-price">
          {hasDiscount(plan) && <s>{money(listPrice(plan))}</s>}
          <b>{planPrice(plan)}</b>
          {off > 0 && <span className="plan-off">{off}% off</span>}
        </div>

        <div className="plan-meta">
          <span>{perMonthLabel(plan)}</span>
          {savingOf(plan) > 0 && <span className="plan-save">Saves {money(savingOf(plan))}</span>}
        </div>

        <div className={`plan-inc${hollow ? " none" : ""}`}>
          <span className="plan-bundle">
            <Icon name="programmes" size={13} strokeWidth={2} />
            {hollow ? "Opens nothing yet" : contentSummaryOf(plan, bundles, programmes, lessons)}
          </span>
          {/* Named, because changing one of these changes every plan using it. */}
          <span className="plan-from">
            {planIsEverything(plan)
              ? "Everything you offer, including whatever you add later"
              : drawnFrom.length
                ? `From ${drawnFrom.map((b) => b.name).join(", ")}`
                : "No bundles chosen"}
          </span>
          {/* Only claimed when the prices support it — a bundle cheaper to buy
              piecemeal has nothing to boast about. */}
          {saving > 0 && (
            <span className="plan-worth">
              Worth {money(worth)} separately · saves {money(saving)}
            </span>
          )}
          {included > 0 && (
            <span>{`Plus ${included} of ${total} ${total === 1 ? "extra" : "extras"}`}</span>
          )}
        </div>
      </div>
    </div>
  );
}
