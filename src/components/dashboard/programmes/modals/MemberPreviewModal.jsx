import Modal from "../../../common/Modal";
import Icon from "../../../common/Icon";
import { formatWhen } from "../../../../lib/datetime";
import { planPrice, sortedPlans } from "../../../../lib/membership";
import {
  introVideoOf,
  isLive,
  offerPrice,
  offersOf,
  orderedSections,
  PROGRAMME_TYPES,
  sortedClasses,
} from "../../../../lib/programme";

// What a member actually sees before buying. The dashboard could previously
// only hand you a URL — there was no way to check the thing you were selling.
export default function MemberPreviewModal({ open, programme, studioPlans, onClose }) {
  if (!programme) return null;
  const meta = PROGRAMME_TYPES[programme.type] || PROGRAMME_TYPES.live;
  const offers = offersOf(programme);
  // The shortest plan is the cheapest way in, whatever order they are stored.
  const cheapestStudio = sortedPlans(studioPlans).slice(-1)[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preview as member"
      maxWidth={560}
      footer={
        <button className="btn btn-ghost" onClick={onClose} data-tip="Back to editing">
          Close preview
        </button>
      }
    >
      <div className="mp">
        <div className="mp-cover" style={{ background: programme.thumbGradient }}>
          {/* A buyer meets the trailer before anything else, so the preview
              shows it in that order too. */}
          {introVideoOf(programme) ? (
            <span className="mp-play">
              <Icon name="video" size={18} strokeWidth={2} /> Watch the intro
            </span>
          ) : (
            <span className="mp-play empty">No intro video</span>
          )}
        </div>
        <div className="mp-body">
          <span className={`badge ${programme.type}`}>
            <Icon name={meta.icon} size={13} strokeWidth={2} />
            {meta.label}
          </span>
          <h3>{programme.name}</h3>
          <p className="mp-desc">{programme.description}</p>

          <div className="mp-sub">What you get</div>
          <div className="mp-list">
            {isLive(programme)
              ? sortedClasses(programme)
                  .filter((c) => c.active)
                  .map((c) => (
                    <div className="mp-row" key={c.id}>
                      <Icon name="clock" size={15} strokeWidth={1.9} />
                      <span>{c.title}</span>
                      <small>{formatWhen(c.startsAt)}</small>
                    </div>
                  ))
              : orderedSections(programme).map((s) => (
                  <div className="mp-sec" key={s.id}>
                    <b>{s.title}</b>
                    {s.videos
                      .filter((l) => l.active)
                      .map((l) => (
                        <div className="mp-row" key={l.id}>
                          <Icon name="classes" size={15} strokeWidth={1.9} />
                          <span>{l.title}</span>
                          <small>{l.duration || ""}</small>
                        </div>
                      ))}
                  </div>
                ))}
          </div>

          <div className="mp-sub">How to get it</div>
          <div className="mp-buy">
            {offers.map((o) => (
              <div className="mp-offer" key={o.id}>
                <div>
                  <b>{o.kind === "subscription" ? o.length : o.label || "Full programme"}</b>
                  <small>{o.kind === "subscription" ? "Renews automatically" : "Pay once"}</small>
                </div>
                <span className="mp-price num">{offerPrice(o)}</span>
              </div>
            ))}
            {cheapestStudio && (
              <div className="mp-offer studio">
                <div>
                  <b>Studio subscription</b>
                  <small>This and every other programme</small>
                </div>
                <span className="mp-price num">from {planPrice(cheapestStudio)}</span>
              </div>
            )}
          </div>
          {!offers.length && (
            <p className="hint">
              No separate price — only studio subscribers can reach this programme.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
