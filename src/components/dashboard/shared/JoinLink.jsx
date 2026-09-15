import Icon from "../../common/Icon";
import useCopyLink from "./useCopyLink";

const COPY_TIP = "Copy the members' link — send this, not the Zoom or Meet address";

// A members' link with its copy button. This is what gets sent out — never the
// Zoom or Meet address behind it, or nobody's attendance could be counted.
export default function JoinLink({ link, label = "Members' link", tip = COPY_TIP, className = "" }) {
  const copy = useCopyLink();
  return (
    <span className={`jlink${className ? ` ${className}` : ""}`}>
      {label && <span className="jlink-l">{label}</span>}
      <span className="jlink-url">{link}</span>
      <button
        className="copy"
        aria-label="Copy members' link"
        onClick={() => copy(link, "Members' link copied")}
        data-tip={tip}
      >
        <Icon name="copy" size={15} strokeWidth={1.7} />
      </button>
    </span>
  );
}
