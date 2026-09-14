import Icon from "../../common/Icon";
import { introVideoOf } from "../../../lib/programme";

// The programme's shop window. It sits near the top of the page because it is
// the only thing a member can watch without paying — if it's missing, the
// programme is on sale with nothing to judge it by.
export default function IntroVideoCard({ programme, onEdit, onCopyLink }) {
  const url = introVideoOf(programme);

  if (!url) {
    return (
      <div className="intro missing">
        <span className="intro-thumb none">
          <Icon name="video" size={20} strokeWidth={1.9} />
        </span>
        <div className="intro-n">
          <b>No intro video yet</b>
          <small>People decide from this before they buy. Add a short trailer.</small>
        </div>
        <button className="btn btn-coral btn-sm" onClick={onEdit}>
          Add intro video
        </button>
      </div>
    );
  }

  return (
    <div className="intro">
      <span className="intro-thumb" style={{ background: programme.thumbGradient }}>
        <Icon name="video" size={20} strokeWidth={1.9} />
      </span>
      <div className="intro-n">
        <b>Intro video</b>
        <small className="intro-url">{url}</small>
      </div>
      <button className="copy" title="Copy intro link" onClick={() => onCopyLink(url)}>
        <Icon name="copy" size={15} strokeWidth={1.7} />
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onEdit}>
        Change
      </button>
    </div>
  );
}
