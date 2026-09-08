import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Lets each dashboard page declare its own fixed-header title/subtitle/action
// (via the usePageHeader hook) instead of the layout keeping a big lookup
// table of routes -> titles.
const PageHeaderContext = createContext(null);

export function PageHeaderProvider({ children }) {
  const [header, setHeader] = useState({ title: "", subtitle: "", action: null });
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used within a PageHeaderProvider");
  return ctx;
}

// NOTE: `action` is an effect dependency below — if you pass inline JSX it
// gets a new identity every render and re-fires the effect forever. Wrap it
// in `useMemo` at the call site if it's anything other than a stable
// (e.g. memoized or hoisted) element.
export function usePageHeader(title, subtitle, action = null) {
  const { setHeader } = usePageHeaderContext();
  useEffect(() => {
    setHeader({ title, subtitle, action });
  }, [setHeader, title, subtitle, action]);
}

export function useHeader() {
  return usePageHeaderContext().header;
}
