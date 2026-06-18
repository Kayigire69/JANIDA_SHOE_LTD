import { Link } from "react-router-dom";
import { Clock, ArrowLeft, ShieldAlert } from "lucide-react";
import { clearAuthSession } from "../services/authApi";

export function PendingApproval() {
  const handleLogout = () => {
    clearAuthSession();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Your account has been created successfully, but it requires administrator approval before you can access the system. You will be assigned a role shortly.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            If you need immediate access, please contact your department manager or the IT administration team.
          </p>
        </div>

        <Link
          to="/login"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Login
        </Link>
      </div>
    </div>
  );
}
