import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { PageHeaderProvider } from "../../context/PageHeaderContext";

export default function DashboardLayout() {
  return (
    <PageHeaderProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            <Outlet />
          </div>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
