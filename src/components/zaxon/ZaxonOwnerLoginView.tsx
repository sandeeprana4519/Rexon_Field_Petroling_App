import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileCheck2,
  Briefcase
} from 'lucide-react';
import { CompanyClientAccount } from '../../types';

interface ZaxonOwnerLoginViewProps {
  accounts: CompanyClientAccount[];
  onLoginSuccess: (account: CompanyClientAccount) => void;
  onSwitchToAdmin: () => void;
  onSwitchToOfficer: () => void;
  initialLoginId?: string;
}

export const ZaxonOwnerLoginView: React.FC<ZaxonOwnerLoginViewProps> = ({
  accounts,
  onLoginSuccess,
  onSwitchToAdmin,
  onSwitchToOfficer,
  initialLoginId = ''
}) => {
  const [loginId, setLoginId] = useState(initialLoginId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = loginId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMessage('Please enter both Company Login ID and Password.');
      return;
    }

    const matchedAccount = accounts.find(
      (a) =>
        a.loginId.toLowerCase() === cleanId ||
        (a.code && a.code.toLowerCase() === cleanId) ||
        (a.companyId && a.companyId.toLowerCase() === cleanId)
    );

    if (!matchedAccount) {
      setErrorMessage('Login ID not found. Please contact your REXON Administrator.');
      return;
    }

    if (!matchedAccount.isActive) {
      setErrorMessage('This account is currently deactivated. Please contact your Administrator.');
      return;
    }

    if (matchedAccount.password !== cleanPass) {
      setErrorMessage('Incorrect password. Please verify and try again.');
      return;
    }

    // Success
    onLoginSuccess(matchedAccount);
  };

  const handleQuickFill = (acc: CompanyClientAccount) => {
    setLoginId(acc.loginId);
    setPassword(acc.password || '');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between p-4 sm:p-6 text-[#4B3621]">
      {/* Top Switcher Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
          <span className="font-semibold text-[#8B735B]">Rexon Security Cloud Gateway</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD] font-semibold transition-colors cursor-pointer text-[11px]"
          >
            REXON Admin Portal
          </button>
          <button
            type="button"
            onClick={onSwitchToOfficer}
            className="px-2.5 py-1 rounded-lg bg-[#6F4E37] text-white hover:bg-[#5A3E2B] font-semibold transition-colors cursor-pointer text-[11px]"
          >
            Field Officer Mode
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white border border-[#E7DED2] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-2xl text-[#6F4E37] shadow-2xs mb-1">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B735B] font-bold">
                CLIENT EXECUTIVE SUITE
              </span>
              <h1 className="text-2xl font-black text-[#4B3621] tracking-tight">
                Rexon Field Patrolling
              </h1>
              <h2 className="text-sm font-semibold text-[#6F4E37]">
                Company Owner & HR Portal
              </h2>
            </div>
            <p className="text-xs text-[#8B735B] max-w-xs mx-auto leading-relaxed pt-1">
              One unified company login for Owner, HR & Managers. Real-time verified patrol logs, GPS checkpoints, and incident sheets.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1.5">
                Company Login ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B735B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. apex.company or northern.castings"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono text-[#4B3621] placeholder-[#8B735B] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1.5">
                Company Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B735B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter company access password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono text-[#4B3621] placeholder-[#8B735B] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Sign In to Executive Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Section - 1 Login Per Company */}
          <div className="pt-4 border-t border-[#E7DED2] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8B735B] uppercase tracking-wider">
                Company Credentials (1 Login Per Company)
              </span>
              <span className="text-[10px] text-[#1B5E20] font-semibold">1-Tap Fill</span>
            </div>
            <p className="text-[10px] text-[#8B735B]">
              This single login ID & password can be shared with company leadership, HR, and facility managers.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] border border-[#E7DED2] text-left transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#4B3621] group-hover:text-[#6F4E37] truncate">
                        {acc.companyName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#E8D8C5] border border-[#D5C2AD] text-[#4B3621] shrink-0">
                        Company Login
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-[#6F4E37] mt-0.5">
                      ID: {acc.loginId}
                    </div>
                    {acc.address && (
                      <div className="text-[10px] text-[#8B735B] truncate mt-0.5">
                        📍 {acc.address}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[#4B3621] bg-white px-2 py-1 rounded border border-[#E7DED2] shrink-0">
                    {acc.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-[11px] text-[#8B735B] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#1B5E20]" />
            <span>Strict Company-Level Data Isolation Enforced</span>
          </p>
          <p className="text-[10px] text-[#8B735B]">
            Need credentials or password reset? Contact REXON Operations Central Desk.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center py-2 text-[11px] text-[#8B735B]">
        <span>© {new Date().getFullYear()} Rexon Field Patrolling · Built on REXON Verified Security Engine</span>
      </div>
    </div>
  );
};
