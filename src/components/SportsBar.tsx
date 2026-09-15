import React from 'react';
import { Sport } from '../types';

interface SportsBarProps {
  sports: Sport[];
  selectedSportId: string;
  onSelectSport: (sportId: string) => void;
  activeFilter: 'all' | 'live' | 'upcoming';
  onFilterChange: (filter: 'all' | 'live' | 'upcoming') => void;
  liveMatchCount: number;
}

export const SportsBar: React.FC<SportsBarProps> = ({
  sports,
  selectedSportId,
  onSelectSport,
  activeFilter,
  onFilterChange,
  liveMatchCount
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sports Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectSport('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedSportId === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>⚽</span>
            <span>Football</span>
          </button>

          {sports.map(sport => {
            const isSelected = selectedSportId === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => onSelectSport(sport.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.name}</span>
                {sport.matchCount ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {sport.matchCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Status / Timing Filters (Live Now, All, Upcoming) */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Matches
          </button>

          <button
            onClick={() => onFilterChange('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFilter === 'live'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Live</span>
            {liveMatchCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1 rounded-full font-bold">
                {liveMatchCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onFilterChange('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>
    </div>
  );
};
