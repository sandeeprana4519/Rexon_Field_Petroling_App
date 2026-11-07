import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  Smartphone,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { AdminCredentials } from '../utils/storage';
import {
  signInWithEmail,
  parseAuthError
} from '../services/authService';

interface AdminLoginViewProps {
  adminCredentials: AdminCredentials;
  onLoginSuccess: (userProfile?: any) => void;
  onSwitchToFieldOfficerMode: () => void;
  onSwitchToZaxonOwner?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  adminCredentials,
  onLoginSuccess,
  onSwitchToFieldOfficerMode,
  onSwitchToZaxonOwner
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Fixed Admin Email/Password Sign-In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMessage('कृपया एडमिन ईमेल दर्ज करें (Please enter Admin Email).');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('कृपया पासवर्ड दर्ज करें (Please enter your password).');
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = await signInWithEmail(cleanEmail, cleanPass);
      setIsSubmitting(false);
      onLoginSuccess(profile);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(parseAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#4B3621] flex flex-col justify-between font-sans selection:bg-[#E8D8C5] selection:text-[#4B3621]">
      {/* Top Brand Banner */}
      <header className="bg-[#FFFFFF] border-b border-[#E7DED2] px-4 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#4B3621] tracking-tight">
                Rexon Security Operations
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[#8B735B] font-mono">
                / Fixed Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToZaxonOwner && (
              <button
                type="button"
                onClick={onSwitchToZaxonOwner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#D5C2AD] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <span>Rexon Company Portal</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSwitchToFieldOfficerMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] hover:text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span className="hidden sm:inline">Field Officer Mode</span>
              <span className="sm:hidden">Officer Mode</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F4E37] bg-[#FAF7F2] border border-[#E7DED2] px-2.5 py-0.5 rounded-full mb-1">
                SINGLE FIXED SUPER ADMIN · सुरक्षित एडमिन लॉगिन
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#4B3621]">
                Admin Operations Login
              </h1>
              <p className="text-xs text-[#8B735B] mt-1 max-w-xs mx-auto">
                केवल अधिकृत सुपर एडमिन ही इस कंसोल में लॉगिन कर सकते हैं।
              </p>
            </div>
          </div>

          {/* Security Notice: Email and Password Only */}
          <div className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs text-[#6F4E37] flex items-start gap-2 shadow-2xs">
            <Shield className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>सुरक्षा नीति:</strong> सभी को केवल अधिकृत <strong>ईमेल आईडी और पासवर्ड</strong> के द्वारा ही लॉगिन किया जाएगा। सोशल अथवा अन्य किसी तरीके से लॉगिन पूर्णतः बंद है।
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs flex items-start gap-2 shadow-2xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C62828]" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] text-xs flex items-start gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D32]" />
              <div className="font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1">
                Admin Email Address (एडमिन ईमेल पता) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B735B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="admin@rexonsecurity.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs sm:text-sm text-[#4B3621] placeholder-[#A89886] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#6F4E37]/30 transition-colors"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1">
                Password (पासवर्ड) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B735B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-10 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs sm:text-sm text-[#4B3621] placeholder-[#A89886] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#6F4E37]/30 transition-colors font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Log In to Admin Dashboard · प्रवेश करें</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-xs text-[#8B735B] border-t border-[#E7DED2] bg-[#FFFFFF]">
        <span>Rexon Field Patrolling Operations Console · Strict Single Fixed Admin Security Active</span>
      </footer>
    </div>
  );
};
