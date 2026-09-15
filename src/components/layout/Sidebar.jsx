import { NavLink } from "react-router-dom";
import Icon from "../common/Icon";
import { LogoMark } from "../common/Brand";
import { useAppData } from "../../context/AppDataContext";

const NAV_ITEMS = [
  { to: "/dashboard", end: true, icon: "overview", label: "Overview", tip: "How your studio is doing, and what needs you" },
  { to: "/dashboard/page", icon: "page", label: "My page", tip: "Your public page" },
  { to: "/dashboard/classes", icon: "classes", label: "Everyday Lessons", tip: "Classes that come with the subscription" },
  { to: "/dashboard/schedule", icon: "calendar", label: "Schedule", tip: "Every class and lesson, week by week" },
  { to: "/dashboard/programmes", icon: "programmes", label: "Programmes", tip: "Courses and video series people buy" },
  { to: "/dashboard/attendance", icon: "check", label: "Attendance", tip: "Who came to your live classes and lessons" },
  { to: "/dashboard/membership", icon: "voucher", label: "Membership", tip: "Plans, bundles and extra benefits" },
  { to: "/dashboard/members", icon: "members", label: "Members", tip: "Everyone who has joined" },
  { to: "/dashboard/payments", icon: "payments", label: "Payments", tip: "What you've earned and what's waiting" },
  { to: "/dashboard/settings", icon: "settings", label: "Settings", tip: "Studio name, page address, currency and time zone" },
];

export default function Sidebar() {
  const { studio } = useAppData();
  const initial = studio.name.trim().charAt(0).toUpperCase() || "K";

  return (
    <aside className="side">
      <div className="brand">
        <LogoMark dark />
        KlubYou
      </div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            data-tip={item.tip}
            data-tip-side="right"
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? " on" : ""}`}
          >
            <Icon name={item.icon} size={19} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="side-user">
        <span className="av">{initial}</span>
        <div>
          <b>{studio.name}</b>
          <span>klubyou.co/{studio.handle}</span>
        </div>
      </div>
    </aside>
  );
}
