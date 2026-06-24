import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle, Footprints, ArrowRight, User, Mail, Lock, Phone, Shield, BarChart3, Package, UserPlus } from "lucide-react";
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the Terms & Conditions";
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-xl flex overflow-hidden z-10 mb-12">
        {/* Left Panel */}
        <div className="hidden lg:flex w-5/12 bg-slate-900 relative flex-col text-white p-10">
          <div className="absolute inset-0">
            <img src="/shoe_factory_blue_tint.png" alt="Factory" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-900/90" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-start gap-2 mb-10">
              <Footprints className="w-12 h-12 text-white" />
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-bold tracking-wider uppercase">JIANIDA</span>
                <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">SHOE LTD</span>
              </div>
            </Link>
            
            <h2 className="text-[1.7rem] font-bold uppercase tracking-wide leading-[1.3] mb-12 text-slate-100">
              Smart Shoe<br/>Factory<br/>Management<br/>System
            </h2>
            
            <div className="w-8 h-1 bg-blue-500 rounded-full mb-10"></div>

            {/* Features List */}
            <div className="space-y-8 mt-auto pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full border border-blue-400/20 bg-blue-900/30 backdrop-blur-sm">
                  <BarChart3 className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Real-time Production</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Monitor and improve<br/>production efficiency</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full border border-blue-400/20 bg-blue-900/30 backdrop-blur-sm">
                  <Shield className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Quality Control</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Ensure product quality<br/>at every step</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full border border-blue-400/20 bg-blue-900/30 backdrop-blur-sm">
                  <Package className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Inventory Management</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Keep inventory organized<br/>and up to date</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full border border-blue-400/20 bg-blue-900/30 backdrop-blur-sm">
                  <UserPlus className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">User Management</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Manage roles and<br/>permissions easily</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 bg-white flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            
            <div className="flex flex-col items-center text-center space-y-3 mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-1 text-blue-600">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
              <p className="text-sm text-slate-500 max-w-sm">
                Register to access the Smart Shoe Factory<br/>Management System
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-[10px] mt-1">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden max-w-[150px]">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer w-4 h-4 appearance-none rounded border-2 border-slate-200 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all cursor-pointer"
                    />
                    <CheckCircle2 className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3px] p-[2px]" />
                  </div>
                  <span className="text-xs text-slate-700 leading-tight">
                    I agree to the <a href="#" className="text-blue-600 font-medium hover:underline">Terms & Conditions</a> and <a href="#" className="text-blue-600 font-medium hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>
              {errors.terms && <p className="text-red-500 text-[10px]">{errors.terms}</p>}

              {errors.form && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-2"
              >
                Register
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer text underneath the card */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SMART SHOE FACTORY MANAGEMENT SYSTEM</p>
        <p className="text-sm font-bold text-blue-800 uppercase tracking-widest">JIANIDA SHOE LTD</p>
      </div>
    </div>
  );
}
