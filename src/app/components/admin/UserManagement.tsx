import { useState } from "react";
import { Layout } from "../Layout";
import { UserPlus, Edit, Lock, Unlock, Search, Filter } from "lucide-react";

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const users = [
    {
      id: 1,
      name: "John Anderson",
      email: "john.anderson@smartshoe.com",
      role: "Production Manager",
      department: "Production",
      status: "active",
    },
    {
      id: 2,
      name: "Sarah Williams",
      email: "sarah.williams@smartshoe.com",
      role: "Quality Officer",
      department: "Quality Assurance",
      status: "active",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@smartshoe.com",
      role: "Inventory Manager",
      department: "Inventory & Logistics",
      status: "active",
    },
    {
      id: 4,
      name: "Emily Chen",
      email: "emily.chen@smartshoe.com",
      role: "Sales Staff",
      department: "Sales & Marketing",
      status: "inactive",
    },
    {
      id: 5,
      name: "Tom Brown",
      email: "tom.brown@smartshoe.com",
      role: "Administrator",
      department: "IT & Administration",
      status: "active",
    },
  ];

  const roles = ["All Roles", "Production Manager", "Inventory Manager", "Quality Officer", "Sales Staff", "Administrator"];

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
            <p className="text-slate-600 text-sm mt-1">Manage system users and access control</p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.slice(1).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{user.role}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{user.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.status === "active" ? (
                          <button className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No users found matching your criteria</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-blue-900 font-medium">Total Users: {users.length}</p>
              <p className="text-sm text-blue-800 mt-1">
                Active: {users.filter((u) => u.status === "active").length} | Inactive:{" "}
                {users.filter((u) => u.status === "inactive").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
