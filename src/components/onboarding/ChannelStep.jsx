import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import { useOnboarding } from "../../context/OnboardingContext";

export default function ChannelStep() {
  const { handle, setHandle, handleCheck } = useOnboarding();
  const navigate = useNavigate();

  return (
    <div className="ob-card ob-step">
      <h1>Claim your channel name</h1>
      <p className="sub">This is the link students use to find you.</p>
      <div className="handle">
        <span className="pre">klubyou.co/</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="yourname"
          autoComplete="off"
        />
      </div>
      <div className={`avail ${handleCheck.status}`}>
        {handleCheck.status === "ok" && <Icon name="check" size={15} strokeWidth={2.6} />}
        {handleCheck.status === "no" && <span aria-hidden="true">✗</span>} {handleCheck.message}
      </div>
      <span
        className="tip-wrap tip-block"
        data-tip={handleCheck.status === "ok" ? "Claim this address and continue" : "Pick an address that's available first"}
      >
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: "1.4rem" }}
          disabled={handleCheck.status !== "ok"}
          onClick={() => navigate("/onboarding/done")}
        >
          Continue
        </button>
      </span>
    </div>
  );
}
