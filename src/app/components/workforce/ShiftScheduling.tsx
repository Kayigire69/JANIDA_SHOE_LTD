import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Calendar, Users, Plus, X, Loader2, Check } from "lucide-react";
import { productionApi } from "../../services/productionApi";
import { toast } from "sonner";

export function ShiftScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "night">("morning");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [allWorkers, setAllWorkers] = useState<Array<{ id: string; name: string }>>([]);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const [schedRes, planningRes] = await Promise.all([
        productionApi.getSchedule(),
        productionApi.getPlanningData(),
      ]);
      setScheduleData(schedRes);
      setAllWorkers(planningRes.workers || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate]);

  const openAssignModal = () => {
    const currentWorkers = scheduleData?.shifts[selectedShift]?.workers || [];
    setSelectedWorkers([...currentWorkers]);
    setShowAssignModal(true);
  };

  const toggleWorkerSelection = (workerName: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerName) 
        ? prev.filter(w => w !== workerName) 
        : [...prev, workerName]
    );
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const matchedWorkerIds = allWorkers
        .filter((w) => selectedWorkers.includes(w.name))
        .map((w) => w.id);

      await productionApi.updateShiftWorkers({
        shiftName: selectedShift,
        workerIds: matchedWorkerIds,
      });
      
      setShowAssignModal(false);
      await loadScheduleData();
      toast.success(`${scheduleData?.shifts[selectedShift]?.name} updated successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update shift assignments");
    } finally {
      setSaving(false);
    }
  };

  const shifts = scheduleData?.shifts || {
    morning: { name: 'Morning Shift', time: '6:00 AM - 2:00 PM', workers: [] },
    afternoon: { name: 'Afternoon Shift', time: '2:00 PM - 10:00 PM', workers: [] },
    night: { name: 'Night Shift', time: '10:00 PM - 6:00 AM', workers: [] }
  } as Record<"morning" | "afternoon" | "night", { name: string; time: string; workers: string[] }>;

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Shift Scheduling</h1>
            <p className="text-slate-600 text-sm mt-1">Manage employee shift assignments</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(shifts).map(([key, shift]) => {
                const shiftData = shift as { name: string; time: string; workers: string[] };
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedShift(key as "morning" | "afternoon" | "night")}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedShift === key
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className={`w-5 h-5 ${selectedShift === key ? "text-blue-600" : "text-slate-600"}`} />
                      <h3 className="font-semibold text-slate-900">{shiftData.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{shiftData.time}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{shiftData.workers.length} employees</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {shifts[selectedShift].name} - Assigned Employees
                </h3>
                <button 
                  onClick={openAssignModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Assign Employee
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {shifts[selectedShift].workers.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-slate-500">
                    No employees assigned to this shift
                  </div>
                ) : (
                  shifts[selectedShift].workers.map((employee: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{employee.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{employee}</p>
                        <p className="text-xs text-slate-600">Assigned</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Assign Workers Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between text-white">
              <div>
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage {shifts[selectedShift].name} Staffing
                </h3>
                <p className="text-blue-100 text-sm mt-1">Select workers to assign to the {shifts[selectedShift].time} block.</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allWorkers.map((worker) => {
                  const isSelected = selectedWorkers.includes(worker.name);
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
                        {isSelected && <Check className="w-3.5 h-3.5" />}
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
                {selectedWorkers.length} workers selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
