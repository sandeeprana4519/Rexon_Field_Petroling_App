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
  User,
  CheckCircle2
} from 'lucide-react';
import { AdminCredentials } from '../utils/storage';
import {
  signInWithEmail,
  registerWithEmail,
  signInWithGoogle,
  parseAuthError
} from '../services/authService';
import { isFirebaseConfigured } from '../lib/firebase';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  // Handle Fixed Admin Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const profile = await signInWithGoogle();
      setIsGoogleLoading(false);
      onLoginSuccess(profile);
    } catch (err: any) {
      setIsGoogleLoading(false);
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

          {/* Security Notice: Public Registration Disabled */}
          <div className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs text-[#6F4E37] flex items-start gap-2 shadow-2xs">
            <Shield className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>सख्त सुरक्षा प्रणाली:</strong> पब्लिक रजिस्ट्रेशन पूरी तरह बंद है। नई साइट्स व फील्ड ऑफिसर्स केवल लॉगिन किए हुए एडमिन द्वारा ही जोड़े जा सकते हैं।
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

          {/* 1. Google Sign-In Button (Fixed Admin Only) */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F2] text-[#4B3621] border border-[#D5C2AD] text-xs sm:text-sm font-bold tracking-wide transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#6F4E37]/30 border-t-[#6F4E37] rounded-full animate-spin" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google 'G' Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google (Super Admin)</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E7DED2] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#8B735B] uppercase font-mono font-bold shrink-0">
              या एडमिन ईमेल द्वारा (Or with Admin Email)
            </span>
            <div className="border-t border-[#E7DED2] w-full" />
          </div>

          {/* 2. Email & Password Form */}
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
              disabled={isSubmitting || isGoogleLoading}
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
