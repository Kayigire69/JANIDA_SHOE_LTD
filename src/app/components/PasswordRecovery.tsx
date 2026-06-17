import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, CheckCircle2, AlertCircle, Shield, ArrowLeft } from "lucide-react";
import { authApi } from "../services/authApi";

export function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset instructions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-semibold text-white">Reset Password</h1>
                <p className="text-slate-300 text-sm mt-1">Recover your account access</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {!isSubmitted ? (
              <>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full">
                    <KeyRound className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-slate-600 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? "Sending..." : "Send Reset Instructions"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-emerald-900">Email Sent Successfully</h3>
                      <p className="text-emerald-800 text-sm">
                        We've sent password reset instructions to <span className="font-medium">{email}</span>
                      </p>
                      <p className="text-emerald-700 text-sm">
                        Please check your inbox and follow the instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-emerald-700 text-sm text-center">
                  Check your inbox for the reset link. It will expire in 30 minutes.
                </p>

                <div className="text-center">
                  <p className="text-slate-600 text-sm">
                    Didn't receive the email?{" "}
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail("");
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </>
            )}

            <div className="border-t border-slate-200 pt-6">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
