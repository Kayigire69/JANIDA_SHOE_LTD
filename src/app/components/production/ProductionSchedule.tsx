import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Calendar, AlertTriangle, Users, Download, Plus, CheckCircle2, Loader2, Save } from "lucide-react";
import { productionApi, ScheduleData } from "../../services/productionApi";

export function ProductionSchedule() {
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [allWorkers, setAllWorkers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "night">("morning");
  const [showOptimization, setShowOptimization] = useState(false);
  const [error, setError] = useState("");

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const [schedRes, planningRes] = await Promise.all([
        productionApi.getSchedule(),
        productionApi.getPlanningData(),
      ]);
      setSchedule(schedRes);
      setAllWorkers(planningRes.workers);
    } catch (err: any) {
      setError(err.message || "Failed to load schedule from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  const handleExportSchedule = () => {
    if (!schedule) return;
    const dataStr = JSON.stringify(schedule, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `production-schedule-${Date.now()}.json`;
    link.click();
  };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      await productionApi.optimizeSchedule();
      setShowOptimization(true);
      await loadScheduleData();
      setTimeout(() => setShowOptimization(false), 5000);
    } catch (err: any) {
      alert(err.message || "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  };

  const handleShiftWorkerToggle = async (workerId: string) => {
    if (!schedule) return;
    const currentShiftDetails = schedule.shifts[selectedShift];
    const workerName = allWorkers.find(w => w.id === workerId)?.name || "";
    
    let updatedWorkers = [...currentShiftDetails.workers];
    if (updatedWorkers.includes(workerName)) {
      updatedWorkers = updatedWorkers.filter(w => w !== workerName);
    } else {
      updatedWorkers.push(workerName);
    }

    // Resolve workerIds from names to sync with backend
    const matchedWorkerIds = allWorkers
      .filter((w) => updatedWorkers.includes(w.name))
      .map((w) => w.id);

    try {
      setSavingShift(true);
      await productionApi.updateShiftWorkers({
        shiftName: selectedShift,
        workerIds: matchedWorkerIds,
      });
      // Reload schedule to reflect changes
      const updatedSchedule = await productionApi.getSchedule();
      setSchedule(updatedSchedule);
    } catch (err: any) {
      alert(err.message || "Failed to update shift workers");
    } finally {
      setSavingShift(false);
    }
  };

  const activeShift = schedule?.shifts[selectedShift];
  const activeShiftWorkers = activeShift?.workers || [];

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Production Schedule</h1>
            <p className="text-slate-600 text-sm mt-1">Manage production timeline and shifts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {optimizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Optimize Schedule
            </button>
            <button
              onClick={handleExportSchedule}
              disabled={!schedule}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {showOptimization && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-900 mb-2">Schedule Optimization Complete</h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>✓ Machine utilization and hour allocations rebalanced</li>
                  <li>✓ Overlapping machine loads resolved</li>
                  <li>✓ Shift staffing schedules updated dynamically from PostgreSQL</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Conflicts Alert Panel */}
        {schedule && schedule.conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-2">
                  Schedule Conflicts Detected ({schedule.conflicts.length})
                </h4>
                <div className="space-y-2">
                  {schedule.conflicts.map((conflict, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            conflict.severity === "high" ? "bg-red-500" : "bg-amber-500"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-slate-900">{conflict.shift} Shift</p>
                          <p className="text-sm text-slate-600">{conflict.issue}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleOptimize}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          Auto-Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Fetching Gantt schedules and shifts...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gantt Chart View */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Gantt Chart View</h3>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-13 gap-px bg-slate-200 rounded-lg overflow-hidden mb-2">
                    <div className="bg-slate-100 p-2 font-medium text-xs text-slate-700">Task</div>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="bg-slate-100 p-2 text-center text-xs text-slate-700">
                        {i * 2}:00
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {schedule?.tasks.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-6 text-center">No active production plans scheduled today.</p>
                    ) : (
                      schedule?.tasks.map((task) => (
                        <div key={task.id} className="grid grid-cols-13 gap-px items-center">
                          <div className="text-sm font-medium text-slate-900 truncate pr-2">
                            {task.name}
                          </div>
                          <div className="col-span-12 relative h-10 bg-slate-50 rounded-lg border border-slate-100">
                            <div
                              className={`absolute h-full rounded-lg ${
                                task.status === "In Progress"
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                              } flex items-center px-3 text-white text-xs font-semibold shadow-md`}
                              style={{
                                left: `${(task.start / 24) * 100}%`,
                                width: `${(task.duration / 24) * 100}%`,
                              }}
                            >
                              {task.machine} ({task.status})
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shift Planning */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Shift Planning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {schedule &&
                  Object.entries(schedule.shifts).map(([key, shift]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedShift(key as any)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedShift === key
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{shift.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{shift.time}</p>
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        {shift.workers.length} workers assigned
                      </p>
                    </button>
                  ))}
              </div>

              {/* Dynamic Shift Assignments Editor */}
              {activeShift && (
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Manage Shift Assignments - {activeShift.name}
                      </h4>
                      <p className="text-xs text-slate-500">Select active production workers for this shift block</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allWorkers.map((worker) => {
                      const isAssigned = activeShiftWorkers.includes(worker.name);
                      return (
                        <label
                          key={worker.id}
                          className={`flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300 transition-colors shadow-sm ${
                            isAssigned ? "border-blue-300 bg-blue-50/20" : "border-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            disabled={savingShift}
                            onChange={() => handleShiftWorkerToggle(worker.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{worker.name}</p>
                            <p className="text-xs text-slate-500">Operator</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
