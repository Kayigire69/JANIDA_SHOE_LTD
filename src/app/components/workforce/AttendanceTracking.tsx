import { useState } from "react";
import { Layout } from "../Layout";
import { Calendar, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";

export function AttendanceTracking() {
  const [selectedDate, setSelectedDate] = useState("2026-05-02");
  const [filterDept, setFilterDept] = useState("all");

  const attendanceRecords = [
    { id: "EMP-001", name: "John Anderson", department: "Production", clockIn: "05:58 AM", clockOut: "02:05 PM", status: "Present", hours: "8.1" },
    { id: "EMP-002", name: "Sarah Williams", department: "Quality Assurance", clockIn: "02:15 PM", clockOut: "-", status: "Late", hours: "-" },
    { id: "EMP-003", name: "Mike Johnson", department: "Production", clockIn: "06:00 AM", clockOut: "02:00 PM", status: "Present", hours: "8.0" },
    { id: "EMP-004", name: "Emma Davis", department: "Inventory", clockIn: "-", clockOut: "-", status: "Absent", hours: "0" },
    { id: "EMP-005", name: "Tom Brown", department: "Production", clockIn: "10:20 PM", clockOut: "-", status: "Present", hours: "-" },
  ];

  const filteredRecords = attendanceRecords.filter((record) =>
    filterDept === "all" || record.department === filterDept
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-700 border border-emerald-600";
      case "Late":
        return "bg-amber-100 text-amber-700 border border-amber-600";
      case "Absent":
        return "bg-red-100 text-red-700 border border-red-600";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-600";
    }
  };

  const stats = {
    present: attendanceRecords.filter(r => r.status === "Present").length,
    late: attendanceRecords.filter(r => r.status === "Late").length,
    absent: attendanceRecords.filter(r => r.status === "Absent").length,
    total: attendanceRecords.length,
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Attendance Tracking</h1>
            <p className="text-slate-600 text-sm mt-1">Monitor daily workforce attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Present</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.present}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Late</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.late}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Absent</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.absent}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Production">Production</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Inventory">Inventory</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Clock In</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Clock Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{record.id}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{record.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{record.department}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{record.clockIn}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{record.clockOut}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{record.hours}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
