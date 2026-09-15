import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import { useOnboarding } from "../../context/OnboardingContext";
import { useAppData } from "../../context/AppDataContext";

export default function DoneStep() {
  const { handle } = useOnboarding();
  const { studio, updateStudio } = useAppData();
  const navigate = useNavigate();

  const enterApp = () => {
    updateStudio({ handle });
    navigate("/dashboard");
  };

  return (
    <div className="ob-card ob-step" style={{ textAlign: "center" }}>
      <div className="done-ring">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </div>
      <h1>You're all set, {studio.ownerName}</h1>
      <p className="sub" style={{ marginBottom: "1.6rem" }}>
        Your page is live at <b>klubyou.co/{handle}</b>. Next, set up your page and schedule your
        first class — right from your dashboard.
      </p>
      <button
        type="button"
        className="btn btn-coral btn-block"
        onClick={enterApp}
        data-tip="Open your dashboard"
      >
        Go to dashboard
      </button>
    </div>
  );
}
