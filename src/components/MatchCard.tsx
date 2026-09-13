import React from 'react';
import { ChevronRight, Clock, Flame } from 'lucide-react';
import { Match, BetSlipItem } from '../types';

interface MatchCardProps {
  match: Match;
  betSlipItems: BetSlipItem[];
  onToggleSelection: (item: BetSlipItem) => void;
  onOpenDetails: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  betSlipItems,
  onToggleSelection,
  onOpenDetails
}) => {
  const isLive = match.status === 'live';
  const isSuspended = match.status === 'suspended';
  const isFinished = match.status === 'finished';

  // Find primary Match Winner (1X2 or Moneyline) market
  const markets = match.markets || [];
  const primaryMarket = markets.find(m => m.type === 'match_winner') || markets[0];
  const otherMarketsCount = Math.max(0, markets.length - (primaryMarket ? 1 : 0));

  // Format kickoff time
  const matchDate = new Date(match.startTime);
  const isToday = new Date().toDateString() === matchDate.toDateString();
  const timeFormatted = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeDisplay = isLive
    ? `LIVE ${match.score?.period || ''} • ${match.score?.minute || 0}'`
    : isToday
    ? `Today • ${timeFormatted}`
    : `${matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${timeFormatted}`;

  return (
    <div
      id={`match-card-${match.id}`}
      className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all p-4 sm:p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Card Header: League & Status */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-400 tracking-wide uppercase text-[11px] truncate">
            {match.leagueName}
          </span>
          {match.popular && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <Flame className="w-3 h-3" /> Popular
            </span>
          )}
        </div>

        {/* Live or Scheduled Badge */}
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>{timeDisplay}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{timeDisplay}</span>
          </div>
        )}
      </div>

      {/* Competitors & Score */}
      <div
        onClick={() => onOpenDetails(match)}
        className="cursor-pointer group flex items-center justify-between gap-4 my-2"
        role="button"
        tabIndex={0}
      >
        <div className="flex-1 space-y-2.5">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.homeTeam}
                  className="w-6 h-6 object-contain flex-shrink-0 rounded-full bg-slate-800/80 p-0.5 border border-slate-700/50"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                  {match.homeTeamShort || match.homeTeam.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-400 transition-colors truncate">
                {match.homeTeam}
              </span>
            </div>
            {isLive && match.score && (
              <span className="font-mono font-black text-lg text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded flex-shrink-0">
                {match.score.home}
              </span>
            )}
          </div>

          {/* vs Separator */}
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-8 flex items-center gap-2">
            <span>vs</span>
            {match.providerName && (
              <span className="text-[9px] font-normal text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                Live Feed
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.awayTeam}
                  className="w-6 h-6 object-contain flex-shrink-0 rounded-full bg-slate-800/80 p-0.5 border border-slate-700/50"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                  {match.awayTeamShort || match.awayTeam.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-400 transition-colors truncate">
                {match.awayTeam}
              </span>
            </div>
            {isLive && match.score && (
              <span className="font-mono font-black text-lg text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded flex-shrink-0">
                {match.score.away}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(match);
          }}
          className="text-slate-500 group-hover:text-slate-300 p-2 transition-colors cursor-pointer flex-shrink-0"
          title="View Markets"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Odds Buttons (HOME / DRAW / AWAY) - Large, Touch-Friendly */}
      {primaryMarket && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2 px-1">
            <span>{primaryMarket.name}</span>
            {isSuspended && (
              <span className="text-amber-400 font-semibold">Markets Suspended</span>
            )}
            {isFinished && (
              <span className="text-slate-500 font-semibold">Match Ended</span>
            )}
          </div>

          <div
            className={`grid gap-2 ${
              (primaryMarket.selections?.length || 0) === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
            }`}
          >
            {(primaryMarket.selections || []).map(selection => {
              const isSelected = betSlipItems.some(
                b => b.matchId === match.id && b.selectionId === selection.id
              );
              const isDisabled = isSuspended || isFinished || selection.status !== 'active';

              const betItem: BetSlipItem = {
                matchId: match.id,
                marketId: primaryMarket.id,
                selectionId: selection.id,
                matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                marketName: primaryMarket.name,
                selectionName: selection.name,
                oddsValue: selection.oddsValue
              };

              return (
                <button
                  key={selection.id}
                  id={`odds-btn-${selection.id}`}
                  disabled={isDisabled}
                  onClick={() => onToggleSelection(betItem)}
                  className={`min-h-[52px] py-2.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center font-sans cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border border-emerald-400'
                      : isDisabled
                      ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-750 text-white border border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`text-[11px] truncate max-w-full font-semibold ${
                      isSelected ? 'text-slate-950 font-bold' : isDisabled ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {selection.name}
                  </span>
                  {isDisabled ? (
                    <span className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase mt-0.5 tracking-wider">
                      Suspended
                    </span>
                  ) : (
                    <span
                      className={`font-mono text-sm sm:text-base font-extrabold ${
                        isSelected ? 'text-slate-950' : 'text-emerald-400'
                      }`}
                    >
                      {selection.oddsValue.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Link: More Markets */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
        <button
          onClick={() => onOpenDetails(match)}
          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>More Markets</span>
          {otherMarketsCount > 0 && (
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
              +{otherMarketsCount}
            </span>
          )}
        </button>

        <span className="text-[11px] text-slate-500">
          Certified Regulated Odds
        </span>
      </div>
    </div>
  );
};
