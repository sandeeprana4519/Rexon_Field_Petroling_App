import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Briefcase
} from 'lucide-react';
import { CompanyClientAccount } from '../../types';

interface ZaxonAccountSettingsViewProps {
  account: CompanyClientAccount;
  onUpdateAccount: (updatedAccount: CompanyClientAccount) => void;
}

export const ZaxonAccountSettingsView: React.FC<ZaxonAccountSettingsViewProps> = ({
  account,
  onUpdateAccount
}) => {
  // Profile Form State
  const [companyName, setCompanyName] = useState(account.companyName);
  const [contactPerson, setContactPerson] = useState(account.name || account.fullName || '');
  const [email, setEmail] = useState(account.email || '');
  const [phone, setPhone] = useState(account.phone || '');
  const [address, setAddress] = useState(account.address || '');
  const [industry, setIndustry] = useState(account.industry || '');

  // Credentials State
  const [loginId, setLoginId] = useState(account.loginId);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Save Profile Details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!companyName.trim() || !contactPerson.trim()) {
      setFeedback({
        type: 'error',
        message: 'Company name and authorized contact person are required.'
      });
      return;
    }

    const updated: CompanyClientAccount = {
      ...account,
      companyName: companyName.trim(),
      name: contactPerson.trim(),
      fullName: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      industry: industry.trim()
    };

    onUpdateAccount(updated);
    setFeedback({
      type: 'success',
      message: 'Company profile updated successfully!'
    });
  };

  // Save Credentials (Login ID and/or Password)
  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanLoginId = loginId.trim().toLowerCase();
    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanLoginId) {
      setFeedback({
        type: 'error',
        message: 'Login ID cannot be empty.'
      });
      return;
    }

    // If changing password
    let finalPassword = account.password;
    if (cleanNew) {
      if (cleanCurrent !== account.password) {
        setFeedback({
          type: 'error',
          message: 'Current password does not match.'
        });
        return;
      }

      if (cleanNew.length < 4) {
        setFeedback({
          type: 'error',
          message: 'New password must be at least 4 characters.'
        });
        return;
      }

      if (cleanNew !== cleanConfirm) {
        setFeedback({
          type: 'error',
          message: 'New password and confirm password do not match.'
        });
        return;
      }

      finalPassword = cleanNew;
    }

    const updated: CompanyClientAccount = {
      ...account,
      loginId: cleanLoginId,
      password: finalPassword
    };

    onUpdateAccount(updated);
    setFeedback({
      type: 'success',
      message: 'Login credentials updated successfully!'
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#E7DED2] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]">
              Rexon Company Suite
            </span>
            <span className="text-xs text-[#8B735B]">·</span>
            <span className="text-xs font-semibold text-[#1B5E20]">Unified Company Access</span>
          </div>
          <h2 className="text-xl font-black text-[#4B3621]">
            Company Profile & Security Settings
          </h2>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Manage your company information, registered facility address, authorized contact, and unified login credentials.
          </p>
        </div>

        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#6F4E37] text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#4B3621]">{account.companyName}</div>
            <div className="text-[10px] font-mono text-[#8B735B]">ID: {account.loginId}</div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-2xs ${
          feedback.type === 'success'
            ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]'
            : 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2E7D32]" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#C62828]" />
          )}
          <span className="font-bold leading-relaxed">{feedback.message}</span>
        </div>
      )}

      {/* Grid: Profile Form + Security Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Company Profile */}
        <div className="bg-white border border-[#E7DED2] rounded-3xl p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED2]">
            <div className="p-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#6F4E37]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#4B3621]">
                Company Profile Information
              </h3>
              <p className="text-[11px] text-[#8B735B]">
                Registered entity name, facility site address & official contact
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#4B3621] font-bold mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
              />
            </div>

            <div>
              <label className="block text-[#4B3621] font-bold mb-1">
                Registered Factory / Office Address *
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 text-[#8B735B] pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot No 42, Industrial Area Phase 2"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  Industry / Sector
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Heavy Manufacturing"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 / +1 ..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-mono font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="office@company.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-semibold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Security & Login ID / Password */}
        <div className="bg-white border border-[#E7DED2] rounded-3xl p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7DED2]">
            <div className="p-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#6F4E37]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#4B3621]">
                Login Credentials & Security
              </h3>
              <p className="text-[11px] text-[#8B735B]">
                Update single company Login ID & access password
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] text-xs text-[#8B735B] leading-relaxed">
            💡 <strong>Unified Company Login:</strong> This login ID and password can be shared securely among company owners, executives, HR, and facility heads.
          </div>

          <form onSubmit={handleUpdateSecurity} className="space-y-4 text-xs">
            {/* Login ID */}
            <div>
              <label className="block text-[#4B3621] font-bold mb-1">
                Company Login ID *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B735B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. apex.company"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-mono font-bold focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
              <p className="text-[10px] text-[#8B735B] mt-1">
                This unique ID is used to sign in to the Rexon Company Portal.
              </p>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-[#4B3621] font-bold mb-1">
                Current Password (to set a new password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B735B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-9 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full pl-3 pr-8 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#4B3621] font-bold mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-3 pr-8 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-mono focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#4B3621] hover:bg-[#322415] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>Update Login ID & Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
