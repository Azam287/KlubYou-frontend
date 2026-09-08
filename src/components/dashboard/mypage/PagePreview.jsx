import { useState } from "react";
import Icon from "../../common/Icon";

// A drop-in isn't a modelled plan type yet, so its price is illustrative —
// everything else here reads straight from the studio/programme data.
const DROPIN_PRICE = "£8";

export default function PagePreview({ studio, coverGradient, pagePlans, primaryProgramme }) {
  const membershipPlans = primaryProgramme?.membership?.plans || [];
  const [selectedPlanId, setSelectedPlanId] = useState(membershipPlans[1]?.id || membershipPlans[0]?.id);
  const isOn = (key) => pagePlans.find((p) => p.key === key)?.on;

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
                <b>142</b> members
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
              {isOn("membership") && membershipPlans.length > 0 && (
                <div className="pp-plan feat">
                  <div className="pt">
                    <h5>Studio membership</h5>
                  </div>
                  <div className="pp-opts">
                    {membershipPlans.map((p) => (
                      <button
                        key={p.id}
                        className={`pp-opt${selectedPlanId === p.id ? " on" : ""}`}
                        onClick={() => setSelectedPlanId(p.id)}
                      >
                        {p.length} · {p.price}
                      </button>
                    ))}
                  </div>
                  <button className="pp-btn">Subscribe</button>
                </div>
              )}
              {isOn("course") && primaryProgramme?.course && (
                <div className="pp-plan">
                  <div className="pt">
                    <h5>{primaryProgramme.name}</h5>
                    <span className="price">{primaryProgramme.course.price}</span>
                  </div>
                  <p className="pdesc">
                    Sep 1–30 · 4-week course{primaryProgramme.course.certificate ? " · certificate included" : ""}
                  </p>
                  <button className="pp-btn">Enrol</button>
                </div>
              )}
              {isOn("dropin") && (
                <div className="pp-plan">
                  <div className="pt">
                    <h5>Drop-in class</h5>
                    <span className="price">{DROPIN_PRICE}</span>
                  </div>
                  <p className="pdesc">One session · pay as you go</p>
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
