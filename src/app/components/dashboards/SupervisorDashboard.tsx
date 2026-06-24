import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../Layout";
import { SystemAnnouncement } from "../common/SystemAnnouncement";
import { CheckSquare, Calendar, Award, Users, Clock, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { dashboardApi } from "../../services/dashboardApi";
import { workforceApi } from "../../services/workforceApi";

export function SupervisorDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardData, employeesData, tasksData] = await Promise.all([
          dashboardApi.getDashboard(),
          workforceApi.listEmployees(),
          workforceApi.listTasks()
        ]);
        setEmployees(employeesData.employees || []);
        setTasks(tasksData.tasks || []);
        setAnnouncements(dashboardData.announcements || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onLeaveEmployees = employees.filter(e => e.status === 'on_leave').length;
  const pendingTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-8">
        {announcements.map((item: any) => (
          <SystemAnnouncement key={item.id} message={item.message} type={item.type} />
        ))}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Supervisor Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your team, tasks, and shift assignments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Active Employees</p>
                <p className="text-3xl font-bold text-slate-900">{activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">On Leave</p>
                <p className="text-3xl font-bold text-slate-900">{onLeaveEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending Tasks</p>
                <p className="text-3xl font-bold text-slate-900">{pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Completed Tasks</p>
                <p className="text-3xl font-bold text-slate-900">{completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/workforce/tasks" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Assign Tasks</p>
                <p className="text-sm text-slate-500">Create and assign work</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link 
              to="/workforce/scheduling" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Manage Shifts</p>
                <p className="text-sm text-slate-500">View and edit schedules</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link 
              to="/workforce/performance" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Performance</p>
                <p className="text-sm text-slate-500">Review team metrics</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Tasks</h2>
              <Link to="/workforce/tasks" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    task.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{task.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-slate-500">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No tasks assigned yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Team Overview</h2>
              <Link to="/workforce/directory" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {employees.slice(0, 5).map((employee: any) => (
                <div key={employee.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {employee.fullName?.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{employee.fullName}</p>
                    <p className="text-sm text-slate-500">{employee.role}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    employee.status === 'on_leave' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {employee.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No employees in your team</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(onLeaveEmployees > 0 || pendingTasks > 5) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Attention Required</h3>
                <div className="mt-2 space-y-1 text-sm text-amber-800">
                  {onLeaveEmployees > 0 && <p>• {onLeaveEmployees} employee(s) currently on leave</p>}
                  {pendingTasks > 5 && <p>• {pendingTasks} pending tasks need attention</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
