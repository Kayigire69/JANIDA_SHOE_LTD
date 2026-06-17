import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Smartphone, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

export function MFASetup() {
  const navigate = useNavigate();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [step, setStep] = useState<"toggle" | "setup" | "verify">("toggle");
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const secretKey = "JBSWY3DPEHPK3PXP";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SmartShoeFactory:user@company.com?secret=${secretKey}&issuer=SmartShoeFactory`;

  const handleToggleMFA = (enabled: boolean) => {
    setMfaEnabled(enabled);
    if (enabled) {
      setStep("setup");
    } else {
      setStep("toggle");
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
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
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string[]) => {
    setIsVerifying(true);
    setError("");

    setTimeout(() => {
      const codeString = code.join("");
      if (codeString.length === 6) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      } else {
        setError("Invalid verification code. Please try again.");
        setIsVerifying(false);
      }
    }, 1000);
  };

  const handleSkip = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Multi-Factor Authentication
                </h1>
                <p className="text-slate-300 text-sm mt-1">Enhanced security for your account</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {step === "toggle" && (
              <>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Secure Your Account</h2>
                    <p className="text-slate-600 text-sm mt-2">
                      Add an extra layer of security by enabling two-factor authentication using an
                      authenticator app.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-blue-900 font-medium text-sm mb-3">Benefits of MFA:</h3>
                  <ul className="text-blue-800 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Protect against unauthorized access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Secure sensitive factory data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Meet enterprise security standards</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Enable MFA</p>
                    <p className="text-sm text-slate-600">Recommended for all users</p>
                  </div>
                  <button
                    onClick={() => handleToggleMFA(!mfaEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      mfaEnabled ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        mfaEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={() => handleToggleMFA(true)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Enable MFA
                  </button>
                </div>
              </>
            )}

            {step === "setup" && (
              <>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">Setup Instructions</h2>
                    <ol className="text-slate-600 text-sm space-y-3">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </span>
                        <span>Install an authenticator app (Google Authenticator, Authy, etc.)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </span>
                        <span>Scan the QR code below or enter the secret key manually</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </span>
                        <span>Enter the 6-digit code from your authenticator app</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs text-slate-600 mb-2 text-center">
                        Or enter this secret key manually:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={secretKey}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm font-mono text-center"
                        />
                        <button
                          onClick={handleCopySecret}
                          className="px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep("verify")}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Continue to Verification
                </button>
              </>
            )}

            {step === "verify" && (
              <>
                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-emerald-800 text-sm">
                      MFA enabled successfully! Redirecting...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Verify Setup</h2>
                  <p className="text-slate-600 text-sm mb-4">
                    Enter the 6-digit code from your authenticator app to complete setup.
                  </p>

                  <div className="flex gap-2 justify-center">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={isVerifying || success}
                        className="w-12 h-14 text-center text-xl font-semibold bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
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

                <button
                  onClick={() => setStep("setup")}
                  className="w-full text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                  Back to QR Code
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
