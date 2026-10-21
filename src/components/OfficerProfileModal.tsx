import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  Mail,
  Compass,
  Clock,
  Building2,
  Lock,
  LogOut,
  Save,
  ShieldCheck
} from 'lucide-react';
import { FieldOfficer, Site } from '../types';

interface OfficerProfileModalProps {
  officer: FieldOfficer;
  assignedSites: Site[];
  onClose: () => void;
  onUpdatePassword: (officerId: string, newPassword: string) => void;
  onLogout: () => void;
}

export const OfficerProfileModal: React.FC<OfficerProfileModalProps> = ({
  officer,
  assignedSites,
  onClose,
  onUpdatePassword,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectivePassword = officer.password || 'rexon123';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (currentPassword !== effectivePassword) {
      setErrorMessage('Current password does not match our records. Please verify and try again.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onUpdatePassword(officer.id, newPassword);
      setIsSubmitting(false);
      setSuccessMessage('Password updated successfully! Your new password will be required on your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6F4E37] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {officer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4B3621] leading-tight">
                {officer.name}
              </h3>
              <p className="text-xs text-[#8B735B] font-mono mt-0.5">
                {officer.employeeId} · Badge {officer.badgeNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Profile vs Settings */}
        <div className="grid grid-cols-2 p-2 bg-[#FAF7F2] border-b border-[#E7DED2] gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] shadow-xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Officer Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] shadow-xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Settings & Password</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[65vh] space-y-4 bg-white">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Duty Status Strip */}
              <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-between text-xs text-[#1B5E20]">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                  <span>Authorized Field Guard Personnel</span>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#C8E6C9]">
                  ACTIVE DUTY
                </span>
              </div>

              {/* Personal & Employment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[10px] font-mono uppercase font-bold text-[#8B735B]">Official Email</div>
                  <div className="font-semibold text-[#4B3621] mt-0.5 break-all flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                    <span>{officer.email || `${officer.name.toLowerCase().replace(/\s+/g, '')}@rexon.com`}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[10px] font-mono uppercase font-bold text-[#8B735B]">Contact Phone</div>
                  <div className="font-semibold text-[#4B3621] mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                    <span>{officer.phone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[10px] font-mono uppercase font-bold text-[#8B735B]">Assigned Patrol Zone</div>
                  <div className="font-semibold text-[#4B3621] mt-0.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                    <span>{officer.area}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[10px] font-mono uppercase font-bold text-[#8B735B]">Shift Schedule</div>
                  <div className="font-semibold text-[#4B3621] mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                    <span>{officer.shift} Shift (Active Roster)</span>
                  </div>
                </div>
              </div>

              {/* Assigned Monitored Sites */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#4B3621]">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Your Allocated Monitored Sites ({assignedSites.length})</span>
                  </span>
                  <span className="text-[11px] text-[#8B735B] font-mono font-normal">
                    Authorized Scope
                  </span>
                </div>

                <div className="divide-y divide-[#E7DED2] border border-[#E7DED2] rounded-xl overflow-hidden bg-[#FFFFFF] max-h-44 overflow-y-auto">
                  {assignedSites.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#8B735B]">
                      No sites specifically allocated yet. Assigned to {officer.area}.
                    </div>
                  ) : (
                    assignedSites.map((site, index) => (
                      <div key={site.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-[#FAF7F2]">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-[#4B3621] truncate">{site.name}</div>
                          <div className="text-[11px] text-[#8B735B] truncate">{site.clientName} · {site.address}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] shrink-0">
                          {site.code}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Security Privacy Notice */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-[11px] text-[#8B735B] leading-relaxed">
                <strong className="text-[#4B3621] block mb-0.5">Access Boundary Protection:</strong>
                Your login credentials restrict camera evidence uploads, patrol check-ins, and inspection submissions strictly to your allocated sites and duty zone.
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS & PASSWORD UPDATE */}
          {activeTab === 'settings' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-xs text-[#8B735B]">
                <div className="font-bold text-[#4B3621] flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>Update Officer Security Password</span>
                </div>
                <div>
                  Enter your current password followed by your new password to secure your field login.
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-xs text-[#C62828] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#4B3621] mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (demo: rexon123)"
                    className="w-full px-3 py-2 pr-10 text-xs bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#4B3621] mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password (min. 4 characters)"
                    className="w-full px-3 py-2 pr-10 text-xs bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#4B3621] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 pr-10 text-xs bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#6F4E37] hover:bg-[#5A3E2B] disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between gap-3 text-xs shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#C62828] hover:bg-[#FFEBEE] border border-transparent hover:border-[#FFCDD2] transition-colors cursor-pointer font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Account</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
