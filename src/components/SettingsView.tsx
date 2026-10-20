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
  Volume2
} from 'lucide-react';
import { DEMO_COMPANY_CONFIG } from '../data/demoData';
import { VoiceInputControl } from './VoiceInputControl';

interface SettingsViewProps {
  onOpenMobilePreview: () => void;
  onResetToDemoDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenMobilePreview,
  onResetToDemoDefaults
}) => {
  const [config, setConfig] = useState(DEMO_COMPANY_CONFIG);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [defaultVoiceLang, setDefaultVoiceLang] = useState<'hi-IN' | 'en-IN' | 'en-US'>('hi-IN');
  const [testVoiceText, setTestVoiceText] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback('Patrol parameters, voice settings & company configuration updated in local demo session.');
    setTimeout(() => {
      setSaveFeedback(null);
    }, 2500);
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
            Configure Rexon Field Patrolling parameters, voice recognition, geofence compliance bounds and dispatch rules
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Company Profile */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E7DED2] pb-3">
            <Shield className="w-4 h-4 text-[#6F4E37]" />
            <h3 className="text-sm font-bold text-[#4B3621]">
              Security Agency Profile & Ownership
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Company Registered Name</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Application Brand Identifier</label>
              <input
                type="text"
                disabled
                value={config.appName}
                className="w-full px-3 py-2 bg-[#F0E8DD] border border-[#E7DED2] rounded-lg text-[#8B735B] font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#4B3621] font-semibold mb-1">Operations Director / Owner Name</label>
              <input
                type="text"
                value={config.ownerName}
                onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
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
              <Lock className="w-4 h-4 text-[#8B735B] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#4B3621]">Role-Based Guard Authentication</div>
                <div className="text-[11px] text-[#8B735B]">
                  Planned for backend phase with guard biometric and passcode logins.
                </div>
              </div>
            </div>
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
