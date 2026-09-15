import { useNavigate } from "react-router-dom";
import { GoogleIcon } from "../common/Brand";
import { useOnboarding } from "../../context/OnboardingContext";

export default function AccountStep() {
  const { email, setEmail, password, setPassword } = useOnboarding();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/onboarding/otp");
  };

  return (
    <div className="ob-card ob-step">
      <h1>Create your account</h1>
      <p className="sub">Start teaching in a few minutes. No card needed.</p>
      <button
        type="button"
        className="btn-google"
        onClick={() => navigate("/onboarding/channel")}
        data-tip="Sign up with your Google account"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <div className="divider">or</div>
      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <label className="lbl" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="lbl" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          data-tip="Create your account with this email and password"
        >
          Create account
        </button>
      </form>
      <p className="foot-note">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/onboarding/channel")}
          data-tip="Already signed up? Log in instead"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
