import { useEffect, useMemo, useState } from "react";
import { Layout } from "../Layout";
import { Users, Search, Mail, Phone, Building2, UserPlus, X, Loader2, Briefcase, CalendarDays, BadgeDollarSign, AlertCircle, Edit } from "lucide-react";
import { workforceApi } from "../../services/workforceApi";
import { productionApi } from "../../services/productionApi";
import { toast } from "sonner";

const shifts = ["all", "morning", "afternoon", "night", "flex"];
const statuses = ["all", "active", "inactive", "on_leave", "terminated"];

export function WorkforceDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const [form, setForm] = useState({
    employeeCode: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    shift: "morning",
    skills: "",
    hourlyRate: "",
    hireDate: "",
    emergencyContact: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterDepartment !== "all") params.department = filterDepartment;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterShift !== "all") params.shift = filterShift;
      
      const [workforceData, productionData] = await Promise.all([
        workforceApi.listEmployees(params).catch(() => ({ employees: [] })),
        productionApi.listProductionWorkers().catch(() => ({ workers: [] }))
      ]);
      
      // Merge workforce employees with production workers
      const workforceEmployees = (workforceData.employees || []).map((emp: any) => ({
        ...emp,
        source: 'workforce'
      }));
      
      const productionWorkers = (productionData.workers || []).map((worker: any) => ({
        id: worker.id || worker.worker_id,
        fullName: worker.name,
        employeeCode: worker.worker_id || worker.id,
        email: worker.email || '-',
        phone: worker.phone || '-',
        role: worker.role || 'Operator',
        department: worker.department || 'Production',
        shift: worker.shift || 'morning',
        status: 'active',
        hourlyRate: worker.hourly_rate || 0,
        hireDate: worker.hire_date || null,
        source: 'production'
      }));
      
      setEmployees([...workforceEmployees, ...productionWorkers]);
    } catch (err: any) {
      setError(err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await workforceApi.departments();
      setDepartments(data.departments || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterDepartment, filterStatus, filterShift]);

  const metrics = useMemo(() => {
    const total = employees.length;
    const production = employees.filter(e => e.department?.toLowerCase().includes("production")).length;
    const quality = employees.filter(e => e.department?.toLowerCase().includes("quality")).length;
    const other = total - production - quality;
    return { total, production, quality, other };
  }, [employees]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.employeeCode.trim()) errs.employeeCode = "Required";
    if (!form.fullName.trim()) errs.fullName = "Required";
    if (!form.email.trim()) errs.email = "Required";
    if (!form.role.trim()) errs.role = "Required";
    if (!form.department.trim()) errs.department = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openEditModal = (employee: any) => {
    setEditingEmployee(employee);
    setForm({
      employeeCode: employee.employeeCode || "",
      fullName: employee.fullName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
      department: employee.department || "",
      shift: employee.shift || "morning",
      skills: employee.skills?.join(", ") || "",
      hourlyRate: employee.hourlyRate?.toString() || "",
      hireDate: employee.hireDate || "",
      emergencyContact: employee.emergencyContact || "",
    });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      if (editingEmployee) {
        // Update existing employee
        await workforceApi.updateEmployee(editingEmployee.id, {
          employeeCode: form.employeeCode.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role.trim(),
          department: form.department.trim(),
          shift: form.shift,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          hourlyRate: Number(form.hourlyRate) || 0,
          hireDate: form.hireDate || undefined,
          emergencyContact: form.emergencyContact.trim() || undefined,
        });
        toast.success("Employee updated successfully");
      } else {
        // Create new employee
        await workforceApi.createEmployee({
          employeeCode: form.employeeCode.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role.trim(),
          department: form.department.trim(),
          shift: form.shift,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          hourlyRate: Number(form.hourlyRate) || 0,
          hireDate: form.hireDate || undefined,
          emergencyContact: form.emergencyContact.trim() || undefined,
        });
        toast.success("Employee created successfully");
      }
      setShowModal(false);
      setEditingEmployee(null);
      setForm({
        employeeCode: "",
        fullName: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        shift: "morning",
        skills: "",
        hourlyRate: "",
        hireDate: "",
        emergencyContact: "",
      });
      fetchEmployees();
    } catch (err: any) {
      setError(err?.message || editingEmployee ? "Failed to update employee" : "Failed to create employee");
      toast.error(err?.message || editingEmployee ? "Failed to update employee" : "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      inactive: "bg-slate-100 text-slate-700",
      on_leave: "bg-amber-100 text-amber-700",
      terminated: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Workforce Directory</h1>
            <p className="text-slate-600 text-sm mt-1">Create and manage employees</p>
          </div>
          <button
            onClick={() => { setEditingEmployee(null); setShowModal(true); setError(""); }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Production</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.production}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Quality</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.quality}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Other Depts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.other}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or employee code..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {shifts.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All Shifts" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="text-center py-12 text-slate-500">No employees found. Create one to get started.</div>
          )}

          {!loading && employees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Hourly Rate</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {emp.fullName?.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <span className="font-medium text-slate-900">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{emp.employeeCode}</td>
                      <td className="px-4 py-4">{emp.role}</td>
                      <td className="px-4 py-4">{emp.department}</td>
                      <td className="px-4 py-4 capitalize">{emp.shift}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(emp.status)}`}>
                          {emp.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">{emp.email}</td>
                      <td className="px-4 py-4">{emp.phone || '-'}</td>
                      <td className="px-4 py-4">{emp.hourlyRate > 0 ? `RWF ${emp.hourlyRate}/hr` : '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          emp.source === 'production' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {emp.source || 'workforce'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {emp.source === 'workforce' && (
                          <button
                            onClick={() => openEditModal(emp)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        {emp.source === 'production' && (
                          <span className="text-xs text-slate-400 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button 
                onClick={() => { 
                  setShowModal(false); 
                  setEditingEmployee(null); 
                }} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
                  <input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.employeeCode ? "border-red-300" : "border-slate-200"}`} placeholder="EMP-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? "border-red-300" : "border-slate-200"}`} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? "border-red-300" : "border-slate-200"}`} placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 555-0100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.role ? "border-red-300" : "border-slate-200"}`} placeholder="Production Operator" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select 
                    value={form.department} 
                    onChange={(e) => setForm({ ...form, department: e.target.value })} 
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.department ? "border-red-300" : "border-slate-200"}`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                  <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                    <option value="flex">Flex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate</label>
                  <input type="number" min={0} step={0.01} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hire Date</label>
                  <input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                  <input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jane Doe +1 555-0200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Stitching, Quality Control, Machine Operation" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditingEmployee(null); 
                  }} 
                  className="px-5 py-2.5 text-slate-700 bg-slate-100 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEmployee ? "Update Employee" : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
