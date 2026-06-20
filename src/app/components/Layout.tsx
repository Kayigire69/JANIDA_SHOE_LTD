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
  ClockAlert,
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
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { AIAssistant } from "./production/AIAssistant";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    window.addEventListener('notifications_updated', fetchUnreadCount);
    return () => window.removeEventListener('notifications_updated', fetchUnreadCount);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentUserRole = getCurrentRole();

  const navigationByRole: Record<string, Array<{ path: string; icon: any; label: string }>> = {
    "Production Manager": [
      { path: "/dashboard/production", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/production-planning", icon: Calendar, label: "Production Planning" },
      { path: "/production-schedule", icon: Calendar, label: "Schedule" },
      { path: "/production-orders", icon: Box, label: "Orders" },
      { path: "/production-history", icon: Calendar, label: "History" },
      { path: "/batch-creation", icon: Box, label: "Create Batch" },
      { path: "/batch-tracking", icon: QrCode, label: "Track Batches" },
      { path: "/admin/products", icon: Package, label: "Products & BOM" },
      { path: "/admin/lines", icon: Server, label: "Production Lines" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
    ],
    "Inventory Manager": [
      { path: "/dashboard/inventory", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/inventory/raw-materials", icon: Package, label: "Raw Materials" },
      { path: "/admin/products", icon: Package, label: "Products & BOM" },
      { path: "/inventory/finished-goods", icon: Box, label: "Finished Goods" },
      { path: "/inventory/stock-movement", icon: TrendingUp, label: "Stock Movement" },
      { path: "/inventory/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
      { path: "/inventory/suppliers", icon: Building2, label: "Suppliers" },
      { path: "/inventory/warehouse-locations", icon: MapPin, label: "Warehouses" },
      { path: "/traceability", icon: QrCode, label: "Traceability" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Quality Officer": [
      { path: "/dashboard/quality", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/quality/inspection", icon: CheckSquare, label: "Inspection" },
      { path: "/admin/quality", icon: ClipboardCheck, label: "Quality Standards" },
      { path: "/quality/templates", icon: FileText, label: "Templates" },
      { path: "/quality/defects", icon: AlertTriangle, label: "Defect Tracking" },
      { path: "/quality/certificates", icon: Award, label: "Certificates" },
      { path: "/batch-tracking", icon: QrCode, label: "Batch Tracking" },
      { path: "/batch-history", icon: Calendar, label: "Batch History" },
      { path: "/traceability", icon: QrCode, label: "Traceability" },
      { path: "/production-history", icon: Calendar, label: "Production History" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Sales Manager": [
      { path: "/dashboard/sales", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/orders/create", icon: ShoppingCart, label: "Create Order" },
      { path: "/orders/manage", icon: ListOrdered, label: "Track Orders" },
      { path: "/orders/backorders", icon: AlertTriangle, label: "Backorders" },
      { path: "/orders/invoices", icon: Receipt, label: "Invoices & Billing" },
      { path: "/inventory/finished-goods", icon: Package, label: "Inventory Status" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Supervisor": [
      { path: "/dashboard/supervisor", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/workforce/tasks", icon: CheckSquare, label: "Tasks" },
      { path: "/workforce/scheduling", icon: Calendar, label: "Schedules" },
      { path: "/workforce/performance", icon: Award, label: "Performance" },
      { path: "/workforce/directory", icon: Users, label: "Directory" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Administrator": [
      { path: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/admin/users", icon: Users, label: "Users" },
      { path: "/admin/roles", icon: Shield, label: "Roles & Permissions" },
      { path: "/admin/settings", icon: Settings, label: "System Settings" },
      { path: "/admin/backups", icon: Database, label: "Backups" },
      { path: "/admin/announcements", icon: Bell, label: "Announcements" },
      { path: "/security/audit", icon: Shield, label: "Security Audit" },
      { path: "/admin/health", icon: Activity, label: "System Health" },
      { path: "/reports", icon: FileText, label: "Reports Center" },
    ],
  };

  const navItems = navigationByRole[currentUserRole] || navigationByRole["Production Manager"];
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div className="p-5 border-b border-slate-700 flex items-center gap-3">
        {logoUrl ? (
          <img src={`${API_BASE_URL}${logoUrl}`} alt="Logo" className="w-8 h-8 object-contain rounded-md bg-white p-0.5 flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md text-white font-bold text-lg flex-shrink-0">
            {companyName.charAt(0)}
          </div>
        )}
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-semibold break-words leading-tight">{companyName}</h1>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(item.path)
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex p-4 border-t border-slate-700 hover:bg-slate-700 transition-colors items-center justify-center"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (slide-in drawer) */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-72 flex flex-col
          bg-gradient-to-b from-slate-800 to-slate-900 text-white
          transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={`${API_BASE_URL}${logoUrl}`} alt="Logo" className="w-8 h-8 object-contain rounded-md bg-white p-0.5 flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-md text-white font-bold text-lg flex-shrink-0">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="text-base font-semibold truncate">{companyName}</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col
          bg-gradient-to-b from-slate-800 to-slate-900 text-white
          transition-all duration-300
          ${sidebarCollapsed ? "w-20" : "w-64"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 transition-colors flex-shrink-0">
          <div className="flex items-center justify-between gap-3">

            {/* Left: Hamburger (mobile) + Role Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger button - only on mobile */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate">{currentUserRole}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {currentUserRole === "Production Manager" ? "Production Department" :
                   currentUserRole === "Inventory Manager" ? "Inventory & Logistics" :
                   currentUserRole === "Quality Officer" ? "Quality Assurance" :
                   currentUserRole === "Sales Staff" ? "Sales & Marketing" :
                   currentUserRole === "Supervisor" ? "Production Floor" :
                   "System Administration"}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
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

              {/* Profile - show only icon on mobile */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2 md:px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-300" />
                <span className="hidden sm:block text-sm font-medium text-slate-900 dark:text-white">Profile</span>
              </Link>

              {/* Logout - show only on tablet+ */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>

              {/* Logout icon only on mobile */}
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
        
        {/* Production Manager AI Assistant */}
        {currentUserRole === "Production Manager" && <AIAssistant />}
      </div>
    </div>
  );
}
