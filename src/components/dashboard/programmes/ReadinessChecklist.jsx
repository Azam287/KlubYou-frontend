import Icon from "../../common/Icon";
import { readiness } from "../../../lib/programme";

// Shown only while a programme is a draft. This is the page's answer to
// "what do I do next?" — and the gate that stops a half-built programme
// reaching the public page.
//
// Optional items (a later class still missing its link, the pricing choice)
// are listed but drawn flat: they are worth knowing about and never block.
export default function ReadinessChecklist({ programme, onPublish, onFixLinks }) {
  const { items, done, total, canPublish, blocker } = readiness(programme);
  const outstanding = items.filter((i) => !i.done && !i.optional && i.key !== "publish").length;

  return (
    <div className="ready">
      <div className="ready-h">
        <div>
          <div className="ready-lbl">Before you publish</div>
          <h3>
            {outstanding === 0
              ? "Ready to publish"
              : `${outstanding} thing${outstanding === 1 ? "" : "s"} left`}
          </h3>
        </div>
        <div className="ready-prog">
          <span className="mut">
            {done} of {total} done
          </span>
          <span className="ready-bar">
            <span style={{ width: `${(done / total) * 100}%` }} />
          </span>
        </div>
      </div>

      <div className="ready-list">
        {items.map((item, i) => {
          const todo = !item.done && !item.optional && item.key !== "publish";
          return (
            <div className={`ritem${todo ? " todo" : ""}${item.optional && !item.done ? " opt" : ""}`} key={item.key}>
              <span className={`rmark${item.done ? " done" : ""}`}>
                {item.done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
              </span>
              <div className="ritem-n">
                <b>{item.label}</b>
                <small>{item.detail}</small>
              </div>
              {item.key === "links" && item.missing > 0 && (
                <button
                  className={`btn btn-sm ${item.optional ? "btn-ghost" : "btn-coral"}`}
                  onClick={onFixLinks}
                >
                  {item.optional ? "Add" : "Fix"} {item.missing}{" "}
                  {item.missing === 1 ? item.noun : item.nounPlural}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-coral btn-block ready-go" disabled={!canPublish} onClick={onPublish}>
        Publish programme
      </button>
      {blocker && <p className="hint ready-why">{blocker.detail}</p>}
    </div>
  );
}
