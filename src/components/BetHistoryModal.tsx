import React, { useState } from 'react';
import { X, ReceiptText, CheckCircle2, Clock, XCircle, AlertCircle, Ban } from 'lucide-react';
import { Bet } from '../types';

interface BetHistoryModalProps {
  bets: Bet[];
  initialFilter?: 'all' | 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
  onClose: () => void;
}

export const BetHistoryModal: React.FC<BetHistoryModalProps> = ({ bets, initialFilter = 'pending', onClose }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost' | 'void' | 'cancelled'>(initialFilter);

  const filteredBets = bets.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Won
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Lost
          </span>
        );
      case 'void':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Void
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const pendingCount = bets.filter(b => b.status === 'pending').length;
  const wonCount = bets.filter(b => b.status === 'won').length;
  const lostCount = bets.filter(b => b.status === 'lost').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="bet-history-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">My Bets</h2>
              <p className="text-xs text-slate-400">Server-authoritative tickets & wallet ledger history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3 border-b border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filter === 'pending'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filter === 'won'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Won ({wonCount})
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filter === 'lost'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Lost ({lostCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            All Bets ({bets.length})
          </button>
        </div>

        {/* Bets List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredBets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No bets found under this status.
            </div>
          ) : (
            filteredBets.map(bet => {
              const betOdds = bet.acceptedOdds || bet.totalOdds;
              const betDate = bet.placedAt || bet.createdAt;

              return (
                <div
                  key={bet.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  {/* Ticket Header: ID, Type, Date, Status */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <span>#{bet.id}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-sans uppercase font-bold">
                          {bet.betType || bet.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Date: {new Date(betDate).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      {getStatusBadge(bet.status)}
                    </div>
                  </div>

                  {/* Selections Breakdown: Match, Selection, Market, Odds */}
                  <div className="space-y-2">
                    {bet.selections.map((sel, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="text-slate-400 text-[11px] font-medium">
                            <span className="text-slate-500">Match:</span> {sel.matchName}
                          </div>
                          <div className="font-bold text-white">
                            <span className="text-slate-400 font-normal">Selection:</span>{' '}
                            {sel.selectionName}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({sel.marketName})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-sans">Odds</div>
                          <div className="font-mono font-black text-emerald-400">
                            {(sel.acceptedOdds || sel.oddsAtPlacement || betOdds).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Settlement Footer: Stake, Potential Return, Total Odds */}
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Stake:</div>
                      <div className="text-white font-bold">{bet.stake.toFixed(2)} ETB</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Accepted Odds:</div>
                      <div className="text-amber-400 font-bold">{betOdds.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 font-sans text-[11px]">
                        {bet.status === 'won' ? 'Payout:' : 'Potential Return:'}
                      </div>
                      <div
                        className={`font-black text-sm ${
                          bet.status === 'won' ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {(bet.payoutAmount || bet.potentialReturn).toFixed(2)} ETB
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

