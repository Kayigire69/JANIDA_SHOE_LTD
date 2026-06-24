import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Calendar, AlertTriangle, Users, Download, CheckCircle2, Loader2, PlayCircle, Clock, Save, X, Edit } from "lucide-react";
import { productionApi, ScheduleData, OrdersData } from "../../services/productionApi";
import { toast } from "sonner";

export function ProductionSchedule() {
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [orders, setOrders] = useState<OrdersData | null>(null);
  const [allWorkers, setAllWorkers] = useState<Array<{ id: string; name: string }>>([]);
  
  // Modals
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "night">("morning");
  const [shiftSelection, setShiftSelection] = useState<string[]>([]);
  
  const [showOptimization, setShowOptimization] = useState(false);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const [schedRes, planningRes, ordersRes] = await Promise.all([
        productionApi.getSchedule(),
        productionApi.getPlanningData(),
        productionApi.getOrders(),
      ]);
      setSchedule(schedRes);
      setAllWorkers(planningRes.workers || []);
      setOrders(ordersRes);
      console.log('Schedule data loaded:', schedRes);
      console.log('Conflicts:', schedRes.conflicts);
    } catch (err: any) {
      console.error('Failed to load schedule data:', err);
      toast.error(err.message || "Failed to load schedule data from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      const result = await productionApi.optimizeSchedule();
      setShowOptimization(true);
      await loadScheduleData();
      setTimeout(() => setShowOptimization(false), 5000);
      
      // Check if conflicts were resolved
      const conflictsCount = schedule?.conflicts?.length || 0;
      if (conflictsCount === 0) {
        toast.success("Schedule optimized successfully. No conflicts detected.");
      } else {
        toast.success(`Schedule optimized. ${conflictsCount} conflict(s) remain and may require manual resolution.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  };

  const openShiftModal = (shiftKey: "morning" | "afternoon" | "night") => {
    setSelectedShift(shiftKey);
    const currentWorkers = schedule?.shifts[shiftKey].workers || [];
    setShiftSelection([...currentWorkers]);
    setShowShiftModal(true);
  };

  const toggleWorkerSelection = (workerName: string) => {
    setShiftSelection(prev => 
      prev.includes(workerName) 
        ? prev.filter(w => w !== workerName) 
        : [...prev, workerName]
    );
  };

  const handleSaveShift = async () => {
    if (!schedule) return;
    
    // Resolve workerIds from names to sync with backend
    const matchedWorkerIds = allWorkers
      .filter((w) => shiftSelection.includes(w.name))
      .map((w) => w.id);

    try {
      setSavingShift(true);
      await productionApi.updateShiftWorkers({
        shiftName: selectedShift,
        workerIds: matchedWorkerIds,
      });
      setShowShiftModal(false);
      // Reload schedule to reflect changes
      const updatedSchedule = await productionApi.getSchedule();
      setSchedule(updatedSchedule);
      toast.success(`${schedule.shifts[selectedShift].name} updated successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update shift workers");
    } finally {
      setSavingShift(false);
    }
  };

  // Extract upcoming deadlines (in progress or planned orders, sorted by deadline)
  const activeOrders = orders?.orders.filter(o => o.status !== "Completed").sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) || [];
  
  const activeShift = schedule?.shifts[selectedShift];

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Production Schedule</h1>
            <p className="text-slate-600 text-sm mt-1">Manage production timeline, deadlines, and shifts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {optimizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Optimize Schedule
            </button>
          </div>
        </div>

        {showOptimization && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-900 mb-2">Schedule Optimization Complete</h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>✓ Machine utilization and hour allocations rebalanced</li>
                  <li>✓ Overlapping machine loads resolved</li>
                  <li>✓ Shift staffing schedules updated dynamically</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm font-medium">Fetching production schedules and dependencies...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Grid: Conflicts and Shift Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Conflicts Tracking */}
              <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 ${schedule?.conflicts && schedule.conflicts.length > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    Schedule Conflicts
                  </h3>
                  {schedule && schedule.conflicts && schedule.conflicts.length > 0 && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      {schedule.conflicts.length} Issues Detected
                    </span>
                  )}
                </div>
                <div className="p-0 flex-1 overflow-auto max-h-[300px]">
                  {!schedule?.conflicts || schedule.conflicts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                      <p className="font-medium">No schedule conflicts detected.</p>
                      <p className="text-sm mt-1">Your production plan is optimized.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-slate-700">Severity</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Shift</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Issue Details</th>
                          <th className="py-3 px-4 text-center font-semibold text-slate-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.conflicts.map((conflict, index) => (
                          <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                conflict.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {conflict.severity.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">{conflict.shift}</td>
                            <td className="py-3 px-4 text-slate-600">{conflict.issue}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={handleOptimize}
                                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors whitespace-nowrap"
                              >
                                Auto-Resolve
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Shift Management Summary */}
              <div className="bg-white rounded-xl shadow-md border border-slate-100 flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Shift Staffing Overview
                  </h3>
                </div>
                <div className="p-6 grid gap-4 flex-1">
                  {schedule && Object.entries(schedule.shifts).map(([key, shift]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-white shadow-sm group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                          ${key === "morning" ? "bg-amber-100 text-amber-700" : 
                            key === "afternoon" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"}`}
                        >
                          {key === "morning" ? "AM" : key === "afternoon" ? "PM" : "NT"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{shift.name}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {shift.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{shift.workers.length}</p>
                          <p className="text-xs text-slate-500 font-medium">Workers</p>
                        </div>
                        <button
                          onClick={() => openShiftModal(key as any)}
                          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Edit Shift"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Gantt Chart View */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Today's Production Timeline</h3>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-13 gap-px bg-slate-200 rounded-t-lg overflow-hidden mb-2">
                    <div className="bg-slate-100 p-3 font-semibold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200">Task / Product</div>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="bg-slate-100 p-3 text-center text-xs font-semibold text-slate-600">
                        {i * 2}:00
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 bg-slate-50 p-3 rounded-b-lg border border-slate-200 border-t-0">
                    {schedule?.tasks.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-6 text-center">No active production plans scheduled today.</p>
                    ) : (
                      schedule?.tasks.map((task) => (
                        <div key={task.id} className="grid grid-cols-13 gap-px items-center bg-white rounded-lg p-2 shadow-sm border border-slate-100">
                          <div className="text-sm font-semibold text-slate-800 truncate pr-2" title={task.name}>
                            {task.name}
                          </div>
                          <div className="col-span-12 relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className={`absolute h-full rounded-lg ${
                                task.status === "In Progress"
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200"
                                  : "bg-gradient-to-r from-slate-400 to-slate-500"
                              } flex items-center px-4 text-white text-xs font-semibold shadow-md transition-all hover:brightness-110 cursor-help`}
                              style={{
                                left: `${(task.start / 24) * 100}%`,
                                width: `${(task.duration / 24) * 100}%`,
                              }}
                              title={`Machine: ${task.machine} | Status: ${task.status}`}
                            >
                              <span className="truncate">{task.machine}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-600" />
                  Upcoming Production Deadlines
                </h3>
              </div>
              <div className="overflow-x-auto">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="font-medium text-lg text-slate-800">All caught up!</p>
                    <p className="text-sm mt-1">No pending active orders approaching deadline.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Plan ID</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Product</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Quantity</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Deadline</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Priority</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 uppercase tracking-wider text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.map((order) => {
                        const isUrgent = order.priority === "high" || new Date(order.deadline).getTime() - Date.now() < 86400000 * 2; // less than 2 days
                        return (
                          <tr key={order.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${isUrgent ? 'bg-red-50/30' : ''}`}>
                            <td className="py-4 px-6 font-mono font-medium text-slate-800">{order.plan_code}</td>
                            <td className="py-4 px-6 font-semibold text-slate-900">{order.product}</td>
                            <td className="py-4 px-6 text-slate-700 font-medium">
                              {order.completed} / {order.quantity}
                              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${order.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`} 
                                  style={{ width: `${(order.completed / order.quantity) * 100}%`}}
                                />
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`font-semibold ${isUrgent ? 'text-red-600 flex items-center gap-1.5' : 'text-slate-700'}`}>
                                {isUrgent && <AlertTriangle className="w-4 h-4" />}
                                {new Date(order.deadline).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                                order.priority === 'high' ? 'bg-red-100 text-red-700' : 
                                order.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {order.priority}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Edit Shift Modal */}
      {showShiftModal && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage {activeShift.name} Staffing
                </h3>
                <p className="text-blue-100 text-sm mt-1">Select workers to assign to the {activeShift.time} block.</p>
              </div>
              <button 
                onClick={() => setShowShiftModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allWorkers.map((worker) => {
                  const isSelected = shiftSelection.includes(worker.name);
                  return (
                    <div
                      key={worker.id}
                      onClick={() => toggleWorkerSelection(worker.name)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${
                        isSelected 
                          ? "border-blue-500 bg-blue-50/50" 
                          : "border-transparent bg-white hover:border-slate-200 hover:shadow-md"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{worker.name}</p>
                        <p className="text-xs text-slate-500 font-medium">Operator</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                {shiftSelection.length} workers selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShift}
                  disabled={savingShift}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center gap-2"
                >
                  {savingShift ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
