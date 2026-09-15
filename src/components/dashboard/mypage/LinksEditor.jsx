import Icon from "../../common/Icon";
import { MAX_LINKS, linkLabel, looksLikeUrl, platformOf } from "../../../lib/page";

// Where else to find you. A URL is all it needs: a social account shows as its
// icon, any other site as a button named from its address. Typing button text
// turns a social link into a button too.
export default function LinksEditor({ links = [], onAdd, onChange, onRemove }) {
  const full = links.length >= MAX_LINKS;

  return (
    <>

      {links.length === 0 && (
        <p className="hint">Add your Instagram, YouTube, website — anywhere people can follow you.</p>
      )}

      <div className="lk-list">
        {links.map((link) => {
          const typed = link.url.trim();
          const bad = typed && !looksLikeUrl(typed);
          return (
            <div className="lk-row" key={link.id}>
              <div className="lk-top">
                <input
                  className="field"
                  placeholder="Paste a link, e.g. instagram.com/you"
                  aria-label="Link address"
                  value={link.url}
                  onChange={(e) => onChange(link.id, { url: e.target.value })}
                />
                <button
                  className="lk-x"
                  aria-label="Remove link"
                  data-tip="Remove this link from your page"
                  onClick={() => onRemove(link.id)}
                >
                  <Icon name="trash" size={15} strokeWidth={1.9} />
                </button>
              </div>
              <input
                className="field lk-label"
                // What leaving it blank will do, so that's a choice you can see.
                placeholder={
                  typed && !bad && platformOf(typed)
                    ? `Shows as the ${platformOf(typed).name} icon — type to make it a button`
                    : `Button text — ${typed && !bad ? linkLabel({ url: typed }) : "optional"}`
                }
                aria-label="Button text"
                value={link.label}
                onChange={(e) => onChange(link.id, { label: e.target.value })}
              />
              {bad && <p className="hint warn">Not a link yet — it won&apos;t show until it is.</p>}
            </div>
          );
        })}
      </div>

      <span
        className="tip-wrap"
        data-tip={full ? `You can have up to ${MAX_LINKS} links` : `Add another link — ${links.length} of ${MAX_LINKS} used`}
      >
        <button className="btn btn-ghost btn-sm" disabled={full} onClick={onAdd}>
          <Icon name="plus" size={14} strokeWidth={2.2} /> Add link
        </button>
      </span>
    </>
  );
}
