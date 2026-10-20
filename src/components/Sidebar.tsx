import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck2,
  AlertOctagon,
  CalendarCheck,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  openIncidentsCount: number;
  missedPatrolsCount: number;
  activeOfficersCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  openIncidentsCount,
  missedPatrolsCount,
  activeOfficersCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'sites',
      label: 'Sites',
      icon: Building2
    },
    {
      id: 'officers',
      label: 'Field Officers',
      icon: Users,
      badge: activeOfficersCount,
      badgeColor: 'text-[#4B3621] bg-[#F0E8DD] border border-[#E7DED2]'
    },
    {
      id: 'reports',
      label: 'Patrol Reports',
      icon: FileCheck2,
      badge: missedPatrolsCount > 0 ? missedPatrolsCount : undefined,
      badgeColor: 'text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A]'
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertOctagon,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      badgeColor: 'text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2]'
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: CalendarCheck
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#4B3621]/40 backdrop-blur-2xs z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#FFFFFF] border-r border-[#E7DED2] flex flex-col z-50 transition-transform duration-200 ease-in-out md:translate-x-0 shadow-2xs ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Area */}
        <div className="p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#4B3621] tracking-wide">
                REXON
              </div>
              <div className="text-[11px] font-medium text-[#8B735B] tracking-tight">
                Field Patrolling App
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#8B735B] hover:text-[#4B3621] rounded-lg hover:bg-[#F0E8DD]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#8B735B] uppercase tracking-wider">
            Operations Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] shadow-2xs'
                    : 'text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#6F4E37]' : 'text-[#8B735B] group-hover:text-[#4B3621]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      item.badgeColor || 'bg-[#F0E8DD] text-[#4B3621]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Company Status Footer */}
        <div className="p-3 border-t border-[#E7DED2] bg-[#FAF7F2]">
          <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] text-xs shadow-2xs">
            <div className="flex items-center justify-between text-[#4B3621] font-semibold mb-1">
              <span>System Status</span>
              <span className="text-[10px] font-mono text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-1.5 py-0.5 rounded font-bold">
                DEMO READY
              </span>
            </div>
            <p className="text-[11px] text-[#8B735B] leading-snug">
              Owner console connected. Geofence radius tolerance active at 50m.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
