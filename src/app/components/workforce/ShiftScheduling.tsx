import { useState } from "react";
import { Layout } from "../Layout";
import { Calendar, Users, Plus } from "lucide-react";

export function ShiftScheduling() {
  const [selectedDate, setSelectedDate] = useState("2026-05-02");
  const [selectedShift, setSelectedShift] = useState("morning");

  const shifts = {
    morning: { name: "Morning Shift", time: "6:00 AM - 2:00 PM", employees: ["John Anderson", "Mike Johnson", "Sarah Williams"] },
    afternoon: { name: "Afternoon Shift", time: "2:00 PM - 10:00 PM", employees: ["Jane Smith", "David Park", "Lisa Chen"] },
    night: { name: "Night Shift", time: "10:00 PM - 6:00 AM", employees: ["Tom Brown", "Emma Wilson", "Chris Davis"] },
  };

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

        <div className="grid grid-cols-3 gap-6">
          {Object.entries(shifts).map(([key, shift]) => (
            <button
              key={key}
              onClick={() => setSelectedShift(key)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedShift === key
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Calendar className={`w-5 h-5 ${selectedShift === key ? "text-blue-600" : "text-slate-600"}`} />
                <h3 className="font-semibold text-slate-900">{shift.name}</h3>
              </div>
              <p className="text-sm text-slate-600">{shift.time}</p>
              <div className="mt-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{shift.employees.length} employees</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {shifts[selectedShift as keyof typeof shifts].name} - Assigned Employees
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Assign Employee
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {shifts[selectedShift as keyof typeof shifts].employees.map((employee, index) => (
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
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
