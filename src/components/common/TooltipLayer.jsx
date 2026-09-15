import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { placeTooltip } from "../../lib/tooltip";

const SHOW_DELAY = 280;
// Moving straight from one tip to the next skips the delay, so scanning along
// a row of table cells doesn't wait on every one.
const WARM_FOR = 450;
const TIP_ID = "app-tooltip";

// One tooltip for the whole app. Any element with `data-tip="…"` gets one —
// no wrapper component, so adding a tip never changes a layout, and the bubble
// lives on <body>, so it isn't clipped by a scrolling table or a modal.
//
//   <button data-tip="Publish — members can see it">…</button>
//   <button data-tip="…" data-tip-side="left">…</button>   (top | bottom | left | right)
//
// A disabled button gets no pointer events, so its tip goes on a wrapper:
//   <span className="tip-wrap" data-tip="Give it a name first"><button disabled>…</button></span>
//
// Shown on hover (mouse or pen) and on keyboard focus; never on touch, where
// there is no hover to reveal it and a tap should just do the thing.
export default function TooltipLayer() {
  const [tip, setTip] = useState(null);
  const [pos, setPos] = useState(null);
  const bubble = useRef(null);
  const timer = useRef(0);
  const shown = useRef(null);
  const pending = useRef(null);
  const hiddenAt = useRef(0);

  useEffect(() => {
    const hostOf = (el) => (el instanceof Element ? el.closest("[data-tip]") : null);

    const show = (host) => {
      pending.current = null;
      const text = host.getAttribute("data-tip");
      if (!text || !host.isConnected) return;
      shown.current = host;
      // Read by screen readers as the control's description — unless it would
      // only repeat the label they've just heard.
      if (text !== host.getAttribute("aria-label") && !host.hasAttribute("aria-describedby")) {
        host.setAttribute("aria-describedby", TIP_ID);
      }
      setTip({ host, text, side: host.getAttribute("data-tip-side") || "top" });
    };

    const hide = () => {
      clearTimeout(timer.current);
      pending.current = null;
      if (shown.current) {
        if (shown.current.getAttribute("aria-describedby") === TIP_ID) {
          shown.current.removeAttribute("aria-describedby");
        }
        hiddenAt.current = Date.now();
      }
      shown.current = null;
      setTip(null);
    };

    const schedule = (host) => {
      clearTimeout(timer.current);
      pending.current = host;
      if (Date.now() - hiddenAt.current < WARM_FOR) show(host);
      else timer.current = setTimeout(() => show(host), SHOW_DELAY);
    };

    const onOver = (e) => {
      if (e.pointerType === "touch") return;
      const host = hostOf(e.target);
      if (host && host === (shown.current || pending.current)) return;
      hide();
      if (host) schedule(host);
    };

    const onFocusIn = (e) => {
      const host = hostOf(e.target);
      if (!host) return;
      let keyboard = true;
      try {
        keyboard = e.target.matches(":focus-visible");
      } catch {
        // Older engines without :focus-visible — show it anyway.
      }
      if (!keyboard) return;
      hide();
      show(host);
    };

    const onFocusOut = (e) => {
      if (shown.current && !shown.current.contains(e.relatedTarget)) hide();
    };

    const onKey = (e) => {
      if (e.key === "Escape") hide();
    };

    // Pressing a control is acting on it — the tip has done its job, and a
    // menu or modal is about to open where it would sit.
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Measured after it renders, invisibly, so the bubble's real size decides
  // where it goes.
  useLayoutEffect(() => {
    if (!tip || !bubble.current) return;
    if (!tip.host.isConnected) {
      setTip(null);
      return;
    }
    const r = tip.host.getBoundingClientRect();
    const b = bubble.current.getBoundingClientRect();
    setPos({
      for: tip,
      ...placeTooltip(
        r,
        { width: b.width, height: b.height },
        { width: window.innerWidth, height: window.innerHeight },
        tip.side
      ),
    });
  }, [tip]);

  if (!tip) return null;
  const placed = pos && pos.for === tip;

  return createPortal(
    <div
      ref={bubble}
      id={TIP_ID}
      role="tooltip"
      className={`tooltip${placed ? ` tooltip-${pos.side}` : ""}`}
      style={
        placed
          ? { top: pos.top, left: pos.left, "--tip-arrow": `${pos.arrow}px` }
          : { visibility: "hidden" }
      }
    >
      {tip.text}
    </div>,
    document.body
  );
}
