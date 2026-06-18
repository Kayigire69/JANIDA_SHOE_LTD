import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Plus, Search, Loader2, CheckCircle2, Clock, AlertCircle, X, BarChart3, ClipboardCheck } from "lucide-react";
import { workforceApi } from "../../services/workforceApi";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";

export function TaskManagement() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", employeeId: "", dueDate: "" });
  
  useEffect(() => {
    fetchTasks();
    workforceApi.listEmployees().then(res => setEmployees(res.employees)).catch(() => {});
  }, []);

  const fetchTasks = () => {
    setLoading(true);
    workforceApi.listTasks()
      .then(res => setTasks(res.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workforceApi.createTask(newTask);
      setShowModal(false);
      setNewTask({ title: "", description: "", priority: "medium", employeeId: "", dueDate: "" });
      fetchTasks();
    } catch (err) {
      alert("Failed to create task");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await workforceApi.updateTaskStatus(id, status);
      fetchTasks();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Task Management Report"],
      [""],
      ["Task ID", "Title", "Employee ID", "Priority", "Status", "Due Date", "Created At"],
      ...tasks.map(t => [t.id.substring(0,8), t.title, t.employee_id, t.priority, t.status, t.due_date, t.created_at])
    ];
    exportToCSV("tasks_report", rows);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Task Management</h1>
            <p className="text-slate-600 text-sm mt-1">Assign and monitor workforce tasks</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900">
              <ClipboardCheck className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              <BarChart3 className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No tasks found.</td></tr>
                ) : tasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">{task.title}</td>
                    <td className="px-4 py-4">{employees.find(e => e.id === task.employee_id)?.fullName || task.employee_id}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                        className="bg-transparent text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" /> Assign Task
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <select required value={newTask.employeeId} onChange={e => setNewTask({...newTask, employeeId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-md">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
