import { Link } from "react-router-dom";
import Icon from "../../common/Icon";

// What needs the creator, most pressing first, each with where to go. Empty is
// the good outcome, so it says that rather than showing an empty box.
export default function AttentionList({ items }) {
  return (
    <div className="cardbox">
      <div className="box-h">
        <h3>Needs your attention</h3>
        {items.length > 0 && <span className="mut">{items.length}</span>}
      </div>
      {items.length ? (
        <ul className="attn">
          {items.map((item) => (
            <li key={item.key} className={`attn-i ${item.tone}`}>
              <span className="attn-ic" aria-hidden="true">
                <Icon name={item.tone === "warn" ? "info" : "check"} size={16} strokeWidth={2} />
              </span>
              <div className="attn-t">
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </div>
              <Link className="btn btn-ghost btn-sm" to={item.to} data-tip={`${item.action} to sort this out`}>
                {item.action.replace(/^Open /, "")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="attn-none">
          <Icon name="check" size={16} strokeWidth={2.4} /> Nothing needs you right now.
        </p>
      )}
    </div>
  );
}
