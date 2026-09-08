import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// items: [{ label, icon, danger?, onClick }] — pass `null` for a divider.
export default function KebabMenu({ items, size = "md" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        className={`kebab${size === "sm" ? " sm" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Open menu"
      >
        <Icon name="kebab" size={size === "sm" ? 16 : 18} />
      </button>
      {open && (
        <div className="menu-pop">
          {items.map((item, i) =>
            item === null ? (
              <div className="sep" key={`sep-${i}`} />
            ) : (
              <button
                key={item.label}
                className={item.danger ? "danger" : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <Icon name={item.icon} size={16} strokeWidth={1.7} />
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
