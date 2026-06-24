import { ReactNode, useState, useEffect } from "react";
import { getCurrentRole } from "../services/session";
import { clearAuthSession } from "../services/authApi";
import { dashboardApi } from "../services/dashboardApi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  CheckSquare,
  Calendar,
  Box,
  QrCode,
  Bell,
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  ShoppingCart,
  Building2,
  FileText,
  ClipboardCheck,
  MapPin,
  Award,
  AlertTriangle,
  Receipt,
  ListOrdered,
  Cog,
  Shield,
  Settings,
  Server,
  Database,
  Activity,
  Sun,
  Moon,
  Footprints,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { AIAssistant } from "./production/AIAssistant";

interface LayoutProps {
  children: ReactNode;
}

// Split nav into sections: Dashboard alone, main items, then tools (Reports/Notifications)
function groupNav(items: Array<{ path: string; icon: any; label: string }>) {
  if (items.length <= 1) return [{ title: null as string | null, items }];
  const [first, ...rest] = items;
  const toolLabels = ["Reports Center", "Notifications"];
  const main  = rest.filter((i) => !toolLabels.includes(i.label));
  const tools = rest.filter((i) =>  toolLabels.includes(i.label));
  const groups: { title: string | null; items: typeof items }[] = [
    { title: null,   items: [first] },
    { title: "Menu", items: main },
  ];
  if (tools.length > 0) groups.push({ title: "Tools", items: tools });
  return groups;
}

const ROLE_ACCENT: Record<string, string> = {
  "Production Manager": "from-blue-500 to-indigo-600",
  "Inventory Manager":  "from-emerald-500 to-teal-600",
  "Quality Officer":    "from-violet-500 to-purple-600",
  "Sales Manager":      "from-orange-500 to-amber-600",
  "Sales Staff":        "from-orange-500 to-amber-600",
  "Supervisor":         "from-sky-500 to-cyan-600",
  "Administrator":      "from-rose-500 to-red-600",
};

const ROLE_DEPT: Record<string, string> = {
  "Production Manager": "Production Department",
  "Inventory Manager":  "Inventory & Logistics",
  "Quality Officer":    "Quality Assurance",
  "Sales Manager":      "Sales & Marketing",
  "Sales Staff":        "Sales & Marketing",
  "Supervisor":         "Production Floor",
  "Administrator":      "System Administration",
};

const NAV_BY_ROLE: Record<string, Array<{ path: string; icon: any; label: string }>> = {
  "Production Manager": [
    { path: "/dashboard/production", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/production-planning",  icon: Calendar,        label: "Production Planning" },
    { path: "/production-schedule",  icon: Calendar,        label: "Schedule" },
    { path: "/production-orders",    icon: Box,             label: "Orders" },
    { path: "/production-history",   icon: Calendar,        label: "History" },
    { path: "/batch-creation",       icon: Box,             label: "Create Batch" },
    { path: "/batch-tracking",       icon: QrCode,          label: "Track Batches" },
    { path: "/admin/products",       icon: Package,         label: "Products & BOM" },
    { path: "/admin/lines",          icon: Server,          label: "Production Lines" },
    { path: "/equipment/catalog",    icon: Cog,             label: "Equipment" },
    { path: "/production/workforce", icon: Users,           label: "Workforce" },
    { path: "/reports",              icon: FileText,        label: "Reports Center" },
  ],
  "Inventory Manager": [
    { path: "/dashboard/inventory",           icon: LayoutDashboard, label: "Dashboard" },
    { path: "/inventory/raw-materials",       icon: Package,         label: "Raw Materials" },
    { path: "/inventory/stock-movement",      icon: TrendingUp,      label: "Stock Movement" },
    { path: "/inventory/suppliers",           icon: Building2,       label: "Suppliers" },
    { path: "/inventory/warehouse-locations", icon: MapPin,          label: "Warehouses" },
    { path: "/traceability",                  icon: QrCode,          label: "Traceability" },
    { path: "/reports",                       icon: FileText,        label: "Reports Center" },
  ],
  "Quality Officer": [
    { path: "/dashboard/quality",    icon: LayoutDashboard, label: "Dashboard" },
    { path: "/quality/inspection",   icon: CheckSquare,     label: "Inspection" },
    { path: "/admin/quality",        icon: ClipboardCheck,  label: "Quality Standards" },
    { path: "/quality/templates",    icon: FileText,        label: "Templates" },
    { path: "/quality/defects",      icon: AlertTriangle,   label: "Defect Tracking" },
    { path: "/quality/certificates", icon: Award,           label: "Certificates" },
    { path: "/batch-tracking",       icon: QrCode,          label: "Batch Tracking" },
    { path: "/batch-history",        icon: Calendar,        label: "Batch History" },
    { path: "/traceability",         icon: QrCode,          label: "Traceability" },
    { path: "/production-history",   icon: Calendar,        label: "Production History" },
    { path: "/workforce/directory",  icon: Users,           label: "Workforce" },
    { path: "/equipment/catalog",    icon: Cog,             label: "Equipment" },
    { path: "/security/audit",       icon: Shield,          label: "Security" },
    { path: "/reports",              icon: FileText,        label: "Reports Center" },
    { path: "/notifications",        icon: Bell,            label: "Notifications" },
  ],
  "Sales Manager": [
    { path: "/dashboard/sales",   icon: LayoutDashboard, label: "Dashboard" },
    { path: "/orders/create",     icon: ShoppingCart,    label: "Create Order" },
    { path: "/orders/manage",     icon: ListOrdered,     label: "Track Orders" },
    { path: "/orders/backorders", icon: AlertTriangle,   label: "Backorders" },
    { path: "/orders/invoices",   icon: Receipt,         label: "Invoices & Billing" },
    { path: "/reports",           icon: FileText,        label: "Reports Center" },
    { path: "/notifications",     icon: Bell,            label: "Notifications" },
  ],
  "Sales Staff": [
    { path: "/dashboard/sales",   icon: LayoutDashboard, label: "Dashboard" },
    { path: "/orders/create",     icon: ShoppingCart,    label: "Create Order" },
    { path: "/orders/manage",     icon: ListOrdered,     label: "Track Orders" },
    { path: "/orders/backorders", icon: AlertTriangle,   label: "Backorders" },
    { path: "/orders/invoices",   icon: Receipt,         label: "Invoices & Billing" },
    { path: "/reports",           icon: FileText,        label: "Reports Center" },
    { path: "/notifications",     icon: Bell,            label: "Notifications" },
  ],
  "Supervisor": [
    { path: "/dashboard/supervisor",  icon: LayoutDashboard, label: "Dashboard" },
    { path: "/workforce/tasks",       icon: CheckSquare,     label: "Tasks" },
    { path: "/workforce/scheduling",  icon: Calendar,        label: "Schedules" },
    { path: "/workforce/performance", icon: Award,           label: "Performance" },
    { path: "/workforce/directory",   icon: Users,           label: "Directory" },
    { path: "/equipment/catalog",     icon: Cog,             label: "Equipment" },
    { path: "/reports",               icon: FileText,        label: "Reports Center" },
    { path: "/notifications",         icon: Bell,            label: "Notifications" },
  ],
  "Administrator": [
    { path: "/dashboard/admin",     icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users",         icon: Users,           label: "Users" },
    { path: "/admin/roles",         icon: Shield,          label: "Roles & Permissions" },
    { path: "/admin/settings",      icon: Settings,        label: "System Settings" },
    { path: "/admin/backups",       icon: Database,        label: "Backups" },
    { path: "/admin/announcements", icon: Bell,            label: "Announcements" },
    { path: "/security/audit",      icon: Shield,          label: "Security Audit" },
    { path: "/admin/health",        icon: Activity,        label: "System Health" },
    { path: "/reports",             icon: FileText,        label: "Reports Center" },
  ],
};

export function Layout({ children }: LayoutProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const { theme, toggleTheme, companyName, logoUrl, API_BASE_URL } = useSettings();

  const fetchUnreadCount = () => {
    dashboardApi.getNotifications().then((data) => {
      const count = data.notifications.filter((n: any) => !n.read).length;
      setNotifications(count);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener("notifications_updated", fetchUnreadCount);
    return () => window.removeEventListener("notifications_updated", fetchUnreadCount);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const role      = getCurrentRole();
  const accent    = ROLE_ACCENT[role] || "from-blue-500 to-indigo-600";
  const navItems  = NAV_BY_ROLE[role] || NAV_BY_ROLE["Production Manager"];
  const navGroups = groupNav(navItems);
  const isActive  = (path: string) => location.pathname === path;
  const handleLogout = () => { clearAuthSession(); navigate("/login"); };

  /* ─── Inner sidebar ─── */
  const SidebarInner = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="flex flex-col h-full select-none">

      {/* ── Brand header ── */}
      <div className={`relative flex-shrink-0 overflow-hidden ${isCollapsed ? "px-3 py-4" : "px-5 py-5"}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-[0.08] pointer-events-none`} />
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          {/* Logo orb */}
          <div className={`relative flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg shadow-black/30 ${isCollapsed ? "w-10 h-10" : "w-11 h-11"}`}>
            {logoUrl
              ? <img src={`${API_BASE_URL}${logoUrl}`} alt="Logo" className="w-full h-full object-contain rounded-2xl p-1" />
              : <Footprints className="w-5 h-5 text-white drop-shadow" />
            }
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0f1e] shadow" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-[13px] font-bold text-white tracking-wide leading-tight truncate">{companyName}</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">ERP System</p>
            </div>
          )}
        </div>
        {/* Separator line */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* ── Role badge ── */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${accent} bg-opacity-10 border border-white/[0.07] backdrop-blur-sm`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/80 truncate">{role}</span>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/60"
        style={{ paddingLeft: isCollapsed ? "8px" : "10px", paddingRight: isCollapsed ? "8px" : "10px" }}
      >
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {/* Section label */}
            {group.title && (
              isCollapsed
                ? <div className="mx-auto mb-2 h-px w-8 bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded-full" />
                : <p className="px-3 mb-2 text-[9px] font-extrabold tracking-[0.18em] uppercase text-slate-600">{group.title}</p>
            )}

            <div className="space-y-[3px]">
              {group.items.map((item) => {
                const Icon   = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      group relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer
                      ${isCollapsed ? "justify-center py-3 px-2" : "py-2.5 px-3"}
                      ${active ? "text-white" : "text-slate-500 hover:text-slate-200"}
                    `}
                  >
                    {/* Hover bg */}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-200" />
                    )}

                    {/* Active: gradient glow bg */}
                    {active && (
                      <span className={`absolute inset-0 rounded-xl bg-gradient-to-r ${accent} opacity-[0.18]`} />
                    )}

                    {/* Active: left indicator bar */}
                    {active && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b ${accent} shadow-lg`} />
                    )}

                    {/* Icon */}
                    <span className={`
                      relative z-10 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200
                      ${isCollapsed ? "w-9 h-9" : "w-7 h-7"}
                      ${active
                        ? `bg-gradient-to-br ${accent} shadow-md shadow-black/40`
                        : "bg-transparent group-hover:bg-white/[0.07]"
                      }
                    `}>
                      <Icon className={`w-[15px] h-[15px] ${active ? "text-white" : "text-current"}`} />
                      {/* Notif dot (collapsed) */}
                      {item.label === "Notifications" && notifications > 0 && isCollapsed && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                          {notifications > 9 ? "9+" : notifications}
                        </span>
                      )}
                    </span>

                    {/* Label */}
                    {!isCollapsed && (
                      <span className={`relative z-10 text-[13px] font-semibold truncate ${active ? "text-white" : ""}`}>
                        {item.label}
                      </span>
                    )}

                    {/* Notif badge (expanded) */}
                    {item.label === "Notifications" && notifications > 0 && !isCollapsed && (
                      <span className="ml-auto relative z-10 flex-shrink-0 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 leading-none shadow shadow-red-500/40">
                        {notifications > 99 ? "99+" : notifications}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle (desktop only) ── */}
      <div className={`flex-shrink-0 border-t border-white/[0.05] ${isCollapsed ? "p-2" : "px-3 py-2"}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            hidden md:flex w-full items-center gap-3 rounded-xl px-3 py-2.5
            text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]
            transition-all duration-200
            ${isCollapsed ? "justify-center" : ""}
          `}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </span>
          {!isCollapsed && <span className="text-[12px] font-semibold">Collapse</span>}
        </button>
      </div>

      {/* ── User footer ── */}
      <div className={`flex-shrink-0 border-t border-white/[0.05] ${isCollapsed ? "p-2" : "p-3"}`}>
        <div className={`
          flex items-center gap-3 rounded-xl border border-white/[0.06]
          bg-white/[0.03] hover:bg-white/[0.06] transition-colors duration-200
          ${isCollapsed ? "p-2 justify-center" : "p-2.5"}
        `}>
          {/* Avatar */}
          <div className={`relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow ${isCollapsed ? "w-9 h-9" : "w-8 h-8"}`}>
            <User className="w-4 h-4 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0f1e]" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white/90 leading-tight truncate">My Account</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="mt-1.5 w-full flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-72 flex flex-col
          bg-[#0a0f1e] text-white shadow-2xl
          transition-transform duration-300 ease-in-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarInner isCollapsed={false} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0
          bg-[#0a0f1e] text-white
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
        `}
        style={{ minHeight: "100vh" }}
      >
        <SidebarInner isCollapsed={collapsed} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 flex-shrink-0 transition-colors">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate">{role}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {ROLE_DEPT[role] || "Smart Shoe Factory"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
              </button>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications > 99 ? "99+" : notifications}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2 md:px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-300" />
                <span className="hidden sm:block text-sm font-medium text-slate-900 dark:text-white">Profile</span>
              </Link>

              {/* Logout desktop */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>

              {/* Logout mobile */}
              <button
                onClick={handleLogout}
                className="sm:hidden p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* AI Assistant (Production Manager only) */}
        {role === "Production Manager" && <AIAssistant />}
      </div>
    </div>
  );
}
