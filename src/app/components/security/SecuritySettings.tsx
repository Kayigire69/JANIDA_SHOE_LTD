import { useState } from "react";
import { Layout } from "../Layout";
import { Shield, Lock, Key, AlertTriangle, Save } from "lucide-react";

export function SecuritySettings() {
  const [settings, setSettings] = useState({
    dataEncryption: true,
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: false,
    auditLogging: true,
    apiRateLimit: 1000,
  });

  const handleToggle = (key: string) => {
    setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
  };

  const handleSave = () => {
    console.log("Saving security settings:", settings);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Security Settings</h1>
            <p className="text-slate-600 text-sm mt-1">Configure system security and access controls</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Authentication & Access</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Data Encryption</p>
                  <p className="text-sm text-slate-600">Encrypt sensitive data at rest</p>
                </div>
                <button
                  onClick={() => handleToggle("dataEncryption")}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.dataEncryption ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settings.dataEncryption ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-600">Require 2FA for all users</p>
                </div>
                <button
                  onClick={() => handleToggle("twoFactorAuth")}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.twoFactorAuth ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordExpiry: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Security Policies</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Max Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.loginAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, loginAttempts: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">IP Whitelist</p>
                  <p className="text-sm text-slate-600">Restrict access to specific IPs</p>
                </div>
                <button
                  onClick={() => handleToggle("ipWhitelist")}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.ipWhitelist ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settings.ipWhitelist ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Audit Logging</p>
                  <p className="text-sm text-slate-600">Log all system activities</p>
                </div>
                <button
                  onClick={() => handleToggle("auditLogging")}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.auditLogging ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settings.auditLogging ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  API Rate Limit (requests/hour)
                </label>
                <input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Security Recommendations</h4>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• Enable two-factor authentication for all administrative accounts</li>
                <li>• Review and update security policies quarterly</li>
                <li>• Monitor audit logs regularly for suspicious activities</li>
                <li>• Keep session timeout below 60 minutes for sensitive operations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
