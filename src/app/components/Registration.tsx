import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, Footprints, ArrowRight } from "lucide-react";
import { authApi } from "../services/authApi";

export function Registration() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});





  const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One number',           test: (p: string) => /[0-9]/.test(p) },
  ];

  const calculatePasswordStrength = (password: string) => {
    // Count how many backend-required rules pass
    return passwordRules.filter(r => r.test(password)).length;
  };

  const isPasswordValid = (password: string) =>
    passwordRules.every(r => r.test(password));

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isPasswordValid(formData.password)) {
      newErrors.password = "Password must meet all requirements below";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await authApi.register({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        localStorage.setItem("pendingVerificationEmail", formData.email);
        navigate("/verify-email");
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : "Registration failed" });
      }
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-amber-500";
    if (passwordStrength <= 3) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Almost there";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            JANIDA <span className="text-amber-500">SHOE</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-300 text-sm mt-1">
              Join the Janida Shoe Ltd management platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jack@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+250780784244"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <span className="text-amber-500 mt-0.5">ℹ️</span>
                <p className="text-sm text-amber-800">
                  Your <strong>department</strong> and <strong>role</strong> will be assigned by the system administrator after your account is verified.
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="Create a strong password"
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
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Password Strength:</span>
                      <span className={`font-medium ${
                        passwordStrength <= 1 ? "text-red-600" :
                        passwordStrength <= 2 ? "text-amber-600" :
                        passwordStrength <= 3 ? "text-yellow-600" : "text-emerald-600"
                      }`}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <ul className="space-y-1 pt-1">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(formData.password);
                        return (
                          <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${
                            passed ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {passed
                              ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                              : <XCircle className="w-3 h-3 flex-shrink-0" />
                            }
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {errors.form}
              </div>
            )}

            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-amber-500/20 transform hover:-translate-y-0.5"
            >
              Register Account
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <div className="text-center">
              <p className="text-slate-600 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
