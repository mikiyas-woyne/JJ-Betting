import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ticket
} from 'lucide-react';
import { BetSlipItem, Wallet, Bet, StakeLimits } from '../types';
import { api } from '../services/api';

interface BetSlipProps {
  items: BetSlipItem[];
  wallet: Wallet | null;
  onRemoveItem: (selectionId: string) => void;
  onClearAll: () => void;
  onPlaceBet: (type: 'single' | 'multiple', stake: number, items: BetSlipItem[]) => Promise<Bet>;
  onOpenWallet: () => void;
  onUpdateItemOdds?: (selectionId: string, newOdds: number) => void;
  onViewBet?: (bet: Bet) => void;
}

export const BetSlip: React.FC<BetSlipProps> = ({
  items,
  wallet,
  onRemoveItem,
  onClearAll,
  onPlaceBet,
  onOpenWallet,
  onUpdateItemOdds,
  onViewBet
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [betType, setBetType] = useState<'single' | 'multiple'>('single');
  const [stakeInput, setStakeInput] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [oddsChangedNotice, setOddsChangedNotice] = useState<boolean>(false);
  const [recentBetReceipt, setRecentBetReceipt] = useState<Bet | null>(null);
  const [limits, setLimits] = useState<StakeLimits>({ minimumStake: 10, maximumStake: 50000 });

  useEffect(() => {
    api.getStakeLimits()
      .then(res => setLimits(res))
      .catch(() => {});
  }, []);

  if (items.length === 0 && !recentBetReceipt) {
    return null;
  }

  const stake = parseFloat(stakeInput) || 0;

  // Calculate combined odds
  const totalOdds = items.length === 0
    ? 0
    : betType === 'single'
    ? items[0]?.oddsValue || 1
    : Math.round(items.reduce((acc, item) => acc * item.oddsValue, 1) * 100) / 100;

  const potentialReturn = Math.round(stake * totalOdds * 100) / 100;
  const hasInsufficientBalance = wallet ? stake > wallet.availableBalance : false;

  const handleQuickStake = (amountToAdd: number) => {
    const current = parseFloat(stakeInput) || 0;
    setStakeInput((current + amountToAdd).toString());
    setErrorMessage(null);
    setErrorCode(null);
    setOddsChangedNotice(false);
  };

  const handleSetMaxStake = () => {
    if (wallet) {
      const maxAllowed = Math.min(wallet.availableBalance, limits.maximumStake);
      setStakeInput(Math.floor(maxAllowed).toString());
      setErrorMessage(null);
      setErrorCode(null);
      setOddsChangedNotice(false);
    }
  };

  const handleConfirmBet = async () => {
    setErrorMessage(null);
    setErrorCode(null);

    if (stake <= 0) {
      setErrorMessage('Please enter a valid stake.');
      setErrorCode('INVALID_STAKE');
      return;
    }
    if (stake < limits.minimumStake) {
      setErrorMessage(`Please enter a valid stake. Minimum stake is ${limits.minimumStake} ETB.`);
      setErrorCode('INVALID_STAKE');
      return;
    }
    if (stake > limits.maximumStake) {
      setErrorMessage(`Please enter a valid stake. Maximum stake is ${limits.maximumStake} ETB.`);
      setErrorCode('INVALID_STAKE');
      return;
    }
    if (hasInsufficientBalance) {
      setErrorMessage('Insufficient available balance. Please deposit funds to place this bet.');
      setErrorCode('INSUFFICIENT_BALANCE');
      return;
    }

    try {
      setIsSubmitting(true);
      const placedBet = await onPlaceBet(betType, stake, items);
      setRecentBetReceipt(placedBet);
      setOddsChangedNotice(false);
      onClearAll();
    } catch (err: any) {
      const code = err.code || '';
      setErrorCode(code);

      if (code === 'ODDS_CHANGED' || err.message?.includes('Odds have changed')) {
        setErrorMessage('Odds have changed. Please review your bet.');
        setOddsChangedNotice(true);
        if (err.updatedSelections && onUpdateItemOdds) {
          for (const upd of err.updatedSelections) {
            onUpdateItemOdds(upd.selectionId, upd.currentOdds);
          }
        }
      } else if (code === 'BETTING_SUSPENDED' || code === 'MARKET_SUSPENDED' || err.message?.includes('suspended')) {
        setErrorMessage('Betting is temporarily suspended for this selection.');
        setOddsChangedNotice(false);
      } else if (code === 'MATCH_STARTED') {
        setErrorMessage('Match has started and pre-match betting is closed.');
        setOddsChangedNotice(false);
      } else if (code === 'MATCH_FINISHED') {
        setErrorMessage('Match has already concluded. Betting is closed.');
        setOddsChangedNotice(false);
      } else if (code === 'INSUFFICIENT_BALANCE') {
        setErrorMessage(err.message || 'Insufficient available balance. Please deposit funds to place this bet.');
        setOddsChangedNotice(false);
      } else if (code === 'INVALID_STAKE') {
        setErrorMessage(err.message || 'Please enter a valid stake.');
        setOddsChangedNotice(false);
      } else if (code === 'DUPLICATE_REQUEST') {
        setErrorMessage('Duplicate bet submission detected. Please check your active bets.');
        setOddsChangedNotice(false);
      } else {
        setErrorMessage(err.message || 'Bet placement failed.');
        setOddsChangedNotice(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none px-3 sm:px-6">
      <div className="w-full max-w-xl bg-slate-900 border-t-2 sm:border-x sm:border-t border-emerald-500 rounded-t-3xl shadow-2xl pointer-events-auto overflow-hidden transition-all duration-300">
        {/* Simple Bet Confirmation View after successful placement */}
        {recentBetReceipt ? (
          <div className="p-6 bg-slate-950 text-white animate-in slide-in-from-bottom-2 space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-emerald-400 font-black text-lg tracking-wider uppercase">
                ✓ BET PLACED
              </div>
              {recentBetReceipt.selections.map((sel, idx) => (
                <div key={idx} className="pt-1">
                  <div className="text-base font-bold text-white">
                    {sel.selectionName} ({sel.matchName})
                  </div>
                  <div className="text-slate-400 text-xs font-mono">
                    Odds: <span className="text-amber-400 font-bold">{(sel.acceptedOdds || sel.oddsAtPlacement || recentBetReceipt.totalOdds).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4 text-left font-mono">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-sans">Stake:</div>
                <div className="text-white font-black text-base">{recentBetReceipt.stake.toFixed(2)} ETB</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-sans">Potential Return:</div>
                <div className="text-emerald-400 font-black text-base">{recentBetReceipt.potentialReturn.toFixed(2)} ETB</div>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-sans">Bet ID:</span>
                <span className="font-bold text-slate-200 text-xs">{recentBetReceipt.id}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                id="view-placed-bet-button"
                onClick={() => {
                  if (onViewBet) {
                    onViewBet(recentBetReceipt);
                  }
                  setRecentBetReceipt(null);
                }}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer shadow-md tracking-wider uppercase"
              >
                [ VIEW BET ]
              </button>
              <button
                onClick={() => setRecentBetReceipt(null)}
                className="px-4 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Collapsed Sticky Header Bar */}
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 sm:px-6 py-3.5 bg-slate-900 hover:bg-slate-850 flex items-center justify-between cursor-pointer select-none border-b border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/30">
                  {items.length}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>Bet Slip</span>
                    <span className="text-emerald-400 font-mono">({items.length})</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Odds: <span className="font-mono text-white font-bold">{totalOdds.toFixed(2)}</span>
                    {' • '}
                    Return: <span className="font-mono text-emerald-400 font-bold">{potentialReturn} ETB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Expanded Bet Slip Drawer */}
            {isExpanded && (
              <div className="p-4 sm:p-5 bg-slate-950 max-h-[75vh] overflow-y-auto space-y-4">
                {/* Bet Type Switcher: Single vs Multiple */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setBetType('single')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        betType === 'single'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Single {items.length > 1 && `(${items.length})`}
                    </button>
                    <button
                      onClick={() => setBetType('multiple')}
                      disabled={items.length < 2}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        betType === 'multiple'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : items.length < 2
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Multiple {items.length < 2 && '(Min 2)'}
                    </button>
                  </div>

                  <button
                    onClick={onClearAll}
                    className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                </div>

                {/* Selections List */}
                <div className="space-y-2.5">
                  {items.map(item => (
                    <div
                      key={item.selectionId}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-400 truncate mb-0.5">
                          {item.matchTitle}
                        </div>
                        <div className="font-bold text-white truncate text-sm">
                          {item.selectionName}{' '}
                          <span className="text-[11px] font-normal text-slate-400">({item.marketName})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-emerald-400 text-sm bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {item.oddsValue.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.selectionId)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Remove selection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stake Input Area */}
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Stake:</span>
                    <span className="text-slate-400 font-normal">
                      Available:{' '}
                      <button
                        onClick={onOpenWallet}
                        className="text-emerald-400 underline font-mono font-bold"
                      >
                        {wallet ? `${wallet.availableBalance.toFixed(2)} ETB` : '0 ETB'}
                      </button>
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id="bet-stake-input"
                      type="number"
                      min={limits.minimumStake}
                      max={limits.maximumStake}
                      step="10"
                      value={stakeInput}
                      onChange={(e) => {
                        setStakeInput(e.target.value);
                        setErrorMessage(null);
                        setErrorCode(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-base sm:text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      placeholder="100"
                    />
                    <div className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                      ETB
                    </div>
                  </div>

                  {/* Limits indicator */}
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Min: {limits.minimumStake} ETB</span>
                    <span>Max: {limits.maximumStake.toLocaleString()} ETB</span>
                  </div>

                  {/* Quick Stake Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <button
                      onClick={() => handleQuickStake(50)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono font-semibold cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => handleQuickStake(100)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono font-semibold cursor-pointer"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => handleQuickStake(250)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono font-semibold cursor-pointer"
                    >
                      +250
                    </button>
                    <button
                      onClick={() => handleQuickStake(500)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono font-semibold cursor-pointer"
                    >
                      +500
                    </button>
                    <button
                      onClick={handleSetMaxStake}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold cursor-pointer ml-auto"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Odds:</span>
                    <span className="font-mono text-white font-bold">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-800">
                    <span className="font-bold text-white">Potential Return:</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      {potentialReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                    </span>
                  </div>
                </div>

                {/* Error / Odds Notice Banner */}
                {errorMessage && (
                  <div className={`text-xs p-3.5 rounded-xl flex items-start gap-2.5 border ${
                    oddsChangedNotice
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-red-500/15 border-red-500/40 text-red-300'
                  }`}>
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${oddsChangedNotice ? 'text-amber-400' : 'text-red-400'}`} />
                    <div className="space-y-0.5">
                      <div className="font-bold">{errorMessage}</div>
                      {oddsChangedNotice && (
                        <div className="text-[11px] text-amber-300/80">
                          The updated server odds are now displayed. Please review your bet again before placing.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasInsufficientBalance && !errorMessage && (
                  <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs p-3 rounded-xl flex items-center justify-between">
                    <span>Insufficient available balance. Please deposit funds.</span>
                    <button
                      onClick={onOpenWallet}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg cursor-pointer"
                    >
                      Deposit Funds
                    </button>
                  </div>
                )}

                {/* PLACE BET ACTION BUTTON */}
                <button
                  id="place-bet-button"
                  disabled={isSubmitting || items.length === 0}
                  onClick={handleConfirmBet}
                  className={`w-full py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                    isSubmitting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : hasInsufficientBalance
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      : oddsChangedNotice
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Validating Server Odds...</span>
                    </>
                  ) : oddsChangedNotice ? (
                    <>
                      <Ticket className="w-5 h-5" />
                      <span>ACCEPT NEW ODDS & PLACE BET ({stake} ETB)</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-5 h-5" />
                      <span>PLACE BET</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

