import { ReactNode, useState } from "react";
import { getCurrentRole } from "../services/session";
import { clearAuthSession } from "../services/authApi";
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
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications] = useState(3);

  // Always read the authenticated role from localStorage via shared session utility
  const currentUserRole = getCurrentRole();

  // Role-based navigation items
  const navigationByRole: Record<string, Array<{ path: string; icon: any; label: string }>> = {
    "Production Manager": [
      { path: "/dashboard/production", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/production-planning", icon: Calendar, label: "Production Planning" },
      { path: "/production-schedule", icon: Calendar, label: "Schedule" },
      { path: "/production-orders", icon: Box, label: "Orders" },
      { path: "/production-history", icon: Calendar, label: "History" },
      { path: "/batch-creation", icon: Box, label: "Create Batch" },
      { path: "/batch-tracking", icon: QrCode, label: "Track Batches" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Inventory Manager": [
      { path: "/dashboard/inventory", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/inventory/raw-materials", icon: Package, label: "Raw Materials" },
      { path: "/inventory/finished-goods", icon: Box, label: "Finished Goods" },
      { path: "/inventory/stock-movement", icon: TrendingUp, label: "Stock Movement" },
      { path: "/inventory/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
      { path: "/inventory/suppliers", icon: Building2, label: "Suppliers" },
      { path: "/inventory/warehouse-locations", icon: MapPin, label: "Warehouses" },
      { path: "/traceability", icon: QrCode, label: "Traceability" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Quality Officer": [
      { path: "/dashboard/quality", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/quality/inspection", icon: CheckSquare, label: "Inspection" },
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
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
    "Administrator": [
      { path: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/production-planning", icon: Calendar, label: "Production" },
      { path: "/inventory/raw-materials", icon: Package, label: "Inventory" },
      { path: "/quality/inspection", icon: CheckSquare, label: "Quality" },
      { path: "/orders/create", icon: ShoppingCart, label: "Orders" },
      { path: "/workforce/directory", icon: Users, label: "Workforce" },
      { path: "/equipment/catalog", icon: Cog, label: "Equipment" },
      { path: "/security/audit", icon: Shield, label: "Security" },
      { path: "/admin", icon: Settings, label: "Admin" },
      { path: "/traceability", icon: QrCode, label: "Traceability" },
      { path: "/notifications", icon: Bell, label: "Notifications" },
    ],
  };

  const navItems = navigationByRole[currentUserRole] || navigationByRole["Production Manager"];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        } flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700">
          {!sidebarCollapsed ? (
            <div>
              <h1 className="text-xl font-semibold">Smart Shoe Factory</h1>
              <p className="text-slate-400 text-xs mt-1">Management System</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-400">SF</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-4 border-t border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{currentUserRole}</h2>
              <p className="text-sm text-slate-600">
                {currentUserRole === "Production Manager" ? "Production Department" :
                 currentUserRole === "Inventory Manager" ? "Inventory & Logistics" :
                 currentUserRole === "Quality Officer" ? "Quality Assurance" :
                 currentUserRole === "Sales Manager" ? "Sales & Marketing" :
                 "System Administration"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/notifications"
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
