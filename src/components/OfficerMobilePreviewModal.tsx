import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Shield,
  QrCode,
  Camera,
  CheckCircle2,
  MapPin,
  Send
} from 'lucide-react';
import { Site, FieldOfficer } from '../types';

interface OfficerMobilePreviewModalProps {
  site: Site;
  officer: FieldOfficer;
  onClose: () => void;
  onSimulateCompletePatrol: (siteId: string, officerId: string) => void;
}

export const OfficerMobilePreviewModal: React.FC<OfficerMobilePreviewModalProps> = ({
  site,
  officer,
  onClose,
  onSimulateCompletePatrol
}) => {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    'chk-1': true,
    'chk-2': true,
    'chk-3': false,
    'chk-4': false,
    'chk-5': false
  });

  const [activeStep, setActiveStep] = useState<'patrol' | 'scan' | 'report_incident'>('patrol');
  const [photoCount, setPhotoCount] = useState(2);
  const [officerNotes, setOfficerNotes] = useState('South gate perimeter secure, vehicle bay 4 checked.');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSimulateSubmit = () => {
    setIsSubmitted(true);
    onSimulateCompletePatrol(site.id, officer.id);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="flex flex-col items-center max-w-sm w-full">
        {/* Simulator Header Bar */}
        <div className="w-full flex items-center justify-between text-xs text-[#8B735B] mb-2 px-2">
          <div className="flex items-center gap-1.5 text-[#6F4E37] font-semibold">
            <Smartphone className="w-4 h-4" />
            <span>Mobile Officer App Simulator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Bezel */}
        <div className="w-full bg-[#3D2C1E] border-4 border-[#5A402D] rounded-[38px] p-3 shadow-2xl overflow-hidden relative flex flex-col h-[680px]">
          {/* Phone Speaker Notch */}
          <div className="w-28 h-4 bg-[#2A1D13] rounded-b-xl mx-auto flex items-center justify-center mb-2">
            <div className="w-10 h-1 bg-[#5A402D] rounded-full" />
          </div>

          {/* Officer App Content */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-[#F8F5EF] border border-[#E7DED2] flex flex-col justify-between p-3.5 space-y-3 text-[#4B3621]">
            {/* App Topbar */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DED2]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8D8C5] text-[#6F4E37] flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4B3621] leading-tight">
                      Rexon Field App
                    </div>
                    <div className="text-[10px] text-[#8B735B]">
                      Officer {officer.name} ({officer.badgeNumber})
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-bold">
                  ON DUTY
                </span>
              </div>

              {/* Site Assignment Banner */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-[#E7DED2] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#8B735B]">
                  Active Site Assignment
                </div>
                <div className="text-xs font-bold text-[#4B3621] break-words leading-snug">
                  {site.name}
                </div>
                <div className="text-[10px] text-[#8B735B] flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-[#6F4E37] shrink-0 mt-0.5" />
                  <span className="break-words leading-tight">Geofence Status: Verified within 15m (Demo)</span>
                </div>
              </div>
            </div>

            {/* Step: Main Patrol Checklist View */}
            {activeStep === 'patrol' && (
              <div className="flex-1 overflow-y-auto space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-[#4B3621]">
                    Checkpoint Checklist
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#6F4E37] shrink-0">
                    {Object.values(checks).filter(Boolean).length}/{site.checklistTemplates.length} Done
                  </span>
                </div>

                <div className="space-y-1.5">
                  {site.checklistTemplates.map((template) => {
                    const isChecked = !!checks[template.id];
                    return (
                      <div
                        key={template.id}
                        onClick={() => toggleCheck(template.id)}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#E8F5E9]/50 border-emerald-300 text-[#1B5E20]'
                            : 'bg-white border-[#E7DED2] text-[#4B3621] hover:border-[#D5C2AD]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'border border-[#D5C2AD]'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[11px] font-medium leading-tight ${isChecked ? 'text-[#1B5E20] font-semibold' : 'text-[#4B3621]'}`}>
                            {template.title}
                          </div>
                          <div className="text-[9px] font-mono text-[#8B735B] mt-0.5">
                            {template.category} {template.isCritical && '· CRITICAL'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Evidence Photo Captures */}
                <div className="p-2.5 rounded-xl bg-white border border-[#E7DED2] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#4B3621] font-medium">Checkpoint Photos</span>
                    <span className="text-[10px] font-mono text-[#8B735B]">{photoCount} Captured</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoCount((c) => c + 1)}
                      className="flex-1 py-1.5 rounded-lg bg-[#F8F5EF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep('scan')}
                      className="flex-1 py-1.5 rounded-lg bg-[#F8F5EF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>Scan NFC/QR</span>
                    </button>
                  </div>
                </div>

                {/* Officer Remarks Field */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8B735B] mb-1">
                    Officer Field Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-hidden focus:border-[#6F4E37]"
                  />
                </div>
              </div>
            )}

            {/* Step: Simulated QR / NFC Scan */}
            {activeStep === 'scan' && (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-36 h-36 border-2 border-dashed border-[#6F4E37] rounded-2xl flex flex-col items-center justify-center bg-white p-4">
                  <QrCode className="w-16 h-16 text-[#6F4E37] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#8B735B] mt-2">Align Checkpoint Tag</span>
                </div>
                <div className="text-xs text-[#4B3621] font-semibold">
                  NFC / QR Tag Detected: GATE-4-NORTH
                </div>
                <p className="text-[11px] text-[#8B735B]">
                  Simulating optical checkpoint reading at {site.name}.
                </p>
                <button
                  onClick={() => {
                    setChecks((c) => ({ ...c, 'chk-1': true, 'chk-2': true }));
                    setActiveStep('patrol');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#6F4E37] text-white font-bold text-xs hover:bg-[#5C3F2B] transition-colors"
                >
                  Confirm Tag Verification
                </button>
              </div>
            )}

            {/* Bottom Controls / Complete Patrol */}
            <div className="pt-2 border-t border-[#E7DED2] space-y-2">
              {isSubmitted ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs text-center font-bold">
                  ✓ Patrol Report Submitted Successfully!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStep(activeStep === 'patrol' ? 'scan' : 'patrol')}
                    className="p-2 rounded-xl bg-white border border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]"
                    title="Toggle scan"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSimulateSubmit}
                    className="flex-1 py-2 rounded-xl bg-[#6F4E37] hover:bg-[#5C3F2B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Patrol Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Smartphone Bottom Home Bar */}
          <div className="w-24 h-1 bg-[#5A402D] rounded-full mx-auto mt-2" />
        </div>

        <p className="text-[11px] text-[#8B735B] text-center mt-3">
          Interactive simulator of the field officer mobile patrol experience.
        </p>
      </div>
    </div>
  );
};
