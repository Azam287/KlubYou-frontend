import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

const DEFAULTS = ["4", "9", "2", "8", "", ""];

export default function OtpStep() {
  const { email } = useOnboarding();
  const [digits, setDigits] = useState(DEFAULTS);
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  const setDigit = (i, value) => {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < digits.length - 1) inputsRef.current[i + 1]?.focus();
  };

  return (
    <div className="ob-card ob-step">
      <h1>Verify your email</h1>
      <p className="sub">
        We sent a 6-digit code to <b>{email}</b>.
      </p>
      <div className="otp">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            maxLength={1}
            inputMode="numeric"
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
          />
        ))}
      </div>
      <p className="foot-note" style={{ textAlign: "left", margin: ".3rem 0 1.3rem" }}>
        Didn't get it? <button type="button">Resend code</button>
      </p>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => navigate("/onboarding/channel")}
      >
        Verify &amp; continue
      </button>
    </div>
  );
}
