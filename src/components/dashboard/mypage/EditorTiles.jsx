import { useEffect, useRef, useState } from "react";
import Icon from "../../common/Icon";
import { dropIndex } from "../../../lib/page";

// A stack of collapsible tiles. All start closed; each shows a one-line summary
// so a closed stack still says what's in it.
//
// `tiles`: [{ key, title, summary, body, movable, hidden?, onHide? }]. A tile
// with `onHide` gets an eye to switch its section off the page and back. Movable tiles can be
// dragged by their grip, or moved with ↑ ↓ while the grip has focus — the
// keyboard way isn't an extra, it's the only way for anyone who can't drag.
// `onMove(key, toIndex)` is given the index among the movable tiles.
// `defaultOpen` lists tiles to start open — for rendering without clicks; the
// page leaves it empty so everything starts closed.
export default function EditorTiles({ tiles, onMove, defaultOpen = [] }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const [dragKey, setDragKey] = useState(null);
  const [drop, setDrop] = useState(null); // { key, after }
  const [announce, setAnnounce] = useState("");
  // A moved tile is re-inserted in the DOM, which can drop focus from its grip,
  // so the grip is focused again once the move has rendered.
  const [refocus, setRefocus] = useState(null);
  const grips = useRef({});

  const movable = tiles.filter((t) => t.movable);
  const indexOf = (key) => movable.findIndex((t) => t.key === key);

  useEffect(() => {
    if (!refocus) return;
    grips.current[refocus]?.focus();
    setRefocus(null);
  }, [refocus, tiles]);

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const move = (key, to) => {
    const target = Math.max(0, Math.min(movable.length - 1, to));
    if (target === indexOf(key)) return;
    onMove(key, target);
    const title = movable.find((t) => t.key === key)?.title;
    setAnnounce(`${title} moved to position ${target + 1} of ${movable.length}`);
    setRefocus(key);
  };

  const endDrag = () => {
    setDragKey(null);
    setDrop(null);
  };

  return (
    <div className="tiles">
      {tiles.map((t) => {
        const isOpen = open.has(t.key);
        const bodyId = `tile-${t.key}`;
        const dropClass =
          drop && drop.key === t.key && dragKey && dragKey !== t.key
            ? drop.after
              ? " drop-after"
              : " drop-before"
            : "";
        return (
          <div
            key={t.key}
            className={`tile${isOpen ? " open" : ""}${t.hidden ? " off" : ""}${dragKey === t.key ? " dragging" : ""}${dropClass}`}
            data-tile={t.key}
            onDragOver={(e) => {
              if (!dragKey || !t.movable) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const box = e.currentTarget.getBoundingClientRect();
              const after = e.clientY > box.top + box.height / 2;
              if (!drop || drop.key !== t.key || drop.after !== after) setDrop({ key: t.key, after });
            }}
            onDrop={(e) => {
              if (!dragKey || !t.movable) return;
              e.preventDefault();
              move(dragKey, dropIndex(indexOf(dragKey), indexOf(t.key), !!drop?.after));
              endDrag();
            }}
          >
            <div className="tile-h">
              {t.movable ? (
                <button
                  ref={(el) => {
                    grips.current[t.key] = el;
                  }}
                  className="tile-grip"
                  draggable
                  aria-label={`Move ${t.title}. Use the up and down arrow keys.`}
                  data-tip="Drag to reorder — or press ↑ ↓"
                  onDragStart={(e) => {
                    setDragKey(t.key);
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox won't start a drag without some data.
                    e.dataTransfer.setData("text/plain", t.key);
                    const tile = e.currentTarget.closest(".tile");
                    if (tile) e.dataTransfer.setDragImage(tile, 24, 20);
                  }}
                  onDragEnd={endDrag}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      move(t.key, indexOf(t.key) + (e.key === "ArrowUp" ? -1 : 1));
                    }
                  }}
                >
                  <Icon name="grip" size={16} strokeWidth={2} />
                </button>
              ) : (
                <span className="tile-grip-space" aria-hidden="true" />
              )}

              <button
                className="tile-toggle"
                aria-expanded={isOpen}
                aria-controls={isOpen ? bodyId : undefined}
                data-tip={isOpen ? `Close ${t.title}` : `Open ${t.title}`}
                onClick={() => toggle(t.key)}
              >
                <b>{t.title}</b>
                <span className="tile-sum">
                  {t.hidden ? <span className="tile-off">Hidden</span> : t.summary}
                </span>
                <Icon name="chevronDown" size={15} strokeWidth={2.2} className="tile-chev" />
              </button>

              {t.onHide && (
                <button
                  className={`tile-eye${t.hidden ? " off" : ""}`}
                  aria-label={t.hidden ? `Show ${t.title} on your page` : `Hide ${t.title} from your page`}
                  aria-pressed={!t.hidden}
                  data-tip={t.hidden ? "Show this section on your page" : "Hide this section — its content is kept"}
                  onClick={() => t.onHide(!t.hidden)}
                >
                  <Icon name={t.hidden ? "eyeOff" : "eye"} size={15} strokeWidth={1.9} />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="tile-body" id={bodyId}>
                {t.body}
              </div>
            )}
          </div>
        );
      })}

      <span id="tiles-status" className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
