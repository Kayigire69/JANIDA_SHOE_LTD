import { useEffect, useState, useRef } from "react";
import { Layout } from "../Layout";
import { Loader2, Edit3, AlertTriangle, Settings, Save, Upload, Image as ImageIcon } from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { useSettings } from "../../context/SettingsContext";

export function SystemSettings() {
  const { refreshSettings, API_BASE_URL } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<any[]>([]);
  const [editingSetting, setEditingSetting] = useState<any>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listSystemSettings();
      setSettings(data.settings || []);
      const logoSetting = data.settings?.find((s: any) => s.setting_key === 'company_logo_url');
      if (logoSetting && logoSetting.setting_value) {
        setLogoPreview(`${API_BASE_URL}${logoSetting.setting_value}`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (id: string, value: string) => {
    try {
      await adminApi.updateSystemSetting(id, value);
      setEditingSetting(null);
      await fetchSettings();
      await refreshSettings();
    } catch (err: any) {
      setError(err?.message || "Failed to save system setting");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await adminApi.uploadLogo(formData);
      setLogoFile(null);
      await fetchSettings();
      await refreshSettings();
    } catch (err: any) {
      setError(err?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
          <p className="text-slate-600 text-sm mt-1">Configure global application variables and branding</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">Branding</h2>
            <p className="text-sm text-slate-500 mt-1">Update the company logo that appears across the application and reports.</p>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <label className="block text-sm font-medium text-slate-700">Company Logo</label>
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Choose New Logo
                      </button>
                      {logoFile && (
                        <button
                          onClick={handleUploadLogo}
                          disabled={uploadingLogo}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Logo
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Recommended: Square or horizontal image, PNG or SVG format, max 5MB.
                    </p>
                    {logoFile && (
                      <p className="text-sm text-emerald-600 font-medium truncate max-w-[200px]">
                        Selected: {logoFile.name} (Not saved yet)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-4 mb-4">Advanced Settings</h2>
          
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && settings.length === 0 && (
            <div className="text-center py-12 text-slate-500">No system settings found.</div>
          )}

          {!loading && settings.length > 0 && (
            <div className="space-y-4 overflow-x-auto">
              <div className="min-w-[600px] space-y-4">
                {settings.map((s) => (
                  <div key={s.id} className="border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-[200px] pr-4">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                        <Settings className="w-4 h-4 text-slate-400" />
                        {s.setting_key}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{s.description || "No description provided."}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingSetting?.id === s.id ? (
                        <>
                          <input
                            value={editingSetting.settingValue}
                            onChange={(e) => setEditingSetting({ ...editingSetting, settingValue: e.target.value })}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleSaveSetting(s.id, editingSetting.settingValue)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSetting(null)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-slate-700 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 break-all max-w-[200px]">
                            {s.setting_value}
                          </span>
                          <button
                            onClick={() => setEditingSetting({ id: s.id, settingValue: s.setting_value })}
                            className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                          >
                            <Edit3 className="w-4 h-4 text-slate-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
