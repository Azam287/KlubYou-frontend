import { createContext, useContext, useMemo, useState } from "react";
import { takenHandles } from "../data/mockData";

const OnboardingContext = createContext(null);

const STEPS = ["account", "otp", "channel", "done"];
// which progress-bar segment (0-indexed) each step lights up to
const STEP_GROUP = { account: 0, otp: 0, channel: 1, done: 2 };
const GROUP_COUNT = 3;

export function OnboardingProvider({ children }) {
  const [email, setEmail] = useState("maya@studio.com");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("maya");

  const handleCheck = useMemo(() => {
    const v = handle.trim().toLowerCase();
    if (v.length < 3) return { status: "no", message: "Pick at least 3 characters" };
    if (takenHandles.includes(v)) {
      return { status: "no", message: `klubyou.co/${v} is taken` };
    }
    return { status: "ok", message: `klubyou.co/${v} is available` };
  }, [handle]);

  const value = {
    STEPS,
    STEP_GROUP,
    GROUP_COUNT,
    email,
    setEmail,
    password,
    setPassword,
    handle,
    setHandle,
    handleCheck,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return ctx;
}
