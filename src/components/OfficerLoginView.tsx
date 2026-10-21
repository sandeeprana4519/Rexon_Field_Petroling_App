import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Building2,
  KeyRound,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { FieldOfficer } from '../types';

interface OfficerLoginViewProps {
  officers: FieldOfficer[];
  onLoginSuccess: (officer: FieldOfficer) => void;
  onSwitchToOwnerMode: () => void;
}

export const OfficerLoginView: React.FC<OfficerLoginViewProps> = ({
  officers,
  onLoginSuccess,
  onSwitchToOwnerMode
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active officers available for quick demo selection
  const activeOfficers = officers.filter((o) => o.employmentStatus === 'active');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your Email ID or Officer Registration ID.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching officer by email, employeeId, or badgeNumber
      const matched = officers.find((o) => {
        const emailMatch = o.email && o.email.toLowerCase() === cleanId;
        const empIdMatch = o.employeeId && o.employeeId.toLowerCase() === cleanId;
        const badgeMatch = o.badgeNumber && o.badgeNumber.toLowerCase() === cleanId;
        const nameMatch = o.name && o.name.toLowerCase() === cleanId;
        return emailMatch || empIdMatch || badgeMatch || nameMatch;
      });

      if (!matched) {
        setIsSubmitting(false);
        setErrorMessage('No officer found with this Email or Registration ID. Please check and try again.');
        return;
      }

      if (matched.employmentStatus === 'deactivated') {
        setIsSubmitting(false);
        setErrorMessage(`Account for "${matched.name}" is deactivated. Please contact your security supervisor.`);
        return;
      }

      const expectedPassword = matched.password || 'rexon123';
      if (cleanPass !== expectedPassword) {
        setIsSubmitting(false);
        setErrorMessage('Incorrect password. (Default demo password is: rexon123)');
        return;
      }

      setIsSubmitting(false);
      onLoginSuccess(matched);
    }, 350);
  };

  const handleQuickDemoLogin = (officer: FieldOfficer) => {
    const cred = officer.email || officer.employeeId;
    setIdentifier(cred);
    setPassword(officer.password || 'rexon123');
    setErrorMessage(null);
    onLoginSuccess(officer);
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#4B3621] flex flex-col justify-between font-sans antialiased">
      {/* Top Bar */}
      <header className="bg-[#FFFFFF] border-b border-[#E7DED2] px-4 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6F4E37] text-white flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#4B3621] tracking-tight block">
                REXON FIELD PATROLLING APP
              </span>
              <span className="text-[10px] text-[#8B735B] font-mono block">
                Officer Duty & Checkpoint Reporting Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToOwnerMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6F4E37] hover:text-[#4B3621] hover:bg-[#F0E8DD] transition-colors cursor-pointer border border-[#E7DED2] shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Owner Mode</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 text-[#4B3621]">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#E7DED2] mx-auto flex items-center justify-center text-[#6F4E37] shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#4B3621] tracking-tight">
              Field Officer Login
            </h1>
            <p className="text-xs text-[#8B735B] leading-relaxed">
              Enter your registered Email ID or Officer Registration ID and password to access your patrol schedule.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs text-[#C62828] flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-semibold text-[#4B3621] mb-1.5">
                Email ID or Officer Registration ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. sandeep@rexon.com or REX-EMP-1001"
                  className="w-full px-3.5 py-2.5 pl-10 text-xs bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] shadow-2xs font-sans"
                />
                <User className="w-4 h-4 text-[#8B735B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#4B3621]">
                  Security Password *
                </label>
                <span className="text-[10px] text-[#8B735B] font-mono">
                  Default: rexon123
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-xs bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] shadow-2xs"
                />
                <Lock className="w-4 h-4 text-[#8B735B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] disabled:opacity-60 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating Officer...' : 'Login to Patrol Schedule'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Badges */}
          <div className="pt-2 border-t border-[#E7DED2] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8B735B] uppercase font-mono tracking-wider">
                Quick Demo Login (One-Click)
              </span>
              <span className="text-[10px] text-[#8B735B]">
                Pre-configured Guards
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeOfficers.slice(0, 4).map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(off)}
                  className="p-2.5 rounded-xl border border-[#E7DED2] bg-[#FAF7F2] hover:bg-[#F0E8DD] hover:border-[#6F4E37] text-left transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] text-[#6F4E37] font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-[#6F4E37] group-hover:text-white transition-colors">
                    {off.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-[#4B3621] truncate">{off.name}</div>
                    <div className="text-[10px] text-[#8B735B] font-mono truncate">{off.employeeId} · {off.area.split('-')[0]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-[10px] text-center text-[#8B735B] leading-tight">
            Protected by Rexon Security RBAC protocol. Every patrol report, GPS fix, and checkpoint photo is cryptographically bound to the authenticated officer.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#FFFFFF] border-t border-[#E7DED2] py-3 px-4 text-center text-xs text-[#8B735B]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Rexon Field Patrolling App · Guard Personnel Authentication</span>
          <button
            onClick={onSwitchToOwnerMode}
            className="text-xs text-[#6F4E37] hover:text-[#4B3621] font-semibold underline cursor-pointer"
          >
            Switch to Security Company Owner Dashboard
          </button>
        </div>
      </footer>
    </div>
  );
};
