import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Footprints, AlertCircle, ArrowRight, User, Lock, Shield, Factory, CheckCircle2, Package, BarChart3 } from "lucide-react";
import { authApi, dashboardPaths, storeAuthSession } from "../services/authApi";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [mfaRequired, setMfaRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
        ...(formData.mfaCode ? { mfaCode: formData.mfaCode } : {}),
      });

      if (response.mfaRequired) {
        setMfaRequired(true);
        setError("Enter your authenticator code to continue");
        setIsLoading(false);
        return;
      }

      if (response.token && response.user) {
        storeAuthSession(response.token, response.user);
        navigate(dashboardPaths[response.user.role] || "/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar - Factory Image & Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/shoe_factory_blue_tint.png" 
            alt="Factory" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/10 to-slate-900/90" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 p-12">
          <div className="flex flex-col items-center max-w-fit">
             <Footprints className="w-12 h-12 text-white mb-2" />
             <span className="text-2xl font-bold text-white tracking-wider uppercase">JIANIDA</span>
             <span className="text-xs tracking-widest text-slate-300 uppercase mt-1">SHOE LTD</span>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 p-12 space-y-10">
          <div>
            <h2 className="text-3xl font-light text-white leading-snug">
              Smart Solutions<br/>
              <span className="font-semibold">for Smart Manufacturing</span>
            </h2>
          </div>
          
          {/* Icons Grid */}
          <div className="grid grid-cols-4 gap-6 pt-6 border-t border-slate-700/50">
             <div className="flex flex-col items-center gap-2">
               <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                 <Factory className="w-6 h-6 text-slate-300" />
               </div>
               <span className="text-xs text-slate-400 font-medium">Production</span>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                 <CheckCircle2 className="w-6 h-6 text-slate-300" />
               </div>
               <span className="text-xs text-slate-400 font-medium">Quality</span>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                 <Package className="w-6 h-6 text-slate-300" />
               </div>
               <span className="text-xs text-slate-400 font-medium">Inventory</span>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                 <BarChart3 className="w-6 h-6 text-slate-300" />
               </div>
               <span className="text-xs text-slate-400 font-medium">Reports</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back!</h1>
            <p className="text-slate-500 max-w-sm">
              Sign in to your Smart Shoe Factory Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-10">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {mfaRequired && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Authenticator Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.mfaCode}
                    onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value })}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer w-5 h-5 appearance-none rounded border-2 border-slate-200 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all cursor-pointer"
                  />
                  <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3px] p-[2px]" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <Link
                to="/password-recovery"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-slate-500 font-medium">or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              Login as Admin
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
