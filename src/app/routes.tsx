import { createBrowserRouter, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { Registration } from "./components/Registration";
import { Login } from "./components/Login";
import { EmailVerification } from "./components/EmailVerification";
import { PasswordRecovery } from "./components/PasswordRecovery";
import { PasswordReset } from "./components/PasswordReset";
import { MFASetup } from "./components/MFASetup";
import { ProfileManagement } from "./components/ProfileManagement";
import { PendingApproval } from "./components/PendingApproval";
import { ProductionManagerDashboard } from "./components/dashboards/ProductionManagerDashboard";
import { InventoryManagerDashboard } from "./components/dashboards/InventoryManagerDashboard";
import { QualityOfficerDashboard } from "./components/dashboards/QualityOfficerDashboard";
import { SalesAdminDashboard } from "./components/dashboards/SalesAdminDashboard";
import { AdministratorDashboard } from "./components/dashboards/AdministratorDashboard";
import { SupervisorDashboard } from "./components/dashboards/SupervisorDashboard";
import { dashboardPaths } from "./services/authApi";
import { ProductionPlanning } from "./components/production/ProductionPlanning";
import { ProductionSchedule } from "./components/production/ProductionSchedule";
import { ProductionOrders } from "./components/production/ProductionOrders";
import { ProductionHistory } from "./components/production/ProductionHistory";
import { BatchCreation } from "./components/batch/BatchCreation";
import { BatchTracking } from "./components/batch/BatchTracking";
import { Traceability } from "./components/batch/Traceability";
import { RawMaterials } from "./components/inventory/RawMaterials";
import { StockMovement } from "./components/inventory/StockMovement";
import { SupplierManagement } from "./components/inventory/SupplierManagement";
import { PurchaseOrders } from "./components/inventory/PurchaseOrders";
import { FinishedGoodsInventory } from "./components/inventory/FinishedGoodsInventory";
import { WarehouseLocations } from "./components/inventory/WarehouseLocations";
import { Inspection } from "./components/quality/Inspection";
import { QualityCertificates } from "./components/quality/QualityCertificates";
import { DefectTracking } from "./components/quality/DefectTracking";
import { InspectionHistory } from "./components/quality/InspectionHistory";
import { QualityTemplates } from "./components/quality/QualityTemplates";
import { CreateOrder } from "./components/orders/CreateOrder";
import { OrderTracker } from "./components/orders/OrderTracker";
import { BackorderLog } from "./components/orders/BackorderLog";
import { InvoiceLog } from "./components/orders/InvoiceLog";
import { WorkforceDirectory } from "./components/workforce/Directory";
import { ShiftScheduling } from "./components/workforce/ShiftScheduling";
import { TaskManagement } from "./components/workforce/TaskManagement";
import { PerformanceReviews } from "./components/workforce/PerformanceReviews";
import { EquipmentCatalog } from "./components/equipment/EquipmentCatalog";
import { SecurityAudit } from "./components/security/SecurityAudit";
import { AdminPanel } from "./components/admin/AdminPanel";
import { NotificationCenter } from "./components/notifications/NotificationCenter";

/** Reads the stored role and redirects to the correct role dashboard. */
function RoleRedirect() {
  const userRaw = localStorage.getItem("authUser");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const path = user?.role ? dashboardPaths[user.role] : "/login";
  return <Navigate to={path} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Registration,
  },
  {
    path: "/verify-email",
    Component: EmailVerification,
  },
  {
    path: "/password-recovery",
    Component: PasswordRecovery,
  },
  {
    path: "/password-reset",
    Component: PasswordReset,
  },
  {
    path: "/mfa-setup",
    Component: MFASetup,
  },
  {
    path: "/profile",
    Component: ProfileManagement,
  },
  {
    path: "/dashboard",
    Component: RoleRedirect,
  },
  {
    path: "/pending-approval",
    Component: PendingApproval,
  },
  {
    path: "/dashboard/production",
    Component: ProductionManagerDashboard,
  },
  {
    path: "/dashboard/inventory",
    Component: InventoryManagerDashboard,
  },
  {
    path: "/dashboard/quality",
    Component: QualityOfficerDashboard,
  },
  {
    path: "/dashboard/sales",
    Component: SalesAdminDashboard,
  },
  {
    path: "/dashboard/admin",
    Component: AdministratorDashboard,
  },
  {
    path: "/dashboard/supervisor",
    Component: SupervisorDashboard,
  },
  {
    path: "/production-planning",
    Component: ProductionPlanning,
  },
  {
    path: "/production-schedule",
    Component: ProductionSchedule,
  },
  {
    path: "/production-orders",
    Component: ProductionOrders,
  },
  {
    path: "/production-history",
    Component: ProductionHistory,
  },
  {
    path: "/batch-creation",
    Component: BatchCreation,
  },
  {
    path: "/batch-tracking",
    Component: BatchTracking,
  },
  {
    path: "/traceability",
    Component: Traceability,
  },
  {
    path: "/inventory/raw-materials",
    Component: RawMaterials,
  },
  {
    path: "/inventory/stock-movement",
    Component: StockMovement,
  },
  {
    path: "/inventory/suppliers",
    Component: SupplierManagement,
  },
  {
    path: "/inventory/purchase-orders",
    Component: PurchaseOrders,
  },
  {
    path: "/inventory/finished-goods",
    Component: FinishedGoodsInventory,
  },
  {
    path: "/inventory/warehouse-locations",
    Component: WarehouseLocations,
  },
  {
    path: "/quality/inspection",
    Component: Inspection,
  },
  {
    path: "/quality/certificates",
    Component: QualityCertificates,
  },
  {
    path: "/quality/defects",
    Component: DefectTracking,
  },
  {
    path: "/quality/history",
    Component: InspectionHistory,
  },
  {
    path: "/quality/templates",
    Component: QualityTemplates,
  },
  {
    path: "/orders/create",
    Component: CreateOrder,
  },
  {
    path: "/orders/manage",
    Component: OrderTracker,
  },
  {
    path: "/orders/backorders",
    Component: BackorderLog,
  },
  {
    path: "/orders/invoices",
    Component: InvoiceLog,
  },
  {
    path: "/workforce/directory",
    Component: WorkforceDirectory,
  },
  {
    path: "/workforce/scheduling",
    Component: ShiftScheduling,
  },
  {
    path: "/workforce/tasks",
    Component: TaskManagement,
  },
  {
    path: "/workforce/performance",
    Component: PerformanceReviews,
  },
  {
    path: "/equipment/catalog",
    Component: EquipmentCatalog,
  },
  {
    path: "/security/audit",
    Component: SecurityAudit,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
  {
    path: "/notifications",
    Component: NotificationCenter,
  },
]);
