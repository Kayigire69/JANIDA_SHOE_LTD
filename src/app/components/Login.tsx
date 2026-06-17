import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Footprints, AlertCircle, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex bg-white">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-slate-900 to-slate-800 items-center justify-center overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

        <div className="relative max-w-md px-10 text-center animate-in fade-in slide-in-from-left-8 duration-700">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center">
              <Footprints className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">
              JANIDA <span className="text-amber-400">SHOE</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome back to the factory floor
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Sign in to manage production, inventory, quality, and your team —
            all in one smart platform.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              JANIDA <span className="text-amber-500">SHOE</span>
            </span>
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
            <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1 mb-8">
              Enter your credentials to access your dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

            {mfaRequired && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.mfaCode}
                  onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value })}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address or Username
              </label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@company.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link
                to="/password-recovery"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-amber-500/20 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Signing In..." : "Sign In"}
              {!isLoading && (
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-slate-600 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs">
              Secure enterprise authentication · Protected by end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
