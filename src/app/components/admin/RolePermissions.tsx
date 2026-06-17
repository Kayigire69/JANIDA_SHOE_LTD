import { useState } from "react";
import { Layout } from "../Layout";
import { Shield, Save } from "lucide-react";

export function RolePermissions() {
  const [permissions, setPermissions] = useState({
    "Production Manager": {
      dashboard: { view: true, edit: true, delete: false },
      production: { view: true, edit: true, delete: true },
      inventory: { view: true, edit: false, delete: false },
      quality: { view: true, edit: false, delete: false },
      batches: { view: true, edit: true, delete: true },
      orders: { view: true, edit: false, delete: false },
      users: { view: false, edit: false, delete: false },
      system: { view: false, edit: false, delete: false },
    },
    "Inventory Manager": {
      dashboard: { view: true, edit: false, delete: false },
      production: { view: true, edit: false, delete: false },
      inventory: { view: true, edit: true, delete: true },
      quality: { view: true, edit: false, delete: false },
      batches: { view: true, edit: false, delete: false },
      orders: { view: true, edit: true, delete: false },
      users: { view: false, edit: false, delete: false },
      system: { view: false, edit: false, delete: false },
    },
    "Quality Officer": {
      dashboard: { view: true, edit: false, delete: false },
      production: { view: true, edit: false, delete: false },
      inventory: { view: true, edit: false, delete: false },
      quality: { view: true, edit: true, delete: true },
      batches: { view: true, edit: true, delete: false },
      orders: { view: true, edit: false, delete: false },
      users: { view: false, edit: false, delete: false },
      system: { view: false, edit: false, delete: false },
    },
    "Sales Staff": {
      dashboard: { view: true, edit: false, delete: false },
      production: { view: true, edit: false, delete: false },
      inventory: { view: true, edit: false, delete: false },
      quality: { view: false, edit: false, delete: false },
      batches: { view: false, edit: false, delete: false },
      orders: { view: true, edit: true, delete: false },
      users: { view: false, edit: false, delete: false },
      system: { view: false, edit: false, delete: false },
    },
    Administrator: {
      dashboard: { view: true, edit: true, delete: true },
      production: { view: true, edit: true, delete: true },
      inventory: { view: true, edit: true, delete: true },
      quality: { view: true, edit: true, delete: true },
      batches: { view: true, edit: true, delete: true },
      orders: { view: true, edit: true, delete: true },
      users: { view: true, edit: true, delete: true },
      system: { view: true, edit: true, delete: true },
    },
  });

  const modules = [
    "Dashboard",
    "Production",
    "Inventory",
    "Quality",
    "Batches",
    "Orders",
    "Users",
    "System",
  ];

  const actions = ["View", "Edit", "Delete"];

  const togglePermission = (role: string, module: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role as keyof typeof prev],
        [module.toLowerCase()]: {
          ...(prev[role as keyof typeof prev] as any)[module.toLowerCase()],
          [action.toLowerCase()]: !(prev[role as keyof typeof prev] as any)[module.toLowerCase()][
            action.toLowerCase()
          ],
        },
      },
    }));
  };

  const handleSave = () => {
    console.log("Saving permissions:", permissions);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Role & Permission Management</h1>
            <p className="text-slate-600 text-sm mt-1">Configure access permissions for each role</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          {Object.keys(permissions).map((role) => (
            <div key={role} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">{role}</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                          Module
                        </th>
                        {actions.map((action) => (
                          <th
                            key={action}
                            className="text-center py-3 px-4 text-sm font-semibold text-slate-700"
                          >
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((module) => (
                        <tr key={module} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{module}</td>
                          {actions.map((action) => {
                            const moduleKey = module.toLowerCase();
                            const actionKey = action.toLowerCase();
                            const isEnabled =
                              (permissions[role as keyof typeof permissions] as any)[moduleKey][
                                actionKey
                              ];
                            return (
                              <td key={action} className="py-3 px-4 text-center">
                                <button
                                  onClick={() => togglePermission(role, module, action)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    isEnabled ? "bg-blue-600" : "bg-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      isEnabled ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
