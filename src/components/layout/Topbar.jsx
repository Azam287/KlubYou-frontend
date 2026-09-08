import { useHeader } from "../../context/PageHeaderContext";

// The fixed header. Content is supplied by whichever dashboard page is
// currently mounted, via the usePageHeader hook.
export default function Topbar() {
  const { title, subtitle, action } = useHeader();

  return (
    <div className="topbar">
      <div className="titles">
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
      </div>
      {action}
    </div>
  );
}
