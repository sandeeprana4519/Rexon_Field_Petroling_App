import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Phone,
  User,
  Shield,
  Save,
  HelpCircle,
  Smartphone,
  ExternalLink,
  Info,
  Clock
} from 'lucide-react';
import {
  Site,
  SiteWhatsAppRecipient,
  SiteNotificationConfig,
  WhatsAppNotificationRole
} from '../types';
import {
  validateWhatsAppPhoneNumber,
  checkWhatsAppConfigurationStatus,
  WHATSAPP_TEMPLATE_SPEC
} from '../services/whatsappNotificationService';

interface SiteNotificationModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotificationConfig: (siteId: string, config: SiteNotificationConfig) => void;
}

const ROLE_OPTIONS: WhatsAppNotificationRole[] = [
  'Owner',
  'Factory Manager',
  'HR',
  'Security Head',
  'Operations Desk'
];

export const SiteNotificationModal: React.FC<SiteNotificationModalProps> = ({
  site,
  isOpen,
  onClose,
  onSaveNotificationConfig
}) => {
  if (!isOpen) return null;

  // Initialize config from site or sensible defaults
  const existingConfig = site.whatsappNotifications || {
    enabled: false,
    companyOrFactoryName: site.clientName || site.name,
    testMode: true,
    recipients: []
  };

  const [enabled, setEnabled] = useState<boolean>(existingConfig.enabled);
  const [companyOrFactoryName, setCompanyOrFactoryName] = useState<string>(
    existingConfig.companyOrFactoryName || site.clientName || site.name
  );
  const [testMode, setTestMode] = useState<boolean>(
    existingConfig.testMode !== undefined ? existingConfig.testMode : true
  );
  const [recipients, setRecipients] = useState<SiteWhatsAppRecipient[]>(
    existingConfig.recipients && existingConfig.recipients.length > 0
      ? existingConfig.recipients
      : [
          {
            id: `rec-default-${Date.now()}`,
            name: site.contactPerson || 'Factory Owner',
            role: 'Owner',
            phone: site.contactPhone && site.contactPhone.startsWith('+') ? site.contactPhone : '+91 9876543210',
            isActive: true,
            notifyOnAllPatrols: true,
            notifyOnIncidentsOnly: false
          }
        ]
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'sample' | 'template'>('sample');

  const configStatus = checkWhatsAppConfigurationStatus();

  // Add a new empty recipient row
  const handleAddRecipient = () => {
    setValidationError(null);
    const newRecipient: SiteWhatsAppRecipient = {
      id: `rec-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      role: 'HR',
      phone: '+91 ',
      isActive: true,
      notifyOnAllPatrols: true,
      notifyOnIncidentsOnly: false
    };
    setRecipients([...recipients, newRecipient]);
  };

  // Remove a recipient row
  const handleRemoveRecipient = (id: string) => {
    setValidationError(null);
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  // Update a recipient property
  const handleUpdateRecipient = (
    id: string,
    field: keyof SiteWhatsAppRecipient,
    value: any
  ) => {
    setValidationError(null);
    setRecipients(
      recipients.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (enabled) {
      if (!companyOrFactoryName.trim()) {
        setValidationError('कृपया कंपनी या फैक्ट्री का नाम दर्ज करें (Company or factory name is required).');
        return;
      }

      if (recipients.length === 0) {
        setValidationError('कम से कम एक व्हाट्सएप प्राप्तकर्ता जोड़ें (At least one recipient is required).');
        return;
      }

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        if (!r.name.trim()) {
          setValidationError(`प्राप्तकर्ता #${i + 1} का नाम दर्ज करें (Recipient name is required).`);
          return;
        }

        const phoneValidation = validateWhatsAppPhoneNumber(r.phone);
        if (!phoneValidation.isValid) {
          setValidationError(
            `प्राप्तकर्ता "${r.name || `#${i + 1}`}" का फ़ोन नंबर अमान्य है: ${phoneValidation.error}`
          );
          return;
        }
      }
    }

    const updatedConfig: SiteNotificationConfig = {
      enabled,
      companyOrFactoryName: companyOrFactoryName.trim(),
      testMode,
      templateName: WHATSAPP_TEMPLATE_SPEC.templateName,
      recipients: recipients.map((r) => ({
        ...r,
        name: r.name.trim(),
        phone: r.phone.trim()
      }))
    };

    onSaveNotificationConfig(site.id, updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#FAF7F2] border-b border-[#E7DED2] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#128C7E] shadow-2xs">
              <MessageSquare className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#4B3621]">
                  Automated WhatsApp Report Alerts
                </h2>
                <span className="text-[10px] font-mono font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] px-2 py-0.5 rounded">
                  OFFICIAL META CLOUD API
                </span>
              </div>
              <p className="text-xs text-[#8B735B]">
                Site: <strong>{site.name}</strong> ({site.code}) · Automatic notifications for Factory Owner & HR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#4B3621]">
          {/* Feedback & Error alerts */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C62828]" />
              <div className="font-semibold">{validationError}</div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
              <span className="font-bold">
                व्हाट्सएप नोटिफिकेशन सेटिंग्स सफलतापूर्वक सहेजी गईं (WhatsApp alerts saved successfully!)
              </span>
            </div>
          )}

          {/* Master Enable & Test Mode Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Enable Notifications Switch */}
            <div className={`p-4 rounded-xl border transition-all ${
              enabled
                ? 'bg-[#E8F5E9]/50 border-[#A5D6A7]'
                : 'bg-[#FAF7F2] border-[#E7DED2]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-[#4B3621] block">
                    Automated WhatsApp Alerts
                  </span>
                  <span className="text-[11px] text-[#8B735B]">
                    Send summary to Owner/HR on patrol submission
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E7DED2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E7DED2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>
            </div>

            {/* Test Mode Switch */}
            <div className={`p-4 rounded-xl border transition-all ${
              testMode
                ? 'bg-[#FFF8E1] border-[#FFE082]'
                : 'bg-[#FAF7F2] border-[#E7DED2]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#4B3621]">Safe Test Mode</span>
                    <span className="text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.2 rounded">
                      RECOMMENDED
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8B735B]">
                    Stages notifications in logs without sending real provider messages
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E7DED2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E7DED2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D97706]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Company / Factory Display Name */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E7DED2] space-y-2">
            <label className="block text-xs font-bold text-[#4B3621] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#6F4E37]" />
              <span>Company / Factory Name in WhatsApp Message · कंपनी/फैक्ट्री का नाम</span>
            </label>
            <input
              type="text"
              value={companyOrFactoryName}
              onChange={(e) => setCompanyOrFactoryName(e.target.value)}
              placeholder="e.g. Apex Rail Freight Yard or Martin Sterling Enterprises"
              className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs font-semibold text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
            />
            <p className="text-[11px] text-[#8B735B]">
              This name appears in the WhatsApp greeting line: <em>"A security patrol check-in has been completed for *[Company Name]*"</em>.
            </p>
          </div>

          {/* Authorized Recipients Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#4B3621] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#6F4E37]" />
                  <span>Authorized WhatsApp Recipients ({recipients.length}) · अधिकृत प्राप्तकर्ता</span>
                </h3>
                <p className="text-[11px] text-[#8B735B]">
                  Owners, HR managers, and plant heads who will receive verified patrol summaries.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRecipient}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Recipient</span>
              </button>
            </div>

            {recipients.length === 0 ? (
              <div className="p-6 text-center bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs text-[#8B735B]">
                No WhatsApp recipients configured yet. Click <strong>"Add Recipient"</strong> to add an owner or HR manager.
              </div>
            ) : (
              <div className="space-y-3">
                {recipients.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#E7DED2] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#F0E8DD] text-[#6F4E37] font-bold text-[11px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-[#4B3621]">
                          {rec.name || 'New Recipient'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E7DED2] text-[#8B735B]">
                          {rec.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-[#4B3621] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rec.isActive}
                            onChange={(e) => handleUpdateRecipient(rec.id, 'isActive', e.target.checked)}
                            className="rounded accent-[#25D366]"
                          />
                          <span>Active</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(rec.id)}
                          className="p-1 text-[#8B735B] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded transition-colors cursor-pointer ml-1"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Name */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B3621] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={rec.name}
                          onChange={(e) => handleUpdateRecipient(rec.id, 'name', e.target.value)}
                          placeholder="e.g. Martin Sterling"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                          required
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B3621] mb-1">
                          Designation / Role
                        </label>
                        <select
                          value={rec.role}
                          onChange={(e) => handleUpdateRecipient(rec.id, 'role', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* WhatsApp Phone */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center justify-between">
                          <span>WhatsApp Phone *</span>
                          <span className="text-[10px] text-[#8B735B] font-mono">with country code</span>
                        </label>
                        <input
                          type="text"
                          value={rec.phone}
                          onChange={(e) => handleUpdateRecipient(rec.id, 'phone', e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs font-mono text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                          required
                        />
                      </div>
                    </div>

                    {/* Filter Preferences */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#8B735B]">
                      <span className="font-semibold text-[#4B3621]">Trigger Preferences:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`trigger-${rec.id}`}
                          checked={!rec.notifyOnIncidentsOnly}
                          onChange={() => {
                            handleUpdateRecipient(rec.id, 'notifyOnAllPatrols', true);
                            handleUpdateRecipient(rec.id, 'notifyOnIncidentsOnly', false);
                          }}
                          className="accent-[#6F4E37]"
                        />
                        <span>All Completed Patrols (Every routine check)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`trigger-${rec.id}`}
                          checked={!!rec.notifyOnIncidentsOnly}
                          onChange={() => {
                            handleUpdateRecipient(rec.id, 'notifyOnAllPatrols', false);
                            handleUpdateRecipient(rec.id, 'notifyOnIncidentsOnly', true);
                          }}
                          className="accent-[#6F4E37]"
                        />
                        <span className="text-[#C62828] font-medium">⚠️ Incidents Only (Alert on breach / issue found)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Preview Section */}
          <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-2">
              <span className="font-bold text-xs text-[#4B3621] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp Message Preview (प्राप्तकर्ता को दिखने वाला संदेश)</span>
              </span>

              <div className="flex items-center gap-1 bg-[#FFFFFF] p-0.5 rounded border border-[#E7DED2]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('sample')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    previewTab === 'sample'
                      ? 'bg-[#6F4E37] text-white'
                      : 'text-[#8B735B] hover:text-[#4B3621]'
                  }`}
                >
                  Formatted Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('template')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    previewTab === 'template'
                      ? 'bg-[#6F4E37] text-white'
                      : 'text-[#8B735B] hover:text-[#4B3621]'
                  }`}
                >
                  Template Spec
                </button>
              </div>
            </div>

            {previewTab === 'sample' ? (
              <div className="p-3.5 bg-[#ECE5DD] rounded-xl border border-[#D5C7B5] space-y-2 text-[#111B21] font-sans shadow-2xs">
                <div className="bg-[#FFFFFF] p-3 rounded-lg max-w-sm space-y-2 shadow-xs text-[11px] leading-relaxed">
                  <div className="font-bold text-[#128C7E] flex items-center gap-1">
                    <span>🛡️ REXON SECURITY PATROL AUDIT</span>
                  </div>
                  <p>
                    Hello <strong>{recipients[0]?.name || 'Martin Sterling'}</strong>,
                    <br />
                    A security patrol check-in has been completed for <strong>*{companyOrFactoryName || site.name}*</strong>.
                  </p>
                  <div className="space-y-0.5 font-mono text-[10px] bg-[#FAF7F2] p-2 rounded border border-[#E7DED2]">
                    <div>• <strong>Site:</strong> {site.name} ({site.area})</div>
                    <div>• <strong>Report ID:</strong> PTR-2026-001</div>
                    <div>• <strong>Officer:</strong> Sandeep Rana (Badge: RF-101)</div>
                    <div>• <strong>Time:</strong> Today · 10:45 AM</div>
                    <div className="text-[#2E7D32]">• <strong>Status:</strong> ✅ ALL CLEAR &amp; VERIFIED</div>
                    <div>• <strong>Checkpoints:</strong> 5 of 5 verified</div>
                    <div>• <strong>Incidents:</strong> 0 Clean</div>
                  </div>
                  <p className="text-[10px] text-[#54656F]">
                    Review verified checklist &amp; GPS audit:
                    <br />
                    <span className="text-[#027EB5] underline break-all">
                      {window.location.origin}/?tab=reports&amp;reportId=rep-101
                    </span>
                  </p>
                  <div className="text-[9px] text-[#667781] text-right italic pt-1">
                    Rexon Automated Security Dispatch · 10:46 AM
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-[11px] text-[#4B3621]">
                <div className="p-2.5 bg-[#FFFFFF] rounded border border-[#E7DED2] whitespace-pre-wrap leading-relaxed">
                  {WHATSAPP_TEMPLATE_SPEC.sampleBody}
                </div>
                <div className="text-[10px] text-[#8B735B]">
                  <strong>Meta Template Name:</strong> <code>rexon_patrol_summary_v1</code> (Category: <code>UTILITY</code>)
                </div>
              </div>
            )}
          </div>

          {/* Configuration Status Notice */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#4B3621]">
                Backend Service Status: {configStatus.isConfigured ? 'Active' : 'Setup Pending'}
              </span>
              <p className="text-[11px] text-[#8B735B] leading-relaxed">
                {testMode
                  ? 'Safe Test Mode is active. Notifications will be recorded in report audit logs without consuming WhatsApp Cloud API units.'
                  : configStatus.message}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E7DED2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm hover:shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save WhatsApp Alert Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
