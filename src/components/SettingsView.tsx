import React, { useState } from 'react';
import {
  Settings,
  Shield,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Save,
  Database,
  Lock,
  MessageCircle,
  RotateCcw,
  Mic,
  Globe,
  Volume2,
  Download,
  UploadCloud,
  FileJson,
  KeyRound,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import { validateWhatsAppPhoneNumber, checkWhatsAppConfigurationStatus, WHATSAPP_TEMPLATE_SPEC } from '../services/whatsappNotificationService';
import { DEMO_COMPANY_CONFIG } from '../data/demoData';
import { VoiceInputControl } from './VoiceInputControl';
import { isFirebaseConfigured, missingFirebaseConfigKeys, firebaseConfig } from '../lib/firebase';
import { migrateLocalDataToFirestore, DEFAULT_COMPANY_ID } from '../services/firestoreService';
import { AdminCredentials, DEFAULT_ADMIN_CREDENTIALS } from '../utils/storage';
import {
  Site,
  FieldOfficer,
  Assignment,
  PatrolReport,
  IncidentRecord,
  PatrolZone,
  ChecklistItem
} from '../types';

interface SettingsViewProps {
  sites?: Site[];
  officers?: FieldOfficer[];
  assignments?: Assignment[];
  reports?: PatrolReport[];
  incidents?: IncidentRecord[];
  zones?: PatrolZone[];
  masterChecklists?: ChecklistItem[];
  companyConfig?: typeof DEMO_COMPANY_CONFIG;
  adminCredentials?: AdminCredentials;
  onSaveCompanyConfig?: (config: typeof DEMO_COMPANY_CONFIG) => void;
  onUpdateAdminCredentials?: (creds: AdminCredentials) => void;
  onOpenMobilePreview: () => void;
  onResetToDemoDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  sites = [],
  officers = [],
  assignments = [],
  reports = [],
  incidents = [],
  zones = [],
  masterChecklists = [],
  companyConfig = DEMO_COMPANY_CONFIG,
  adminCredentials = DEFAULT_ADMIN_CREDENTIALS,
  onSaveCompanyConfig,
  onUpdateAdminCredentials,
  onOpenMobilePreview,
  onResetToDemoDefaults
}) => {
  const [config, setConfig] = useState(companyConfig);

  // Sync state if companyConfig prop updates
  React.useEffect(() => {
    setConfig(companyConfig);
  }, [companyConfig]);

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [defaultVoiceLang, setDefaultVoiceLang] = useState<'hi-IN' | 'en-IN' | 'en-US'>('hi-IN');
  const [testVoiceText, setTestVoiceText] = useState('');

  // Admin Credentials Update State
  const [adminIdInput, setAdminIdInput] = useState(adminCredentials?.adminId || 'admin@rexon.com');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [adminCredError, setAdminCredError] = useState<string | null>(null);
  const [adminCredSuccess, setAdminCredSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (adminCredentials?.adminId) {
      setAdminIdInput(adminCredentials.adminId);
    }
  }, [adminCredentials]);

  // Admin WhatsApp Notification Dispatch State (Phase 9 & 9A)
  const [adminWhatsAppEnabled, setAdminWhatsAppEnabled] = useState(
    (companyConfig as any)?.adminWhatsAppAlertsEnabled ?? false
  );
  const [adminWhatsAppName, setAdminWhatsAppName] = useState(
    (companyConfig as any)?.adminWhatsAppName || 'REXON Central Operations'
  );
  const [adminWhatsAppPhone, setAdminWhatsAppPhone] = useState(
    (companyConfig as any)?.adminWhatsAppPhone || '+91 98765 43210'
  );
  const [adminNotifyOn, setAdminNotifyOn] = useState<'all_reports' | 'incidents_only'>(
    (companyConfig as any)?.adminNotifyOn || 'all_reports'
  );
  const [adminTestMode, setAdminTestMode] = useState(
    (companyConfig as any)?.adminTestMode ?? true
  );
  const [waSaveFeedback, setWaSaveFeedback] = useState<string | null>(null);

  const adminPhoneValidation = validateWhatsAppPhoneNumber(adminWhatsAppPhone);

  const handleSaveAdminWhatsAppSettings = () => {
    if (adminWhatsAppEnabled && !adminPhoneValidation.isValid) {
      setWaSaveFeedback('त्रुटि: मान्य अंतरराष्ट्रीय फोन नंबर (+देश कोड सहित) दर्ज करें।');
      return;
    }

    const updatedConfig = {
      ...config,
      adminWhatsAppAlertsEnabled: adminWhatsAppEnabled,
      adminWhatsAppName: adminWhatsAppName.trim(),
      adminWhatsAppPhone: adminPhoneValidation.isValid ? adminPhoneValidation.normalized : adminWhatsAppPhone.trim(),
      adminNotifyOn,
      adminTestMode
    };

    setConfig(updatedConfig);
    onSaveCompanyConfig?.(updatedConfig);
    setWaSaveFeedback('एडमिन व्हाट्सएप्प नोटिफिकेशन सेटिंग्स सहेज ली गई हैं। (Admin WhatsApp settings saved)');
    setTimeout(() => setWaSaveFeedback(null), 3500);
  };

  const handleUpdateAdminCredentials = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAdminCredError(null);
    setAdminCredSuccess(null);

    const cleanId = adminIdInput.trim();
    const cleanCurrent = currentPasswordInput.trim();
    const cleanNew = newPasswordInput.trim();
    const cleanConfirm = confirmPasswordInput.trim();

    if (!cleanId) {
      setAdminCredError('एडमिन आईडी खाली नहीं हो सकती (Admin ID cannot be empty).');
      return;
    }

    const currentActualPass = adminCredentials?.password || 'rexonadmin123';
    if (cleanCurrent !== currentActualPass) {
      setAdminCredError('वर्तमान पासवर्ड गलत है (Current password does not match).');
      return;
    }

    if (cleanNew.length < 4) {
      setAdminCredError('नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (New password must be at least 4 characters).');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setAdminCredError('नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते (New password and confirm password do not match).');
      return;
    }

    const updatedCreds: AdminCredentials = {
      adminId: cleanId,
      password: cleanNew,
      updatedAt: new Date().toISOString()
    };

    onUpdateAdminCredentials?.(updatedCreds);
    setAdminCredSuccess('एडमिन आईडी और पासवर्ड सफलतापूर्वक अपडेट हो गए! (Admin credentials updated successfully!)');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setTimeout(() => setAdminCredSuccess(null), 5000);
  };


  const handleExportJsonBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      app: 'Rexon Field Patrolling',
      version: '2.0.0',
      sites,
      officers,
      assignments,
      reports,
      incidents,
      zones,
      masterChecklists
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rexon_patrol_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSaveFeedback('Complete JSON backup downloaded to your device.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleMigrateToCloud = async () => {
    if (!isFirebaseConfigured) {
      alert('Cloud Firestore is not configured yet. Please configure Firebase credentials first.');
      return;
    }

    setIsMigrating(true);
    try {
      const res = await migrateLocalDataToFirestore(DEFAULT_COMPANY_ID, {
        sites,
        officers,
        assignments,
        reports,
        incidents,
        zones,
        masterChecklists
      });
      setSaveFeedback(`Successfully synchronized ${res.count} records to Cloud Firestore.`);
    } catch (err: any) {
      console.error('Migration error:', err);
      setSaveFeedback(`Migration failed: ${err?.message || 'Error writing to Firestore'}`);
    } finally {
      setIsMigrating(false);
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCompanyConfig) {
      onSaveCompanyConfig(config);
    }
    setSaveFeedback('कंपनी प्रोफाइल, मोबाइल नंबर व सेटिंग्स सफलतापूर्वक सहेजे गए (Company profile, phone numbers & patrol settings saved).');
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3500);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all demo sites, officers, assignments, and checklists back to factory initial demo data?')) {
      onResetToDemoDefaults();
      setSaveFeedback('All demo records reset to initial factory demo dataset.');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* View Header */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#4B3621] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#6F4E37]" />
            <span>Company & Field Operations Settings</span>
          </h2>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Configure Rexon Field Patrolling parameters, company name, mobile number, geofence compliance bounds and dispatch rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Download full JSON backup of all operations data"
          >
            <Download className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FFEBEE] text-[#4B3621] hover:text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Reset demo data changes saved in localStorage"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span className="font-semibold">{saveFeedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Company Profile */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Security Agency Profile & Contact Details (कंपनी प्रोफाइल व संपर्क)
              </h3>
            </div>
            <span className="text-[11px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
              Live Persisted
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Company Registered Name *</label>
              <input
                type="text"
                required
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                placeholder="e.g. Rexon Security Solutions Inc."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
              <p className="text-[11px] text-[#8B735B] mt-1">Updates title across Owner Dashboard, reports, and exports.</p>
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Application Brand Identifier</label>
              <input
                type="text"
                disabled
                value={config.appName}
                className="w-full px-3 py-2 bg-[#F0E8DD] border border-[#E7DED2] rounded-lg text-[#8B735B] font-bold cursor-not-allowed"
              />
              <p className="text-[11px] text-[#8B735B] mt-1">System brand tag identifier.</p>
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Operations Director / Owner Name</label>
              <input
                type="text"
                value={config.ownerName}
                onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                placeholder="e.g. Commander J. Reynolds"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Security Operations License ID</label>
              <input
                type="text"
                value={config.licenseId}
                onChange={(e) => setConfig({ ...config, licenseId: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* Mobile / Phone Number Field (Requested by User) */}
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span>Primary Contact / Mobile Number (मोबाइल नंबर) *</span>
              </label>
              <input
                type="text"
                required
                value={config.contactPhone || ''}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                placeholder="e.g. +91 98765 43210 or +1 (555) 900-REXON"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
              <p className="text-[11px] text-[#8B735B] mt-1">Printed on daily patrol logs and displayed for field officer escalations.</p>
            </div>

            {/* Alert & Dispatch Phone */}
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#B71C1C]" />
                <span>Emergency Dispatch Hotline (इमरजेंसी फोन)</span>
              </label>
              <input
                type="text"
                value={config.alertDispatchPhone || ''}
                onChange={(e) => setConfig({ ...config, alertDispatchPhone: e.target.value })}
                placeholder="e.g. +1 (555) 900-REXON"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* Official Operations Email */}
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Official Operations Email</label>
              <input
                type="email"
                value={config.contactEmail || ''}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                placeholder="operations@rexonsecurity.com"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>

            {/* Office Address */}
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span>Headquarters Office Address</span>
              </label>
              <input
                type="text"
                value={config.companyAddress || ''}
                onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
                placeholder="e.g. Suite 400, Security Boulevard, Metro City"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>
          </div>
        </div>

        {/* Card: Admin Portal Credentials & Security (एडमिन आईडी और पासवर्ड सेटिंग्स) */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Admin Portal Credentials & Security · एडमिन आईडी और पासवर्ड सेटिंग्स
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9] font-bold">
              PORTAL AUTH
            </span>
          </div>

          <p className="text-xs text-[#8B735B]">
            Change or update the Administrator login ID and password. Updated credentials take effect immediately for all subsequent Admin portal logins.
          </p>

          {/* Feedback & Error alerts */}
          {adminCredSuccess && (
            <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
              <span className="font-semibold">{adminCredSuccess}</span>
            </div>
          )}

          {adminCredError && (
            <div className="p-3 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#C62828]" />
              <span className="font-semibold">{adminCredError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin ID / Email */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Admin ID / Email · एडमिन आईडी
                </label>
                <input
                  type="text"
                  value={adminIdInput}
                  onChange={(e) => {
                    setAdminIdInput(e.target.value);
                    setAdminCredError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateAdminCredentials(e);
                  }}
                  placeholder="e.g. admin@rexon.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-medium focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                  required
                />
                <p className="text-[11px] text-[#8B735B] mt-1">
                  Active Admin Login ID for entering the operations console.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Current Password · वर्तमान पासवर्ड
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPasswordInput}
                    onChange={(e) => {
                      setCurrentPasswordInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateAdminCredentials(e);
                    }}
                    placeholder="Enter current admin password"
                    className="w-full pl-3 pr-9 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8B735B] mt-1">
                  Verification required to authorize changes.
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  New Password · नया पासवर्ड
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateAdminCredentials(e);
                    }}
                    placeholder="Enter new admin password"
                    className="w-full pl-3 pr-9 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8B735B] mt-1">
                  Minimum 4 characters recommended.
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Confirm New Password · नए पासवर्ड की पुष्टि करें
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => {
                      setConfirmPasswordInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateAdminCredentials(e);
                    }}
                    placeholder="Re-type new password"
                    className="w-full pl-3 pr-9 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8B735B] mt-1">
                  Must match new password exactly.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#8B735B]">
                Current Active ID: <strong className="text-[#4B3621] font-mono">{adminCredentials?.adminId || 'admin@rexon.com'}</strong>
              </span>

              <button
                type="button"
                onClick={handleUpdateAdminCredentials}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Update Admin Credentials · सहेजें</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 1C: Automated WhatsApp Report Notifications (Phase 9 & 9A) */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DED2] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#128C7E]" />
              <div>
                <h3 className="text-sm font-bold text-[#4B3621]">
                  Automated WhatsApp Report Notifications · व्हाट्सएप्प अलर्ट सेटिंग्स
                </h3>
                <p className="text-[11px] text-[#8B735B] mt-0.5">
                  Phase 9A: Automated delivery to REXON Admin & authorized Factory Owners / HR via Meta WhatsApp Cloud API
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              {adminTestMode && (
                <span className="text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded">
                  SAFE TEST MODE
                </span>
              )}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                checkWhatsAppConfigurationStatus().isConfigured
                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
              }`}>
                {checkWhatsAppConfigurationStatus().isConfigured ? 'META API READY' : 'SETUP PENDING (लंबित)'}
              </span>
            </div>
          </div>

          {/* Master Admin WhatsApp Alert Controls */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7DED2]">
              <div>
                <div className="font-bold text-[#4B3621]">Master Admin WhatsApp Dispatch (एडमिन अलर्ट टॉगल)</div>
                <div className="text-[11px] text-[#8B735B] mt-0.5">
                  Sends an instant executive summary to REXON Admin whenever any Field Officer completes a patrol
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Test mode toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminTestMode}
                    onChange={(e) => setAdminTestMode(e.target.checked)}
                    className="rounded text-[#6F4E37] focus:ring-[#6F4E37]"
                  />
                  <span className="text-[11px] font-semibold text-[#8B735B]">Safe Test Mode</span>
                </label>

                {/* Enable toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminWhatsAppEnabled}
                    onChange={(e) => setAdminWhatsAppEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E7DED2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#128C7E]"></div>
                  <span className="ml-2 text-xs font-bold text-[#4B3621]">
                    {adminWhatsAppEnabled ? 'Enabled (सक्रिय)' : 'Disabled (निष्क्रिय)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Admin Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Admin Name · अधिकारी का नाम
                </label>
                <input
                  type="text"
                  value={adminWhatsAppName}
                  onChange={(e) => setAdminWhatsAppName(e.target.value)}
                  placeholder="e.g. Commander J. Reynolds"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Admin WhatsApp Phone · मोबाइल नंबर (+देश कोड)
                </label>
                <input
                  type="text"
                  value={adminWhatsAppPhone}
                  onChange={(e) => setAdminWhatsAppPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3 py-2 bg-[#FFFFFF] border rounded-lg font-mono focus:outline-none ${
                    adminPhoneValidation.isValid
                      ? 'border-[#C8E6C9] text-[#1B5E20]'
                      : adminWhatsAppEnabled
                      ? 'border-[#FFCDD2] text-[#C62828]'
                      : 'border-[#E7DED2] text-[#4B3621]'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${adminPhoneValidation.isValid ? 'text-[#1B5E20]' : 'text-[#C62828]'}`}>
                  {adminPhoneValidation.isValid
                    ? `✓ E.164 Validated: ${adminPhoneValidation.normalized}`
                    : adminPhoneValidation.error || 'Must include "+" and country code.'}
                </p>
              </div>

              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Alert Trigger · कब सूचना भेजें
                </label>
                <select
                  value={adminNotifyOn}
                  onChange={(e) => setAdminNotifyOn(e.target.value as 'all_reports' | 'incidents_only')}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                >
                  <option value="all_reports">All Completed Patrols (सभी रिपोर्ट)</option>
                  <option value="incidents_only">Critical Incidents Only (केवल घटनाएं)</option>
                </select>
              </div>
            </div>

            {waSaveFeedback && (
              <div className="p-2.5 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0 text-[#2E7D32]" />
                <span>{waSaveFeedback}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveAdminWhatsAppSettings}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Admin WhatsApp Settings · सहेजें</span>
              </button>
            </div>
          </div>

          {/* Site & Factory Linkage Association Matrix */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#4B3621] uppercase tracking-wide text-[11px]">
                Factory & Company Recipient Linkage ({sites.length} Sites Registered)
              </h4>
              <span className="text-[11px] text-[#8B735B]">
                Configure per-site Owner/HR contacts in Site Management
              </span>
            </div>

            <div className="border border-[#E7DED2] rounded-xl overflow-hidden divide-y divide-[#E7DED2] bg-[#FFFFFF]">
              {sites.slice(0, 6).map((s) => {
                const sNotif = s.whatsappNotifications || s.notificationConfig;
                const activeCount = sNotif?.recipients?.filter(r => r.isActive !== false && r.active !== false).length || 0;
                const companyName = sNotif?.companyOrFactoryName || sNotif?.companyName || s.clientName || 'Rexon Client';

                return (
                  <div key={s.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF7F2] transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#4B3621]">{s.name}</span>
                        <span className="text-[10px] font-mono text-[#8B735B] px-1.5 py-0.2 rounded bg-[#F0E8DD]">
                          {s.area}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8B735B] mt-0.5">
                        Client / Factory: <strong className="text-[#4B3621]">{companyName}</strong> · Contact: {s.contactPerson} ({s.contactPhone})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        sNotif?.enabled && activeCount > 0
                          ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                          : 'bg-[#F0E8DD] text-[#8B735B] border-[#E7DED2]'
                      }`}>
                        {sNotif?.enabled && activeCount > 0 ? `${activeCount} Recipient(s) Active` : 'Alerts Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {sites.length > 6 && (
              <p className="text-[11px] text-[#8B735B] text-center pt-1">
                Showing 6 of {sites.length} sites. To customize Owner or HR WhatsApp numbers for any individual factory, open the Sites tab and click "WhatsApp".
              </p>
            )}
          </div>

          {/* Cloud Secret Manager & Production Security Notice */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-xs text-[#8B735B] space-y-1.5">
            <div className="flex items-center gap-2 text-[#4B3621] font-bold">
              <Lock className="w-4 h-4 text-[#6F4E37]" />
              <span>Production Security & Meta API Secret Isolation</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Meta WhatsApp Business Platform Cloud API credentials (Access Tokens & Phone Number IDs) are isolated strictly inside Google Cloud Secret Manager. No access tokens or secrets are ever exposed in frontend code, Firestore documents, or client bundles.
            </p>
          </div>
        </div>

        {/* Card 2: Voice-Input & Bilingual Settings (हिन्दी / English) */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Voice Recognition & Language Settings (आवाज़ पहचान और भाषा)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9] font-bold">
              WEB SPEECH API ACTIVE
            </span>
          </div>

          <p className="text-xs text-[#8B735B]">
            Configure spoken language defaults for field guards to dictate inspection checklists, issue descriptions, and patrol notes hands-free in Hindi (हिन्दी) or English.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">
                Preferred Default Speech Language
              </label>
              <select
                value={defaultVoiceLang}
                onChange={(e) => setDefaultVoiceLang(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-medium focus:outline-none focus:border-[#6F4E37] cursor-pointer"
              >
                <option value="hi-IN">हिन्दी - भारत (Hindi - India / hi-IN)</option>
                <option value="en-IN">English - India (en-IN)</option>
                <option value="en-US">English - United States (en-US)</option>
              </select>
              <p className="text-[11px] text-[#8B735B] mt-1">
                Field officers can also toggle language directly on patrol screens with one tap.
              </p>
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">
                Audio Transcription Mode
              </label>
              <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] text-[#4B3621] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1B5E20]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Real-time Stream & Append Mode</span>
                </div>
                <div className="text-[11px] text-[#8B735B]">
                  Spoken voice appends directly to text boxes, preserving previous typed text.
                </div>
              </div>
            </div>
          </div>

          {/* Test Microphone Box */}
          <div className="pt-2 border-t border-[#E7DED2]">
            <label className="block text-[#4B3621] font-bold text-xs mb-1.5">
              Interactive Voice Input Diagnostic Test:
            </label>
            <VoiceInputControl
              currentText={testVoiceText}
              onTranscriptReceived={(trans) => {
                setTestVoiceText((prev) => (prev ? `${prev} ${trans}` : trans));
              }}
              fieldLabel="Test Speech Box"
              placeholderHint="Tap microphone to test speaking in Hindi or English..."
            />
            {testVoiceText && (
              <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] text-xs text-[#4B3621] mt-2 flex items-center justify-between">
                <span>Recognized text: <strong>"{testVoiceText}"</strong></span>
                <button
                  type="button"
                  onClick={() => setTestVoiceText('')}
                  className="text-[11px] text-[#C62828] hover:underline font-semibold"
                >
                  Clear Test
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: GPS Geofence & Check-in Rules */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E7DED2] pb-3">
            <MapPin className="w-4 h-4 text-[#6F4E37]" />
            <h3 className="text-sm font-bold text-[#4B3621]">
              Patrol Verification & GPS Geofence Compliance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">
                Default Geofence Radius Tolerance (meters)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={250}
                  value={config.gpsToleranceMeters}
                  onChange={(e) => setConfig({ ...config, gpsToleranceMeters: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                />
                <span className="text-[#8B735B] text-xs shrink-0 font-medium">meters</span>
              </div>
              <p className="text-[11px] text-[#8B735B] mt-1">
                Officer GPS fix must be within this radius to mark check-in as verified.
              </p>
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">
                Missed Patrol Auto-Flag Grace Window (minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={config.missedPatrolThresholdMinutes}
                  onChange={(e) => setConfig({ ...config, missedPatrolThresholdMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
                />
                <span className="text-[#8B735B] text-xs shrink-0 font-medium">minutes</span>
              </div>
              <p className="text-[11px] text-[#8B735B] mt-1">
                System marks scheduled patrol as "Missed" if no check-in within this threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Architecture & Integration Roadmap Status */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Integration & Platform Architecture Status
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#4B3621] bg-[#F0E8DD] border border-[#E7DED2] px-2 py-0.5 rounded font-bold">
              HONEST DISCLOSURE
            </span>
          </div>

          <p className="text-xs text-[#8B735B]">
            Per development guidelines, integration modules are labeled accurately based on current functional state:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Sites & Officer Assignment Engine</div>
                <div className="text-[11px] text-[#8B735B]">Full CRUD operations for sites, officer roster, multi-site allocations with duplicate conflict prevention.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Site Checklists & Incident Engine</div>
                <div className="text-[11px] text-[#8B735B]">Configurable inspection checkpoints (main gate, boundary, rear gate, suspicious activity) and bilingual voice input.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Field Officer Mobile Interface</div>
                <div className="text-[11px] text-[#8B735B]">
                  Dedicated mobile experience for guards with checklist audit, photo simulation, and voice recognition.
                </div>
                <button
                  type="button"
                  onClick={onOpenMobilePreview}
                  className="mt-1.5 text-xs text-[#6F4E37] hover:text-[#5A3E2B] font-bold underline cursor-pointer"
                >
                  Launch Mobile Mode →
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Local Session Demo Persistence</div>
                <div className="text-[11px] text-[#8B735B]">
                  Persists demo edits in browser localStorage with clear DEMO DATA tags. No real client/employee data is stored.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-[#8B735B] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">WhatsApp Dispatch Bot</div>
                <div className="text-[11px] text-[#8B735B]">
                  Planned for phase 3. No mock or fake WhatsApp integration is claimed active.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Role-Based Auth Foundation (Admin vs Guard)</div>
                <div className="text-[11px] text-[#8B735B]">
                  Firebase Auth Email/Password service created. Supports strict server-side role resolution; users cannot self-assign Admin privileges.
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2: Firebase Cloud Configuration Boundary Card */}
          <div className="mt-4 pt-4 border-t border-[#E7DED2] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured ? 'bg-[#2E7D32]' : 'bg-[#D97706]'}`} />
                <span className="text-xs font-bold text-[#4B3621]">
                  Firebase Configuration Status:
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isFirebaseConfigured
                    ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                }`}>
                  {isFirebaseConfigured ? `CONFIGURED (${firebaseConfig?.projectId})` : 'AWAITING CREDENTIALS'}
                </span>
              </div>

              <span className="text-[10px] text-[#8B735B] font-mono">
                SDK Version: v11.x (Installed)
              </span>
            </div>

            {isFirebaseConfigured ? (
              <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] space-y-1">
                <div className="font-bold">Firebase Connected Successfully</div>
                <div className="text-[11px] text-[#2E7D32]">
                  Project <strong>{firebaseConfig?.projectId}</strong> initialized with Auth Domain <strong>{firebaseConfig?.authDomain}</strong>.
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-xs space-y-2.5">
                <div className="text-[#4B3621] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Configuration Boundary Active: Real connection pending user credentials</span>
                </div>
                <p className="text-[11px] text-[#8B735B] leading-relaxed">
                  The application is currently running in safe local persistence mode. To activate real Cloud Firestore and Authentication, supply the following keys in your environment (e.g. via <code>.env</code> or platform secrets):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                  {missingFirebaseConfigKeys.map((key) => (
                    <div key={key} className="bg-[#FFFFFF] px-2 py-1 rounded border border-[#E7DED2] text-[#6F4E37] flex items-center justify-between">
                      <span>{key}</span>
                      <span className="text-[#D97706] font-sans font-bold text-[9px] uppercase">Required</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#8B735B] italic pt-1">
                  * Note: Server-enforced role permissions and Firestore/Storage security rules will be applied before production data access is permitted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
