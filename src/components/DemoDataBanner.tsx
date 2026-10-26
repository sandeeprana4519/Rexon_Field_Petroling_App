import React from 'react';
import { AlertTriangle, Smartphone, Info } from 'lucide-react';

interface DemoDataBannerProps {
  onSwitchToFieldOfficerMode: () => void;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ onSwitchToFieldOfficerMode }) => {
  return (
    <div className="bg-[#E8D8C5] border-b border-[#E7DED2] px-4 py-2 text-xs text-[#4B3621]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[10px] bg-[#6F4E37] text-white shrink-0">
            DEMO DATA
          </span>
          <div className="flex items-center gap-1.5 text-[#4B3621]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
            <span className="leading-tight">
              <strong>Simulated Operations Environment:</strong> All officer positions, patrol check-ins, and GPS records are synthetic demo data for evaluating the <strong>Rexon Field Patrolling App</strong>. No live tracking is active.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-1 text-[#8B735B] text-[11px]">
            <Info className="w-3.5 h-3.5" />
            <span>Owner Dashboard</span>
          </div>
          <button
            onClick={onSwitchToFieldOfficerMode}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] font-semibold text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            title="Switch to Field Officer Mobile Patrol Mode"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Open Field Officer Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
