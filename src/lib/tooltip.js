// Where a tooltip goes, worked out without touching the DOM so it can be
// tested on its own. The layer that uses it is components/common/TooltipLayer.

export const TIP_GAP = 8; // between the control and the bubble
export const TIP_EDGE = 8; // kept clear of the viewport's edges

const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), Math.max(lo, hi));

// host: the control's rect { top, left, right, bottom, width, height }
// size: the bubble's { width, height }
// viewport: { width, height }
// side: where it would like to go — flipped to the other side when it doesn't
// fit, so a control at the top of the page gets its tip underneath.
export function placeTooltip(host, size, viewport, side = "top") {
  const fits = {
    top: host.top - size.height - TIP_GAP >= TIP_EDGE,
    bottom: host.bottom + size.height + TIP_GAP <= viewport.height - TIP_EDGE,
    left: host.left - size.width - TIP_GAP >= TIP_EDGE,
    right: host.right + size.width + TIP_GAP <= viewport.width - TIP_EDGE,
  };

  let chosen = side in OPPOSITE ? side : "top";
  if (!fits[chosen] && fits[OPPOSITE[chosen]]) chosen = OPPOSITE[chosen];

  const vertical = chosen === "top" || chosen === "bottom";
  let top;
  let left;
  if (vertical) {
    top = chosen === "top" ? host.top - size.height - TIP_GAP : host.bottom + TIP_GAP;
    left = clamp(
      host.left + host.width / 2 - size.width / 2,
      TIP_EDGE,
      viewport.width - size.width - TIP_EDGE
    );
  } else {
    left = chosen === "left" ? host.left - size.width - TIP_GAP : host.right + TIP_GAP;
    top = clamp(
      host.top + host.height / 2 - size.height / 2,
      TIP_EDGE,
      viewport.height - size.height - TIP_EDGE
    );
  }

  // The arrow points at the control's centre even when the bubble had to be
  // pushed along to stay on screen — but never off the bubble's own corners.
  const arrow = vertical
    ? clamp(host.left + host.width / 2 - left, 10, size.width - 10)
    : clamp(host.top + host.height / 2 - top, 10, size.height - 10);

  return { top, left, side: chosen, arrow };
}
