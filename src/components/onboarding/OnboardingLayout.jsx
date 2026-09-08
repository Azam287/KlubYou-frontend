import { Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "../common/Brand";
import { useOnboarding } from "../../context/OnboardingContext";

export default function OnboardingLayout() {
  const { STEP_GROUP, GROUP_COUNT } = useOnboarding();
  const location = useLocation();
  const step = location.pathname.split("/").pop();
  const activeGroup = STEP_GROUP[step] ?? 0;

  return (
    <div className="ob-page">
      <div className="ob-top">
        <div className="brand">
          <LogoMark />
          KlubYou
        </div>
        <div className="ob-bar">
          {Array.from({ length: GROUP_COUNT }).map((_, i) => (
            <div key={i} className={`ob-seg${i <= activeGroup ? " on" : ""}`} />
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
