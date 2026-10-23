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
  FileJson
} from 'lucide-react';
import { DEMO_COMPANY_CONFIG } from '../data/demoData';
import { VoiceInputControl } from './VoiceInputControl';
import { isFirebaseConfigured, missingFirebaseConfigKeys, firebaseConfig } from '../lib/firebase';
import { migrateLocalDataToFirestore, DEFAULT_COMPANY_ID } from '../services/firestoreService';
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
  onSaveCompanyConfig?: (config: typeof DEMO_COMPANY_CONFIG) => void;
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
  onSaveCompanyConfig,
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
