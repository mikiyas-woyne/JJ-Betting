import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Filter,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { MatchSettlementSummary, Bet, SettlementRecord } from '../types';
import { api } from '../services/api';

interface AdminSettlementSectionProps {
  onRefreshData?: () => void;
}

export const AdminSettlementSection: React.FC<AdminSettlementSectionProps> = ({ onRefreshData }) => {
  const [summaries, setSummaries] = useState<MatchSettlementSummary[]>([]);
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncingResults, setIsSyncingResults] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal: View Affected Bets
  const [viewingMatchBets, setViewingMatchBets] = useState<{
    match: MatchSettlementSummary;
    bets: Bet[];
  } | null>(null);
  const [isLoadingBets, setIsLoadingBets] = useState<boolean>(false);

  // Modal: Manual Settle Match
  const [manualSettleTarget, setManualSettleTarget] = useState<MatchSettlementSummary | null>(null);
  const [manualStatus, setManualStatus] = useState<'FINISHED' | 'CANCELLED' | 'POSTPONED'>('FINISHED');
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [manualReason, setManualReason] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Retry state
  const [retryingSettlementId, setRetryingSettlementId] = useState<string | null>(null);

  useEffect(() => {
    loadSettlementData();
  }, []);

  const loadSettlementData = async () => {
    try {
      setIsLoading(true);
      const [sumData, recData] = await Promise.all([
        api.getSettlementSummaries(),
        api.getSettlementRecords()
      ]);
      setSummaries(sumData);
      setRecords(recData);
    } catch (err: any) {
      console.error('Failed to load settlements:', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to load settlement data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProviderResults = async () => {
    try {
      setIsSyncingResults(true);
      setFeedbackMessage(null);
      const res = await api.syncProviderResults();
      setFeedbackMessage({ type: 'success', text: res.message });
      await loadSettlementData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Provider result synchronization failed' });
    } finally {
      setIsSyncingResults(false);
    }
  };

  const handleOpenAffectedBets = async (summary: MatchSettlementSummary) => {
    try {
      setIsLoadingBets(true);
      const bets = await api.getAffectedBetsForMatch(summary.matchId);
      setViewingMatchBets({ match: summary, bets });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Failed to fetch affected bets: ' + err.message });
    } finally {
      setIsLoadingBets(false);
    }
  };

  const handleOpenManualSettle = (summary: MatchSettlementSummary) => {
    setManualSettleTarget(summary);
    setManualStatus('FINISHED');
    setHomeScore(summary.result?.homeScore ?? 0);
    setAwayScore(summary.result?.awayScore ?? 0);
    setManualReason('');
  };

  const handleExecuteManualSettle = async () => {
    if (!manualSettleTarget) return;

    if (!manualReason || manualReason.trim().length < 5) {
      setFeedbackMessage({ type: 'error', text: 'Please provide a justification reason (minimum 5 characters).' });
      return;
    }

    if (manualStatus === 'FINISHED' && (homeScore < 0 || awayScore < 0)) {
      setFeedbackMessage({ type: 'error', text: 'Scores cannot be negative numbers.' });
      return;
    }

    try {
      setIsSubmittingManual(true);
      setFeedbackMessage(null);

      const res = await api.manualSettleMatch({
        matchId: manualSettleTarget.matchId,
        status: manualStatus,
        homeScore: manualStatus === 'FINISHED' ? homeScore : undefined,
        awayScore: manualStatus === 'FINISHED' ? awayScore : undefined,
        reason: manualReason
      });

      setFeedbackMessage({ type: 'success', text: res.message });
      setManualSettleTarget(null);
      await loadSettlementData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Manual settlement failed' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleRetrySettlement = async (settlementId: string) => {
    try {
      setRetryingSettlementId(settlementId);
      setFeedbackMessage(null);
      const res = await api.retrySettlement(settlementId);
      setFeedbackMessage({ type: 'success', text: res.message });
      await loadSettlementData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Retry settlement failed' });
    } finally {
      setRetryingSettlementId(null);
    }
  };

  // Filtered summaries
  const filteredSummaries = summaries.filter(s => {
    const matchesSearch =
      s.matchTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.leagueName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return s.settlementStatus === 'PENDING' || s.settlementStatus === 'PARTIAL';
    if (filterStatus === 'completed') return s.settlementStatus === 'COMPLETED';
    if (filterStatus === 'failed') return s.settlementStatus === 'FAILED';
    if (filterStatus === 'has_bets') return s.affectedBetsCount > 0;
    return true;
  });

  // Calculate high-level settlement totals
  const totalSystemStakes = summaries.reduce((sum, s) => sum + s.totalStakes, 0);
  const totalSystemPayouts = summaries.reduce((sum, s) => sum + s.totalPayouts, 0);
  const totalAffectedBets = summaries.reduce((sum, s) => sum + s.affectedBetsCount, 0);
  const totalSettledBets = summaries.reduce((sum, s) => sum + s.settledBetsCount, 0);

  return (
    <div className="space-y-6 text-xs text-slate-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Bet Settlement & Match Result Engine</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
            Server-authoritative settlement system with zero client-side trust. All financial calculations,
            wallet balances, and winning evaluations occur strictly on the backend with immutable ledger updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncProviderResults}
            disabled={isSyncingResults}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer text-xs"
          >
            {isSyncingResults ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing Provider Scores...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Provider Results</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-400">Total Wager Volume</span>
          <div className="text-base font-extrabold text-white font-mono">{totalSystemStakes.toFixed(2)} ETB</div>
          <span className="text-[10px] text-slate-500">{totalAffectedBets} total placed wagers</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-400">Total Payouts Credited</span>
          <div className="text-base font-extrabold text-emerald-400 font-mono">{totalSystemPayouts.toFixed(2)} ETB</div>
          <span className="text-[10px] text-emerald-500/80">{totalSettledBets} tickets settled</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-400">Gross Gaming Revenue (GGR)</span>
          <div className="text-base font-extrabold text-amber-300 font-mono">
            {(totalSystemStakes - totalSystemPayouts).toFixed(2)} ETB
          </div>
          <span className="text-[10px] text-slate-500">Platform retention rate</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] text-slate-400">Settlement Ledger Records</span>
          <div className="text-base font-extrabold text-purple-300 font-mono">{records.length}</div>
          <span className="text-[10px] text-slate-500">Auditable transactions</span>
        </div>
      </div>

      {/* CONTROLS & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search match or league..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All Matches' },
              { key: 'has_bets', label: 'With Bets' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Settled' }
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterStatus(f.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  filterStatus === f.key
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={loadSettlementData}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* MATCH SETTLEMENT SUMMARIES LIST */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <p>Loading match settlement summaries...</p>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
          <p>No matches match the selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSummaries.map((summary) => {
            const isFinished = summary.status === 'finished' || summary.status === 'FINISHED';
            const isCancelled = summary.status === 'cancelled' || summary.status === 'CANCELLED';
            const isPostponed = summary.status === 'postponed' || summary.status === 'POSTPONED';

            return (
              <div
                key={summary.matchId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition space-y-3"
              >
                {/* MATCH ROW TOP */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">ID: {summary.matchId}</span>
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800">
                        {summary.leagueName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          isFinished
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : summary.status === 'live' || summary.status === 'LIVE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isCancelled || isPostponed
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {summary.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{summary.homeTeam}</span>
                      <span className="text-slate-500 font-normal">vs</span>
                      <span>{summary.awayTeam}</span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Scheduled: {new Date(summary.startTime).toLocaleString()}
                    </div>
                  </div>

                  {/* RESULT STATUS BADGE */}
                  <div className="flex flex-wrap items-center gap-2">
                    {summary.result ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Certified Result</div>
                          <div className="font-mono font-black text-sm text-white">
                            {summary.result.homeScore} - {summary.result.awayScore}
                          </div>
                        </div>
                        <div className="border-l border-slate-800 pl-2 text-[10px] text-slate-400 space-y-0.5">
                          <div className="flex items-center gap-1 text-emerald-400 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{summary.result.resultSource}</span>
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {summary.result.winner ? `Winner: ${summary.result.winner.toUpperCase()}` : 'Outcome: Draw'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Final Result</span>
                      </div>
                    )}

                    {/* SETTLEMENT STATE BADGE */}
                    <div
                      className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[11px] flex items-center gap-1.5 ${
                        summary.settlementStatus === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : summary.settlementStatus === 'PARTIAL'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : summary.settlementStatus === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : summary.settlementStatus === 'PENDING'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {summary.settlementStatus === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {summary.settlementStatus === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                      {summary.settlementStatus === 'FAILED' && <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{summary.settlementStatus}</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ROW: FINANCIALS & ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-4 text-slate-300">
                    <div>
                      <span className="text-slate-500">Affected Bets: </span>
                      <span className="font-mono font-bold text-white">{summary.affectedBetsCount}</span>
                      <span className="text-slate-500 text-[10px]">
                        {' '}
                        ({summary.settledBetsCount} settled, {summary.pendingBetsCount} pending)
                      </span>
                    </div>

                    <div className="border-l border-slate-800 pl-4">
                      <span className="text-slate-500">Total Stakes: </span>
                      <span className="font-mono font-bold text-white">{summary.totalStakes.toFixed(2)} ETB</span>
                    </div>

                    <div className="border-l border-slate-800 pl-4">
                      <span className="text-slate-500">Total Payouts: </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {summary.totalPayouts.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {summary.affectedBetsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenAffectedBets(summary)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Affected Bets ({summary.affectedBetsCount})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenManualSettle(summary)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer font-medium"
                    >
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>{isFinished ? 'Re-settle / Override' : 'Manual Settle'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: VIEW AFFECTED BETS */}
      {viewingMatchBets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Affected Bets for {viewingMatchBets.match.matchTitle}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {viewingMatchBets.bets.length} tickets placed containing selections on this event
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMatchBets(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {viewingMatchBets.bets.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No bets placed on this match yet.</div>
              ) : (
                viewingMatchBets.bets.map((bet) => (
                  <div key={bet.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">Ticket #{bet.id}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800 rounded text-slate-300">
                          {bet.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Placed: {new Date(bet.placedAt || bet.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          bet.status === 'won' || bet.status === 'WON'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : bet.status === 'lost' || bet.status === 'LOST'
                            ? 'bg-rose-500/20 text-rose-400'
                            : bet.status === 'void' || bet.status === 'VOID'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {bet.status}
                      </span>
                    </div>

                    {/* SELECTIONS */}
                    <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      {bet.selections.map((s, idx) => {
                        const isTargetMatch = s.matchId === viewingMatchBets.match.matchId;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between text-[11px] ${
                              isTargetMatch ? 'text-white font-medium' : 'text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {isTargetMatch && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              )}
                              <span>
                                {s.matchName}: <span className="text-emerald-400 font-bold">{s.selectionName}</span>{' '}
                                <span className="text-slate-500 font-mono">({s.marketName})</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400">@{s.acceptedOdds.toFixed(2)}</span>
                              <span
                                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                                  s.status === 'won' || s.status === 'WON'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : s.status === 'lost' || s.status === 'LOST'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : s.status === 'void' || s.status === 'VOID'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* TOTALS & FINANCIALS */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                      <div>
                        Stake: <span className="font-mono font-bold text-white">{bet.stake.toFixed(2)} ETB</span> • Odds:{' '}
                        <span className="font-mono font-bold text-white">
                          {(bet.effectiveOdds || bet.acceptedOdds || bet.totalOdds).toFixed(2)}
                        </span>
                      </div>

                      <div className="font-mono font-bold">
                        {bet.status === 'won' || bet.status === 'WON' ? (
                          <span className="text-emerald-400">Payout: +{(bet.payoutAmount || 0).toFixed(2)} ETB</span>
                        ) : bet.status === 'void' || bet.status === 'VOID' ? (
                          <span className="text-amber-400">Refunded: {bet.stake.toFixed(2)} ETB</span>
                        ) : (
                          <span className="text-slate-500">
                            Potential: {(bet.potentialReturn || 0).toFixed(2)} ETB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/50">
              <button
                type="button"
                onClick={() => setViewingMatchBets(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL SETTLE MATCH */}
      {manualSettleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Manual Match Result Settlement</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {manualSettleTarget.matchTitle} ({manualSettleTarget.leagueName})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualSettleTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audited Administrative Action</span>
                </div>
                <p>
                  Executing manual settlement will evaluate all pending tickets on this match, update player wallet
                  balances, generate immutable financial ledger transactions, and log your user ID to the immutable audit trail.
                </p>
              </div>

              {/* 1. MATCH STATUS */}
              <div className="space-y-1.5">
                <label className="font-bold text-white">1. Event Status Outcome</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'FINISHED', label: 'Finished (With Score)' },
                    { key: 'CANCELLED', label: 'Cancelled (Void All)' },
                    { key: 'POSTPONED', label: 'Postponed (Void All)' }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setManualStatus(st.key as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        manualStatus === st.key
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. SCORE INPUTS (IF FINISHED) */}
              {manualStatus === 'FINISHED' && (
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <label className="font-bold text-white block">2. Official Final Scores (90 Minutes)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">{manualSettleTarget.homeTeam} (Home)</span>
                      <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">{manualSettleTarget.awayTeam} (Away)</span>
                      <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 font-mono">
                    Calculated Result:{' '}
                    <span className="text-emerald-400 font-bold">
                      {homeScore > awayScore
                        ? `${manualSettleTarget.homeTeam} Wins (Home)`
                        : awayScore > homeScore
                        ? `${manualSettleTarget.awayTeam} Wins (Away)`
                        : 'Match Drawn (X)'}
                    </span>{' '}
                    • Total Goals: {homeScore + awayScore}
                  </div>
                </div>
              )}

              {/* 3. MANDATORY REASON */}
              <div className="space-y-1.5">
                <label className="font-bold text-white flex items-center justify-between">
                  <span>3. Administrative Justification Reason (Required)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Audit Trail Requirement</span>
                </label>
                <textarea
                  rows={3}
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Official result confirmed by Premier League / certified match statistics feed."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
              <button
                type="button"
                onClick={() => setManualSettleTarget(null)}
                className="px-4 py-2 text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmittingManual || !manualReason.trim()}
                onClick={handleExecuteManualSettle}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Settlement & Ledger Credits...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Execute Official Settlement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
