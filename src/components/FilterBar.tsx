import React from 'react';
import { Filter, X, Search, Calendar, MapPin, User, Building, CheckCircle } from 'lucide-react';
import { FilterState, Site, FieldOfficer } from '../types';
import { DEMO_AREAS } from '../data/demoData';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  sites: Site[];
  officers: FieldOfficer[];
  totalResultsCount: number;
  totalPatrolsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  sites,
  officers,
  totalResultsCount,
  totalPatrolsCount
}) => {
  const isAnyFilterActive =
    filters.date !== 'today' ||
    filters.area !== 'all' ||
    filters.officerId !== 'all' ||
    filters.siteId !== 'all' ||
    filters.status !== 'all' ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Top row: Label, Live Count & Reset Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7DED2] pb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6F4E37]" />
          <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
            Patrol Filters
          </span>
          <span className="text-xs text-[#8B735B] font-mono tabular-nums">
            (Showing {totalResultsCount} of {totalPatrolsCount} patrols)
          </span>
        </div>

        {isAnyFilterActive && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-[#C62828] hover:text-[#B71C1C] font-semibold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* 1. Date Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#8B735B]" />
            <span>Date Range</span>
          </label>
          <select
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E7DED2] rounded-lg px-2.5 py-1.5 text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]/30 cursor-pointer"
          >
            <option value="today">Today (Oct 20, 2026)</option>
            <option value="yesterday">Yesterday (Oct 19, 2026)</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="all">All Available Records</option>
          </select>
        </div>

        {/* 2. Area Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#8B735B]" />
            <span>Patrol Area</span>
          </label>
          <select
            value={filters.area}
            onChange={(e) => onFilterChange('area', e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E7DED2] rounded-lg px-2.5 py-1.5 text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]/30 cursor-pointer"
          >
            <option value="all">All Areas ({DEMO_AREAS.length})</option>
            {DEMO_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Field Officer Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-[#8B735B]" />
            <span>Field Officer</span>
          </label>
          <select
            value={filters.officerId}
            onChange={(e) => onFilterChange('officerId', e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E7DED2] rounded-lg px-2.5 py-1.5 text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]/30 cursor-pointer"
          >
            <option value="all">All Officers ({officers.length})</option>
            {officers.map((off) => (
              <option key={off.id} value={off.id}>
                {off.name} ({off.badgeNumber})
              </option>
            ))}
          </select>
        </div>

        {/* 4. Site Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-[#8B735B]" />
            <span>Client Site</span>
          </label>
          <select
            value={filters.siteId}
            onChange={(e) => onFilterChange('siteId', e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E7DED2] rounded-lg px-2.5 py-1.5 text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]/30 cursor-pointer"
          >
            <option value="all">All Sites ({sites.length})</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Patrol Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#4B3621] mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-[#8B735B]" />
            <span>Patrol Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E7DED2] rounded-lg px-2.5 py-1.5 text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]/30 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="missed">Missed</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative pt-1">
        <div className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-[#8B735B]" />
        </div>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          placeholder="Filter by site name, officer badge, report code (e.g. PTR-2026-001)..."
          className="w-full pl-9 pr-9 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange('searchQuery', '')}
            className="absolute inset-y-0 right-0 pr-3 pt-1 flex items-center text-[#8B735B] hover:text-[#4B3621]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
