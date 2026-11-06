import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Headphones,
  Copy,
  Radio,
  ExternalLink
} from 'lucide-react';
import {
  ControlRoomContacts,
  DEFAULT_CONTROL_ROOM_CONTACTS,
  loadControlRoomContacts,
  saveControlRoomContacts,
  getCallUrl,
  getWhatsAppUrl,
  WhatsAppIcon
} from '../utils/contactUtils';

interface ManageControlRoomContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedNotification?: (message: string) => void;
}

export const ManageControlRoomContactsModal: React.FC<ManageControlRoomContactsModalProps> = ({
  isOpen,
  onClose,
  onSavedNotification
}) => {
  const [contacts, setContacts] = useState<ControlRoomContacts>(() => loadControlRoomContacts());
  const [helplineInput, setHelplineInput] = useState(contacts.helplinePhone);
  const [callAdminInput, setCallAdminInput] = useState(contacts.callAdminPhone);
  const [whatsappInput, setWhatsappInput] = useState(contacts.whatsappNumber);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when opened
  useEffect(() => {
    if (isOpen) {
      const current = loadControlRoomContacts();
      setContacts(current);
      setHelplineInput(current.helplinePhone);
      setCallAdminInput(current.callAdminPhone);
      setWhatsappInput(current.whatsappNumber);
      setFeedback(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyHelplineToAll = () => {
    const trimmed = helplineInput.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', text: 'कृपया पहले हेल्पलाइन नंबर दर्ज करें (Please enter helpline number first).' });
      return;
    }
    setCallAdminInput(trimmed);
    setWhatsappInput(trimmed);
    setFeedback({ type: 'success', text: 'हेल्पलाइन नंबर को कॉल और व्हाट्सऐप फ़ील्ड में कॉपी कर दिया गया।' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleResetToDefault = () => {
    setHelplineInput(DEFAULT_CONTROL_ROOM_CONTACTS.helplinePhone);
    setCallAdminInput(DEFAULT_CONTROL_ROOM_CONTACTS.callAdminPhone);
    setWhatsappInput(DEFAULT_CONTROL_ROOM_CONTACTS.whatsappNumber);
    setFeedback({ type: 'success', text: 'डिफ़ॉल्ट नंबर सेट किए गए (Default contacts restored).' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHelpline = helplineInput.trim();
    const cleanCallAdmin = callAdminInput.trim();
    const cleanWhatsapp = whatsappInput.trim();

    if (!cleanHelpline) {
      setFeedback({ type: 'error', text: 'कंट्रोल रूम हेल्पलाइन नंबर आवश्यक है (Helpline number is required).' });
      return;
    }
    if (!cleanCallAdmin) {
      setFeedback({ type: 'error', text: 'कॉल एडमिन नंबर आवश्यक है (Call Admin number is required).' });
      return;
    }
    if (!cleanWhatsapp) {
      setFeedback({ type: 'error', text: 'व्हाट्सऐप नंबर आवश्यक है (WhatsApp number is required).' });
      return;
    }

    setIsSaving(true);

    try {
      const newContacts: ControlRoomContacts = {
        helplinePhone: cleanHelpline,
        callAdminPhone: cleanCallAdmin,
        whatsappNumber: cleanWhatsapp,
        updatedAt: new Date().toISOString()
      };

      saveControlRoomContacts(newContacts);
      setContacts(newContacts);
      setIsSaving(false);
      setFeedback({
        type: 'success',
        text: 'कंट्रोल रूम हेल्पलाइन व संपर्क नंबर सफलतापूर्वक अपडेट किए गए (Control Room Contacts updated across all portals).'
      });
      onSavedNotification?.('कंट्रोल रूम संपर्क नंबर अपडेट कर दिए गए हैं (Control Room contacts updated).');

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setFeedback({ type: 'error', text: err?.message || 'Failed to update contacts.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#4B3621]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl border border-[#E7DED2] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="control-room-contacts-title"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#E7DED2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shadow-xs">
              <Headphones className="w-5 h-5 text-[#6F4E37]" />
            </div>
            <div>
              <h2 id="control-room-contacts-title" className="text-base sm:text-lg font-bold text-[#4B3621] leading-tight">
                Manage Control Room Contacts
              </h2>
              <p className="text-xs text-[#8B735B]">
                अपडेट कंट्रोल रूम हेल्पलाइन व कॉन्टैक्ट सेटिंग्स
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8B735B] hover:text-[#4B3621] rounded-lg hover:bg-[#E8D8C5]/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-[#8B735B] leading-relaxed">
            यहाँ से आप REXON फील्ड ऑफिसर पोर्टल और कंपनी पोर्टल के टॉप हेडर बार में दिखने वाले हेल्पलाइन नंबर,
            कॉल और व्हाट्सऐप सपोर्ट नंबर अपडेट कर सकते हैं।
          </p>

          {/* Quick Helper Button */}
          <div className="flex items-center justify-between bg-[#FAF7F2] border border-[#E7DED2] p-2.5 rounded-xl text-xs">
            <span className="text-[#8B735B]">तीनों के लिए एक ही नंबर?</span>
            <button
              type="button"
              onClick={handleCopyHelplineToAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#D5C2AD] rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <Copy className="w-3 h-3 text-[#6F4E37]" />
              <span>Copy Helpline to All</span>
            </button>
          </div>

          {/* Field 1: Helpline Display Phone */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#4B3621]">
              1. Control Room / Admin Desk Phone Number (हेल्पलाइन स्ट्रिप में प्रदर्शित) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B735B]">
                <Radio className="w-4 h-4 text-[#6F4E37]" />
              </span>
              <input
                type="text"
                required
                value={helplineInput}
                onChange={(e) => setHelplineInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono font-bold text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-[#8B735B]">
              यह नंबर हेडर बार में "कंट्रोल रूम हेल्पलाइन (Admin Desk): ..." के रूप में दिखाई देता है।
            </p>
          </div>

          {/* Field 2: Direct Call Admin Phone */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#4B3621]">
              2. Direct Call Phone Number ("Call Admin" बटन डायल) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B735B]">
                <Phone className="w-4 h-4 text-[#6F4E37]" />
              </span>
              <input
                type="text"
                required
                value={callAdminInput}
                onChange={(e) => setCallAdminInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono font-bold text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-[#8B735B]">
              जब गार्ड या क्लाइंट "Call Admin" पर क्लिक करेंगे तो इस नंबर पर कॉल लगेगी (tel: लिंक)।
            </p>
          </div>

          {/* Field 3: WhatsApp Number */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#4B3621]">
              3. WhatsApp Number ("WhatsApp" बटन चैट) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#25D366]">
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              </span>
              <input
                type="text"
                required
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono font-bold text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-[#8B735B]">
              "WhatsApp" पर क्लिक करने पर इस नंबर पर डायरेक्ट चैट विंडो खुलेगी (wa.me लिंक)।
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2">
            <div className="text-[11px] font-bold text-[#8B735B] uppercase tracking-wider flex items-center justify-between">
              <span>लाइव प्रीव्यू (Real-Time Header Strip Preview)</span>
              <span className="text-[9px] text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded font-mono font-bold">
                LIVE
              </span>
            </div>

            <div className="p-2.5 bg-white border border-[#E7DED2] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse shrink-0" />
                <span className="text-[#8B735B] truncate text-[11px]">
                  कंट्रोल रूम हेल्पलाइन (Admin Desk):{' '}
                  <strong className="text-[#4B3621] font-mono">
                    {helplineInput.trim() || '+91 98765 43210'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-[#4B3621] border border-[#E7DED2] rounded-md font-bold text-[10px] shadow-2xs">
                  <Phone className="w-2.5 h-2.5 text-[#6F4E37]" />
                  <span>Call Admin</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#25D366] text-white rounded-md font-bold text-[10px] shadow-2xs">
                  <WhatsAppIcon className="w-2.5 h-2.5 text-white" />
                  <span>WhatsApp</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-semibold text-[#8B735B] hover:text-[#4B3621] bg-transparent hover:bg-[#FAF7F2] border border-transparent hover:border-[#E7DED2] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#8B735B] hover:text-[#4B3621] bg-[#FAF7F2] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'सहेज रहे हैं...' : 'Save / Update'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
