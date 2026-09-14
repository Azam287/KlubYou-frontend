import Icon from "../../common/Icon";
import { OFFER_KINDS, isStudioOnly, offersOf } from "../../../lib/programme";
import { planPrice } from "../../../lib/membership";

// Tier 2 of access. Whatever a programme sells here unlocks only this
// programme; the studio-wide subscription (tier 1) already unlocks it along
// with everything else, which is why that's spelled out rather than repeated
// as an offer on every programme.
export default function PricingPanel({
  programme,
  studioPlans,
  buyers,
  onAddOffer,
  onRemoveOffer,
  onStudioOnly,
}) {
  const offers = offersOf(programme);
  const studioOnly = isStudioOnly(programme);

  return (
    <div className="cardbox pd-sec">
      <div className="box-h">
        <h3>Buying this programme</h3>
        <span className="mut">
          {buyers} {buyers === 1 ? "person" : "people"} bought it directly
        </span>
      </div>

      <div className="offer-list">
        {offers.length ? (
          offers.map((o) => (
            <div className="offer" key={o.id}>
              <span className={`okind ${o.kind}`}>{OFFER_KINDS[o.kind]?.label || o.kind}</span>
              <div className="offer-n">
                <b>{o.kind === "subscription" ? o.length : o.label || "Full programme"}</b>
                <small>{OFFER_KINDS[o.kind]?.hint}</small>
              </div>
              <b className="offer-p">{o.price}</b>
              <button className="offer-x" title="Remove offer" onClick={() => onRemoveOffer(o.id)}>
                <Icon name="trash" size={15} strokeWidth={1.9} />
              </button>
            </div>
          ))
        ) : (
          <p className="sec-empty">
            {studioOnly
              ? "Included with the studio subscription — no separate price."
              : "Not decided yet — add an offer, or choose studio subscribers only."}
          </p>
        )}
      </div>

      {/* Only offered while there is nothing to sell: adding an offer answers
          the same question, so the two can't be set against each other. */}
      {!offers.length && (
        <label className="checkrow">
          <input
            type="checkbox"
            checked={studioOnly}
            onChange={(e) => onStudioOnly(e.target.checked)}
          />
          <div>
            <b>Studio subscribers only</b>
            <small>Don&apos;t sell this one separately — studio subscribers are the only way in.</small>
          </div>
        </label>
      )}

      <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onAddOffer}>
        <Icon name="plus" size={15} strokeWidth={2.2} /> Add an offer
      </button>

      <div className="tier-note">
        <span className="bi">
          <Icon name="lock" size={17} strokeWidth={1.8} />
        </span>
        <div>
          <b>Studio subscribers already have this</b>
          <p>
            Your studio subscription ({studioPlans.map(planPrice).join(" / ")}) unlocks every
            programme you publish. The offers above are for people who want this one on its own.
          </p>
        </div>
      </div>
    </div>
  );
}
