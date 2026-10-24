import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { AdminCredentials } from '../utils/storage';

interface AdminLoginViewProps {
  adminCredentials: AdminCredentials;
  onLoginSuccess: () => void;
  onSwitchToFieldOfficerMode: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  adminCredentials,
  onLoginSuccess,
  onSwitchToFieldOfficerMode
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('कृपया एडमिन आईडी या ईमेल दर्ज करें (Please enter Admin ID or Email).');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('कृपया पासवर्ड दर्ज करें (Please enter your password).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const validAdminId = (adminCredentials.adminId || 'admin@rexon.com').toLowerCase();
      const validPassword = adminCredentials.password || 'rexonadmin123';

      // Allow matching against either full email or the username prefix (e.g., 'admin')
      const matchesId =
        cleanId === validAdminId ||
        cleanId === validAdminId.split('@')[0] ||
        (cleanId === 'admin' && validAdminId.includes('admin'));

      if (!matchesId) {
        setIsSubmitting(false);
        setErrorMessage('अमान्य एडमिन आईडी (Invalid Admin ID / Email. Check credentials and retry).');
        return;
      }

      if (cleanPass !== validPassword) {
        setIsSubmitting(false);
        setErrorMessage('गलत पासवर्ड (Incorrect Admin Password. Check credentials and retry).');
        return;
      }

      setIsSubmitting(false);
      onLoginSuccess();
    }, 300);
  };

  const handleFillDefaultCredentials = () => {
    setIdentifier(adminCredentials.adminId || 'admin@rexon.com');
    setPassword(adminCredentials.password || 'rexonadmin123');
    setErrorMessage(null);
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
                / Admin Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToFieldOfficerMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] hover:text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span className="hidden sm:inline">Switch to Field Officer App</span>
            <span className="sm:hidden">Officer Mode</span>
          </button>
        </div>
      </header>

      {/* Main Center Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F4E37] bg-[#FAF7F2] border border-[#E7DED2] px-2.5 py-0.5 rounded-full mb-1">
                SECURE ACCESS · एडमिन पोर्टल
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#4B3621]">
                Admin Operations Login
              </h1>
              <p className="text-xs text-[#8B735B] mt-1 max-w-xs mx-auto">
                Enter authorized Administrator ID & Password to access the security command console.
              </p>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs flex items-start gap-2 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C62828]" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Admin ID / Email */}
            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1.5 flex items-center justify-between">
                <span>Admin ID / Email · एडमिन आईडी</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B735B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. admin@rexon.com or admin"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs sm:text-sm text-[#4B3621] placeholder-[#A89886] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#6F4E37]/30 transition-colors"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#4B3621] mb-1.5 flex items-center justify-between">
                <span>Password · पासवर्ड</span>
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
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs sm:text-sm text-[#4B3621] placeholder-[#A89886] focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF] focus:ring-1 focus:ring-[#6F4E37]/30 transition-colors font-mono"
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
              className="w-full py-3 px-4 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Log In to Admin Dashboard · प्रवेश करें</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Default Demo Credentials Card */}
          <div className="pt-2 border-t border-[#E7DED2]">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#4B3621] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Default Admin Credentials · डिफ़ॉल्ट क्रेडेंशियल्स</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDefaultCredentials}
                  className="text-[11px] text-[#6F4E37] hover:text-[#4B3621] font-bold underline cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#FFFFFF] p-2 rounded-lg border border-[#E7DED2]">
                <div>
                  <span className="text-[#8B735B] block text-[10px]">Admin ID:</span>
                  <strong className="text-[#4B3621] truncate block">{adminCredentials.adminId || 'admin@rexon.com'}</strong>
                </div>
                <div>
                  <span className="text-[#8B735B] block text-[10px]">Password:</span>
                  <strong className="text-[#4B3621] block">{adminCredentials.password || 'rexonadmin123'}</strong>
                </div>
              </div>

              <p className="text-[10px] text-[#8B735B] leading-tight">
                Note: You can update these credentials anytime inside <strong>Admin Dashboard &gt; Settings &gt; Admin Credentials</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-xs text-[#8B735B] border-t border-[#E7DED2] bg-[#FFFFFF]">
        <span>Rexon Field Patrolling Operations Console · Secure Multi-Tenant Framework</span>
      </footer>
    </div>
  );
};
