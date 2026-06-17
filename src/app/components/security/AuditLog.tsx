import { useState } from "react";
import { Layout } from "../Layout";
import { FileText, Download, Filter, Search } from "lucide-react";

export function AuditLog() {
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const auditEntries = [
    {
      id: 1,
      user: "John Anderson",
      action: "Created",
      module: "Batch",
      details: "Created new batch BTH-001235",
      timestamp: "2026-05-02 14:45:22",
      ip: "192.168.1.105",
    },
    {
      id: 2,
      user: "Sarah Williams",
      action: "Updated",
      module: "Inventory",
      details: "Updated stock levels for Premium Leather",
      timestamp: "2026-05-02 14:32:18",
      ip: "192.168.1.87",
    },
    {
      id: 3,
      user: "Admin",
      action: "Modified",
      module: "Users",
      details: "Changed permissions for Production Manager role",
      timestamp: "2026-05-02 13:15:45",
      ip: "192.168.1.1",
    },
    {
      id: 4,
      user: "Mike Johnson",
      action: "Completed",
      module: "Quality",
      details: "Completed quality inspection for BTH-001234",
      timestamp: "2026-05-02 12:58:33",
      ip: "192.168.1.92",
    },
    {
      id: 5,
      user: "Emily Chen",
      action: "Created",
      module: "Orders",
      details: "Created sales order ORD-1005",
      timestamp: "2026-05-02 11:42:12",
      ip: "192.168.1.112",
    },
    {
      id: 6,
      user: "Admin",
      action: "Deleted",
      module: "Production",
      details: "Deleted production order PO-2026-099",
      timestamp: "2026-05-02 10:25:08",
      ip: "192.168.1.1",
    },
  ];

  const modules = ["All", "Batch", "Inventory", "Quality", "Orders", "Users", "Production", "System"];
  const actions = ["All", "Created", "Updated", "Deleted", "Modified", "Completed"];

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesModule = filterModule === "all" || entry.module === filterModule;
    const matchesAction = filterAction === "all" || entry.action === filterAction;
    const matchesSearch =
      searchTerm === "" ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "Created":
        return "bg-emerald-100 text-emerald-700";
      case "Updated":
      case "Modified":
        return "bg-blue-100 text-blue-700";
      case "Deleted":
        return "bg-red-100 text-red-700";
      case "Completed":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Audit Log</h1>
            <p className="text-slate-600 text-sm mt-1">Complete history of system activities</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg font-medium hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user or action..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modules.map((module) => (
                  <option key={module} value={module.toLowerCase()}>
                    {module}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {actions.map((action) => (
                <option key={action} value={action.toLowerCase()}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Module
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-700 font-mono">
                      {entry.timestamp}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.user}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{entry.module}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{entry.details}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 font-mono">{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No audit entries found matching your criteria</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-blue-900 font-medium">
                Showing {filteredEntries.length} of {auditEntries.length} entries
              </p>
              <p className="text-sm text-blue-800 mt-1">
                All actions are logged and stored for 365 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
