import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Suppress button if already installed as standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // In case beforeinstallprompt hasn't fired yet or browser menu install is needed
      alert('To install Rexon Field Patrolling App:\n\n1. In Chrome/Edge, click the install icon (⊕) in the browser address bar, or open the menu (⋮) and select "Install Rexon Field Patrolling".\n2. On Mobile, open the browser menu and tap "Add to Home Screen" or "Install App".');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install Rexon App on your Mobile or Desktop device"
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
          variant === 'header'
            ? 'bg-[#3A2D28] hover:bg-[#2A1E14] text-[#E8D8C5] border border-[#524037]'
            : 'bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFFFF] border border-[#E7DED2] p-5 shadow-2xl text-[#4B3621]">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <img src="/pwa-192x192.png" alt="Rexon Logo" className="w-7 h-7 rounded-lg" />
                <h3 className="text-sm font-bold text-[#4B3621]">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6F4E37] mb-3 leading-relaxed">
              Install <strong>Rexon Field Patrolling</strong> on your home screen for fast one-tap access and offline support:
            </p>

            <div className="space-y-2 text-xs text-[#4B3621] bg-[#FAF7F2] p-3 rounded-xl border border-[#E7DED2]">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#3A2D28] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-[#6F4E37]" /> <strong>Share</strong> icon in the Safari bottom bar.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#3A2D28] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#3A2D28] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>Tap <strong>Add</strong> in the top right corner.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#3A2D28] py-2 text-xs font-bold text-[#FAF7F2] hover:bg-[#2A1E14] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
