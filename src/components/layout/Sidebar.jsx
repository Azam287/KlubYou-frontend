import { NavLink } from "react-router-dom";
import Icon from "../common/Icon";
import { LogoMark } from "../common/Brand";
import { useAppData } from "../../context/AppDataContext";

const NAV_ITEMS = [
  { to: "/dashboard", end: true, icon: "overview", label: "Overview" },
  { to: "/dashboard/page", icon: "page", label: "My page" },
  { to: "/dashboard/programmes", icon: "programmes", label: "Programmes" },
  { to: "/dashboard/members", icon: "members", label: "Members" },
  { to: "/dashboard/payments", icon: "payments", label: "Payments" },
  { to: "/dashboard/classes", icon: "classes", label: "Classes" },
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
