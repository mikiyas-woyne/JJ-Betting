import React, { useState } from 'react';
import { X, Clock, ShieldCheck } from 'lucide-react';
import { Match, BetSlipItem } from '../types';

interface MatchDetailsModalProps {
  match: Match | null;
  betSlipItems: BetSlipItem[];
  onToggleSelection: (item: BetSlipItem) => void;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  betSlipItems,
  onToggleSelection,
  onClose
}) => {
  if (!match) return null;

  const [activeTab, setActiveTab] = useState<'main' | 'all'>('main');

  const matchDate = new Date(match.startTime);
  const timeFormatted = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isLive = match.status === 'live';

  // Primary markets to display cleanly
  const allMarkets = match.markets || [];
  const mainMarketTypes = ['match_winner', 'over_under_2_5', 'both_teams_to_score'];
  const displayedMarkets = activeTab === 'main'
    ? allMarkets.filter(m => mainMarketTypes.includes(m.type))
    : allMarkets;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="match-details-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>{match.leagueName}</span>
              {isLive ? (
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold text-[10px] border border-red-500/30">
                  LIVE {match.score?.minute}'
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {timeFormatted}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-lg sm:text-2xl font-black text-white">
              <div className="flex items-center gap-2">
                {match.homeLogo && (
                  <img
                    src={match.homeLogo}
                    alt={match.homeTeam}
                    className="w-7 h-7 object-contain rounded-full bg-slate-800 p-0.5 border border-slate-700/60"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <span>{match.homeTeam}</span>
              </div>
              {isLive && match.score && (
                <span className="bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded font-mono text-base sm:text-lg border border-emerald-500/20">
                  {match.score.home} - {match.score.away}
                </span>
              )}
              <span className="text-slate-500 text-sm sm:text-base font-normal">vs</span>
              <div className="flex items-center gap-2">
                {match.awayLogo && (
                  <img
                    src={match.awayLogo}
                    alt={match.awayTeam}
                    className="w-7 h-7 object-contain rounded-full bg-slate-800 p-0.5 border border-slate-700/60"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <span>{match.awayTeam}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Main Markets vs More Markets) */}
        <div className="bg-slate-900 px-6 pt-3 pb-2 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'main'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              Main Markets
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              More Markets ({allMarkets.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Regulated Market Feed</span>
          </div>
        </div>

        {/* Markets Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {displayedMarkets.map(market => (
            <div
              key={market.id}
              className="bg-slate-950/60 rounded-2xl border border-slate-800/90 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-200">{market.name}</span>
                {market.status !== 'active' && (
                  <span className="text-amber-400 text-xs font-semibold uppercase">
                    {market.status}
                  </span>
                )}
              </div>

              <div
                className={`grid gap-2.5 ${
                  market.selections.length === 2
                    ? 'grid-cols-2'
                    : market.selections.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {market.selections.map(selection => {
                  const isSelected = betSlipItems.some(
                    b => b.matchId === match.id && b.selectionId === selection.id
                  );
                  const isDisabled =
                    match.status === 'finished' ||
                    match.status === 'suspended' ||
                    market.status !== 'active' ||
                    selection.status !== 'active';

                  const betItem: BetSlipItem = {
                    matchId: match.id,
                    marketId: market.id,
                    selectionId: selection.id,
                    matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                    marketName: market.name,
                    selectionName: selection.name,
                    oddsValue: selection.oddsValue
                  };

                  return (
                    <button
                      key={selection.id}
                      disabled={isDisabled}
                      onClick={() => onToggleSelection(betItem)}
                      className={`min-h-[56px] p-3 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-black border border-emerald-400 shadow-md shadow-emerald-500/20'
                          : isDisabled
                          ? 'bg-slate-900/40 text-slate-600 border border-slate-900 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className={`text-xs truncate max-w-full font-medium ${
                          isSelected ? 'text-slate-950 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {selection.name}
                      </span>
                      <span
                        className={`font-mono text-base font-extrabold mt-0.5 ${
                          isSelected ? 'text-slate-950' : 'text-emerald-400'
                        }`}
                      >
                        {selection.oddsValue.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tap any odds box to add to your Bet Slip.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
