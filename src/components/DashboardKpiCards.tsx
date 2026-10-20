import React from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { NavigationTab } from '../types';

interface DashboardKpiCardsProps {
  totalSites: number;
  activeOfficers: number;
  completedPatrols: number;
  pendingPatrols: number;
  missedPatrols: number;
  openIncidents: number;
  onFilterByStatus: (status: string) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  currentStatusFilter: string;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  totalSites,
  activeOfficers,
  completedPatrols,
  pendingPatrols,
  missedPatrols,
  openIncidents,
  onFilterByStatus,
  onNavigateTab,
  currentStatusFilter
}) => {
  const cards = [
    {
      id: 'sites',
      title: 'Total Sites',
      value: totalSites,
      subtitle: 'Across 5 security zones',
      icon: Building2,
      iconColor: 'text-[#6F4E37] bg-[#F0E8DD] border-[#E7DED2]',
      actionType: 'navigate',
      targetTab: 'sites' as NavigationTab,
      badgeText: 'All Protected',
      isActive: false
    },
    {
      id: 'officers',
      title: 'Active Field Officers',
      value: activeOfficers,
      subtitle: 'On duty & patrolling shifts',
      icon: Users,
      iconColor: 'text-[#8B735B] bg-[#F0E8DD] border-[#E7DED2]',
      actionType: 'navigate',
      targetTab: 'officers' as NavigationTab,
      badgeText: 'Live Roster',
      isActive: false
    },
    {
      id: 'completed',
      title: 'Completed Patrols',
      value: completedPatrols,
      subtitle: 'GPS & checklist verified',
      icon: CheckCircle2,
      iconColor: 'text-[#2E7D32] bg-[#E8F5E9] border-[#C8E6C9]',
      actionType: 'filter',
      statusValue: 'completed',
      badgeText: 'Verified',
      isActive: currentStatusFilter === 'completed'
    },
    {
      id: 'pending',
      title: 'Pending Patrols',
      value: pendingPatrols,
      subtitle: 'Scheduled upcoming checks',
      icon: Clock,
      iconColor: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]',
      actionType: 'filter',
      statusValue: 'pending',
      badgeText: 'In Window',
      isActive: currentStatusFilter === 'pending'
    },
    {
      id: 'missed',
      title: 'Missed Patrols',
      value: missedPatrols,
      subtitle: 'Exceeded grace window',
      icon: AlertTriangle,
      iconColor: missedPatrols > 0 ? 'text-[#C62828] bg-[#FFEBEE] border-[#FFCDD2]' : 'text-[#8B735B] bg-[#F0E8DD] border-[#E7DED2]',
      actionType: 'filter',
      statusValue: 'missed',
      badgeText: missedPatrols > 0 ? 'Requires Audit' : 'Zero Missed',
      isActive: currentStatusFilter === 'missed'
    },
    {
      id: 'incidents',
      title: 'Open Incidents',
      value: openIncidents,
      subtitle: 'Active triage & repair alerts',
      icon: AlertOctagon,
      iconColor: openIncidents > 0 ? 'text-[#C62828] bg-[#FFEBEE] border-[#FFCDD2]' : 'text-[#2E7D32] bg-[#E8F5E9] border-[#C8E6C9]',
      actionType: 'navigate',
      targetTab: 'incidents' as NavigationTab,
      badgeText: openIncidents > 0 ? 'Action Req.' : 'Clear',
      isActive: false
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            onClick={() => {
              if (card.actionType === 'filter' && card.statusValue) {
                onFilterByStatus(currentStatusFilter === card.statusValue ? 'all' : card.statusValue);
              } else if (card.actionType === 'navigate' && card.targetTab) {
                onNavigateTab(card.targetTab);
              }
            }}
            className={`text-left p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between shadow-2xs ${
              card.isActive
                ? 'bg-[#FAF7F2] border-2 border-[#6F4E37] ring-1 ring-[#6F4E37]/30 shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E7DED2] hover:border-[#8B735B] hover:bg-[#FAF7F2]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#8B735B] leading-tight">
                  {card.title}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${card.iconColor}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#4B3621] tracking-tight">
                {card.value}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E7DED2] flex items-center justify-between text-[11px] text-[#8B735B]">
              <span className="truncate">{card.subtitle}</span>
              <ArrowRight className="w-3 h-3 text-[#8B735B] group-hover:text-[#4B3621] transition-colors shrink-0 ml-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
