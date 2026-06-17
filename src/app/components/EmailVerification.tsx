import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { authApi } from "../services/authApi";

export function EmailVerification() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [email, setEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = localStorage.getItem("pendingVerificationEmail");
    if (pending) setEmail(pending);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setError("");

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCode.every((digit) => digit !== "")) {
        handleVerify(newCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(newCode);
      if (newCode.every((digit) => digit !== "")) {
        handleVerify(newCode);
      }
    }
  };

  const handleVerify = async (verificationCode: string[]) => {
    setIsVerifying(true);
    setError("");

    const codeString = verificationCode.join("");
    if (!email) {
      setError("Email not found. Please register again.");
      setIsVerifying(false);
      return;
    }

    try {
      await authApi.verifyEmail({ email, code: codeString });
      setSuccess(true);
      localStorage.removeItem("pendingVerificationEmail");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setCode(["", "", "", "", "", ""]);
    setError("");
    setCountdown(60);
    setCanResend(false);
    inputRefs.current[0]?.focus();

    try {
      await authApi.resendVerification({ email });
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
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
                <h1 className="text-2xl font-semibold text-white">Verify Email</h1>
                <p className="text-slate-300 text-sm mt-1">Enter the code we sent you</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-600 text-sm">
                  We've sent a 6-digit verification code to
                </p>
                <p className="text-slate-900 font-medium mt-1">{email || "your email"}</p>
              </div>
            </div>

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-800 text-sm">Email verified successfully! Redirecting...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isVerifying || success}
                    className="w-12 h-14 text-center text-xl font-semibold bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ))}
              </div>
            </div>

            {isVerifying && (
              <div className="text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 text-sm mt-2">Verifying code...</p>
              </div>
            )}

            <div className="text-center space-y-3">
              <p className="text-slate-600 text-sm">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {canResend ? "Resend Code" : `Resend in ${countdown}s`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
