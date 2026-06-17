import { useState } from "react";
import { Layout } from "../Layout";
import { Search, Users, Plus } from "lucide-react";

export function EmployeeDirectory() {
  const [searchQuery, setSearchQuery] = useState("");

  const employees = [
    { id: 1, name: "John Anderson", role: "Production Manager", department: "Production", shift: "Morning", email: "j.anderson@factory.com" },
    { id: 2, name: "Jane Smith", role: "Quality Inspector", department: "Quality Assurance", shift: "Afternoon", email: "j.smith@factory.com" },
    { id: 3, name: "Mike Johnson", role: "Machine Operator", department: "Production", shift: "Morning", email: "m.johnson@factory.com" },
    { id: 4, name: "Sarah Williams", role: "Inventory Supervisor", department: "Inventory", shift: "Morning", email: "s.williams@factory.com" },
    { id: 5, name: "Tom Brown", role: "Maintenance Tech", department: "Maintenance", shift: "Night", email: "t.brown@factory.com" },
  ];

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Employee Directory</h1>
            <p className="text-slate-600 text-sm mt-1">Manage workforce information</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, or department..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{employee.name}</h3>
                    <p className="text-sm text-slate-600">{employee.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-xs text-slate-600">Department</p>
                    <p className="font-medium text-slate-900">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Shift</p>
                    <p className="font-medium text-slate-900">{employee.shift}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">{employee.email}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
