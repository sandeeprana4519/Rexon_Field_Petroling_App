import React from 'react';
import { Shield, Smartphone, RefreshCw, Menu } from 'lucide-react';
import { NavigationTab, AppMode } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  appMode: AppMode;
  onSwitchAppMode: (mode: AppMode) => void;
  onMobileMenuToggle: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Security Operations Dashboard', subtitle: 'Live overview of field patrols, site security & incidents' },
  sites: { title: 'Monitored Client Sites', subtitle: 'Manage properties, patrol checklists and geofence perimeters' },
  zones: { title: 'Patrol Zones Console · पेट्रोलिंग ज़ोन', subtitle: 'Create, edit, remove, and manage security patrolling zones' },
  officers: { title: 'Field Officers Roster', subtitle: 'Officer status, active shift assignments and contact details' },
  reports: { title: 'Patrol Reports & Area Audits', subtitle: 'Audit verified check-in logs, checkpoint times & proof photos' },
  incidents: { title: 'Incident Response Desk', subtitle: 'Triage reported security events, priority alerts & logs' },
  assignments: { title: 'Officer Shift Assignments', subtitle: 'Daily patrol quotas, zone dispatching and schedule rosters' },
  settings: { title: 'Security & Company Settings · सिक्योरिटी व सेटिंग्स', subtitle: 'Configure geofence tolerance, grace windows and company profile' }
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  appMode,
  onSwitchAppMode,
  onMobileMenuToggle,
  onRefreshData,
  isRefreshing
}) => {
  const currentInfo = TAB_TITLES[currentTab];

  return (
    <header className="bg-[#FFFFFF] border-b border-[#E7DED2] px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Brand / Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 sm:p-2 text-[#8B735B] hover:text-[#4B3621] rounded-lg hover:bg-[#F0E8DD] transition-colors cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-base font-bold text-[#4B3621] tracking-tight truncate">
                  Rexon Field Patrolling App
                </span>
                <span className="hidden lg:inline-block text-xs text-[#8B735B] font-mono shrink-0">
                  / Owner Dashboard
                </span>
              </div>
              <p className="text-xs text-[#8B735B] truncate hidden md:block">
                {currentInfo.title} · {currentInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions & Role Mode Switch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4B3621] hover:text-[#6F4E37] bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs whitespace-nowrap shrink-0"
            title="Refresh demo operations data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8B735B] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Role Switcher Button */}
          <button
            onClick={() => onSwitchAppMode('field_officer')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Switch to Field Officer Mode (Demo Role)"
          >
            <Smartphone className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Switch to Field Officer Mode</span>
            <span className="sm:hidden">Officer Mode</span>
          </button>

          <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-[#E7DED2]">
            <div className="w-7 h-7 rounded-full bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center text-xs font-bold text-[#4B3621]">
              JR
            </div>
            <div className="text-left text-xs leading-tight">
              <div className="font-semibold text-[#4B3621]">Cmdr. J. Reynolds</div>
              <div className="text-[11px] text-[#8B735B]">Security Owner</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
