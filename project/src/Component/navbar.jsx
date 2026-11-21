
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  FileText,
  Wallet,
  Users,
  Server,
  BarChart3,
  Settings,
  CircleHelp,
  MoreHorizontal,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Invoices", icon: ReceiptText, path: "/invoice" },
  { label: "Quotations", icon: FileText, path: "/Quotation" },
  { label: "Expenses", icon: Wallet, path: "/Expenses" },
  { label: "Clients", icon: Users, path: "/Clients" },
  { label: "Hosting", icon: Server, path: "/Hosting" },

];

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  setCollapsed,
}) {
  const closeSidebar = () => setSidebarOpen(false);

  const linkClass = ({ isActive }) =>
    `flex w-full items-center rounded-xl py-3 text-sm font-medium transition ${
      collapsed ? "justify-center px-2" : "gap-3 px-3"
    } ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <>
      {sidebarOpen && (
        <button
          onClick={closeSidebar}
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 ${
          collapsed ? "w-[76px]" : "w-[260px]"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div
          className={`flex h-[76px] shrink-0 items-center border-b border-slate-100 ${
            collapsed ? "justify-center px-2" : "gap-3 px-5"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            P
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                Pegal
              </h1>
              <p className="text-xs text-slate-400">
                Agency workspace
              </p>
            </div>
          )}

          <button
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Collapse button */}
        <div
          className={`flex shrink-0 py-3 ${
            collapsed ? "justify-center px-2" : "justify-end px-3"
          }`}
        >
          <button
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
          )}

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={label}
                to={path}
                end={path === "/"}
                onClick={closeSidebar}
                title={collapsed ? label : undefined}
                aria-label={label}
                className={linkClass}
              >
                <Icon size={20} className="shrink-0" strokeWidth={1.8} />

                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      {label}
                    </span>
                    {label === "Invoices" && (
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-500">
                        View
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {!collapsed && (
            <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Preferences
            </p>
          )}

          <div className={`${collapsed ? "mt-5" : ""} space-y-1`}>
            {[
              { label: "Settings", icon: Settings, path: "/settings" },
              { label: "Help & Support", icon: CircleHelp, path: "/support" },
            ].map(({ label, icon: Icon, path }) => (
              <NavLink
                key={label}
                to={path}
                onClick={closeSidebar}
                title={collapsed ? label : undefined}
                className={linkClass}
              >
                <Icon size={20} className="shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Admin profile */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div
            className={`flex items-center rounded-xl bg-slate-50 p-2 ${
              collapsed ? "justify-center" : "gap-3 px-3"
            }`}
          >
            <div
              title="Pegal Admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
            >
              PA
            </div>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    Pegal Admin
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    Administrator
                  </p>
                </div>

                <NavLink
                  to="/settings"
                  title="Admin settings"
                  aria-label="Admin settings"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <MoreHorizontal size={20} />
                </NavLink>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
