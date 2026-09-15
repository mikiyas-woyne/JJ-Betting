import React, { useState, useEffect } from 'react';
import {
  Activity,
  DollarSign,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Sliders,
  Receipt,
  FileText,
  UserCheck,
  Play,
  Pause,
  RotateCcw,
  Radio,
  Database,
  Server,
  Wifi,
  WifiOff,
  ExternalLink,
  Loader2,
  ArrowDownCircle,
  Key,
  Terminal,
  ChevronDown,
  ChevronUp,
  Gauge,
  Info,
  Copy,
  Check,
  Eye,
  ZoomIn,
  ZoomOut,
  X,
  Building2,
  Smartphone,
  AlertCircle,
  Filter,
  User as UserIcon
} from 'lucide-react';
import { Match, Bet, WalletTransaction, AuditLog, OddsApiDiagnosticResult, DepositRecord } from '../types';
import { api } from '../services/api';
import { AdminDepositsSection } from './AdminDepositsSection';
import { AdminSettlementSection } from './AdminSettlementSection';

interface AdminDashboardProps {
  onBackToSportsbook: () => void;
  matches: Match[];
  onRefreshMatches: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToSportsbook,
  matches,
  onRefreshMatches
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'matches' | 'sportsData' | 'settlements' | 'bets' | 'ledger' | 'audit' | 'roles'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pending Deposit Management State
  const [pendingDeposits, setPendingDeposits] = useState<DepositRecord[]>([]);
  const [isDepositActionLoading, setIsDepositActionLoading] = useState<string | null>(null);
  const [depositFeedback, setDepositFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvingDeposit, setApprovingDeposit] = useState<DepositRecord | null>(null);
  const [approveNote, setApproveNote] = useState<string>('');
  const [rejectingDeposit, setRejectingDeposit] = useState<DepositRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Transfer not found on bank/telebirr statement');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [previewScreenshotDeposit, setPreviewScreenshotDeposit] = useState<DepositRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Sports Provider Sync State
  const [providerStats, setProviderStats] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  
  // Odds API Raw Diagnostic State (/sports/soccer_epl_bp/odds)
  const [isDiagnosingOdds, setIsDiagnosingOdds] = useState<boolean>(false);
  const [oddsDiagnosticResult, setOddsDiagnosticResult] = useState<OddsApiDiagnosticResult | null>(null);
  const [showDiagnosticHeaders, setShowDiagnosticHeaders] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [bookmakerSource, setBookmakerSource] = useState<{ selected: string; available: Array<{ key: string; title: string }> }>({
    selected: 'default',
    available: []
  });
  const [isUpdatingBookmaker, setIsUpdatingBookmaker] = useState<boolean>(false);
  const [bookmakerUpdateMsg, setBookmakerUpdateMsg] = useState<string | null>(null);

  // Sports API Key State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [maskedKey, setMaskedKey] = useState<string>('');
  const [isUpdatingKey, setIsUpdatingKey] = useState<boolean>(false);
  const [keyUpdateMsg, setKeyUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sports Provider Switcher State (ESPN Live vs The Odds API vs API-Football)
  const [providerConfig, setProviderConfig] = useState<{
    activeProvider: string;
    providerKey: string;
    supportedProviders: Array<{ key: string; name: string; description: string }>;
  }>({
    activeProvider: 'ESPN Live Sports Feed',
    providerKey: 'espn',
    supportedProviders: [
      { key: 'espn', name: 'ESPN Official Live Sports Feed', description: 'Real-time scores, team badges, 100% genuine live sports (Zero-key, high availability)' },
      { key: 'the-odds-api', name: 'The Odds API', description: 'Requires active key and available quota credits' },
      { key: 'api-football', name: 'API-Football (RapidAPI)', description: 'Requires RapidAPI key' }
    ]
  });
  const [isSwitchingProvider, setIsSwitchingProvider] = useState<boolean>(false);
  const [providerSwitchMsg, setProviderSwitchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settlement selection states
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [winningSelectionId, setWinningSelectionId] = useState<string>('');
  const [settleStatus, setSettleStatus] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Match live score/status editor states
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoreHome, setScoreHome] = useState<number>(0);
  const [scoreAway, setScoreAway] = useState<number>(0);
  const [scoreMinute, setScoreMinute] = useState<number>(0);

  const loadProviderStats = async () => {
    try {
      const stats = await api.getSportsProviderStatus();
      setProviderStats(stats);
      if (stats.selectedBookmaker && stats.availableBookmakers) {
        setBookmakerSource({
          selected: stats.selectedBookmaker,
          available: stats.availableBookmakers
        });
      }
      api.getSportsApiKeyStatus().then(k => {
        if (k.maskedKey) setMaskedKey(k.maskedKey);
      }).catch(() => {});
      api.getSportsProvider().then(p => {
        setProviderConfig({
          activeProvider: p.activeProvider,
          providerKey: p.providerKey,
          supportedProviders: p.supportedProviders
        });
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to load sports provider stats:', err);
    }
  };

  const handleSwitchProvider = async (providerKey: string) => {
    setIsSwitchingProvider(true);
    setProviderSwitchMsg(null);
    try {
      const res = await api.setSportsProvider(providerKey);
      setProviderSwitchMsg({ type: 'success', text: res.message });
      await loadProviderStats();
      onRefreshMatches();
    } catch (err: any) {
      setProviderSwitchMsg({ type: 'error', text: err.message || 'Failed to switch provider' });
    } finally {
      setIsSwitchingProvider(false);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsUpdatingKey(true);
    setKeyUpdateMsg(null);
    try {
      const res = await api.updateSportsApiKey(apiKeyInput.trim());
      setMaskedKey(res.maskedKey);
      setApiKeyInput('');
      setKeyUpdateMsg({ type: 'success', text: res.message });
      await loadProviderStats();
      onRefreshMatches();
    } catch (err: any) {
      setKeyUpdateMsg({ type: 'error', text: err.message || 'Failed to update API key' });
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const loadBookmakerSource = async () => {
    try {
      const res = await api.getBookmakerSource();
      setBookmakerSource(res);
    } catch (err) {
      console.error('Failed to load bookmaker source:', err);
    }
  };

  const handleBookmakerChange = async (key: string) => {
    try {
      setIsUpdatingBookmaker(true);
      setBookmakerUpdateMsg(null);
      const res = await api.setBookmakerSource(key);
      setBookmakerSource({
        selected: res.selected,
        available: res.available
      });
      setBookmakerUpdateMsg(`Odds source set to ${res.selected.toUpperCase()}`);
      await loadProviderStats();
      setTimeout(() => setBookmakerUpdateMsg(null), 3500);
    } catch (err: any) {
      setBookmakerUpdateMsg(`Failed to change odds source: ${err.message}`);
    } finally {
      setIsUpdatingBookmaker(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [ov, b, txn, audit, pDeposits] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminBets(),
        api.getAdminTransactions(),
        api.getAdminAuditLogs(),
        api.getAdminDeposits('pending')
      ]);
      setOverview(ov);
      setBets(b);
      setTransactions(txn);
      setAuditLogs(audit);
      setPendingDeposits(pDeposits || []);
      await Promise.all([loadProviderStats(), loadBookmakerSource()]);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePendingDeposit = async (deposit: DepositRecord, note?: string) => {
    if (deposit.status !== 'PENDING') {
      setDepositFeedback({ type: 'error', text: `Deposit ${deposit.depositId} is already ${deposit.status}` });
      return;
    }
    try {
      setIsDepositActionLoading(deposit.depositId);
      setDepositFeedback(null);
      await api.approveDeposit(deposit.depositId, note);
      setDepositFeedback({
        type: 'success',
        text: `Deposit #${deposit.depositId.slice(-6)} (+${deposit.amount.toFixed(2)} ETB for ${deposit.username}) approved & credited to user wallet via backend ledger service.`
      });
      setApprovingDeposit(null);
      setApproveNote('');
      await loadAdminData();
    } catch (err: any) {
      setDepositFeedback({ type: 'error', text: err.message || 'Failed to approve deposit' });
    } finally {
      setIsDepositActionLoading(null);
    }
  };

  const handleRejectPendingDeposit = async (deposit: DepositRecord) => {
    const finalReason = rejectReason === 'custom' ? customRejectReason.trim() : rejectReason;
    if (!finalReason) {
      setDepositFeedback({ type: 'error', text: 'Please specify a rejection reason.' });
      return;
    }
    try {
      setIsDepositActionLoading(deposit.depositId);
      setDepositFeedback(null);
      await api.rejectDeposit(deposit.depositId, finalReason);
      setDepositFeedback({
        type: 'success',
        text: `Deposit #${deposit.depositId.slice(-6)} (${deposit.username}) has been marked as REJECTED.`
      });
      setRejectingDeposit(null);
      setCustomRejectReason('');
      await loadAdminData();
    } catch (err: any) {
      setDepositFeedback({ type: 'error', text: err.message || 'Failed to reject deposit' });
    } finally {
      setIsDepositActionLoading(null);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      const res = await api.syncSportsNow();
      setSyncResult(res);
      await loadProviderStats();
      onRefreshMatches();
      await loadAdminData();
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTestingConnection(true);
      setConnectionTestResult(null);
      const res = await api.testSportsProviderConnection();
      setConnectionTestResult(res);
      await loadProviderStats();
    } catch (err: any) {
      setConnectionTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRunOddsDiagnostic = async (sportKey: string = 'soccer_epl_bp') => {
    try {
      setIsDiagnosingOdds(true);
      setOddsDiagnosticResult(null);
      const res = await api.diagnoseOddsFetch(sportKey);
      setOddsDiagnosticResult(res);
      await loadProviderStats();
    } catch (err: any) {
      setOddsDiagnosticResult({
        timestamp: new Date().toISOString(),
        provider: 'The Odds API',
        endpoint: `/sports/${sportKey}/odds`,
        targetUrl: `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=HIDDEN`,
        sanitizedUrl: `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=HIDDEN`,
        httpStatus: 500,
        statusText: 'Diagnostic Request Failed',
        headers: {},
        responseBody: null,
        errorBody: err.message || 'Diagnostic error occurred while contacting server',
        parsedError: null,
        isError: true,
        success: false,
        durationMs: 0,
        apiKeyConfigured: false,
        maskedApiKey: '[ERROR]',
        quotaInfo: {
          isExhausted: true,
          remaining: '0',
          used: null,
          lastCost: null,
          errorCode: 'DIAGNOSTIC_FAILURE',
          message: err.message || 'Could not complete diagnostic request'
        }
      });
    } finally {
      setIsDiagnosingOdds(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Update selected market when match changes
  const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
  useEffect(() => {
    if (activeMatch && activeMatch.markets && activeMatch.markets.length > 0) {
      setSelectedMarketId(activeMatch.markets[0].id);
    }
  }, [selectedMatchId, activeMatch]);

  const activeMarket = activeMatch?.markets?.find(m => m.id === selectedMarketId);
  useEffect(() => {
    if (activeMarket && activeMarket.selections && activeMarket.selections.length > 0) {
      setWinningSelectionId(activeMarket.selections[0].id);
    }
  }, [selectedMarketId, activeMarket]);

  // Handle Match Status Change
  const handleStatusChange = async (matchId: string, newStatus: string) => {
    try {
      await api.updateMatchStatus(matchId, newStatus);
      onRefreshMatches();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Handle Match Score Update
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      await api.updateMatchScore(editingMatch.id, scoreHome, scoreAway, scoreMinute);
      setEditingMatch(null);
      onRefreshMatches();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Score update failed');
    }
  };

  // Execute Settlement
  const handleExecuteSettlement = async () => {
    if (!selectedMatchId || !selectedMarketId || !winningSelectionId) {
      alert('Please choose a match, market, and winning selection.');
      return;
    }

    try {
      setIsSettling(true);
      setSettleStatus(null);
      const res = await api.settleMarket(selectedMatchId, selectedMarketId, winningSelectionId);
      setSettleStatus(`Settlement executed! ${res.betsAffected} bet(s) affected. Total payout credited: ${res.totalPayout.toFixed(2)} ETB`);
      onRefreshMatches();
      await loadAdminData();
    } catch (err: any) {
      setSettleStatus('Settlement error: ' + err.message);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">Apex Sportsbook Control Suite</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Trading & Regulatory Desk
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Server-Authoritative Bets • Immutable Ledger • Zero-Trust ABAC Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAdminData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onBackToSportsbook}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Back to Sportsbook UI
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Total Wagering Handle</div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-1">
              {overview ? `${overview.totalHandle.toLocaleString()} ETB` : '...'}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Gross Gaming Rev (GGR)</div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-1">
              {overview ? `${overview.ggr.toLocaleString()} ETB` : '...'}
            </div>
          </div>
          <div
            onClick={() => setActiveTab('deposits')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              (overview?.pendingDepositsCount || 0) > 0
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 hover:border-amber-400 shadow-sm shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
            title="Click to view pending deposits"
          >
            <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
              <span>Pending Deposits</span>
              {(overview?.pendingDepositsCount || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-400 mt-1">
              {overview ? overview.pendingDepositsCount : 0}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Pending Bets</div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-400 mt-1">
              {overview ? overview.pendingBetsCount : '...'}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Live Matches</div>
            <div className="text-base sm:text-lg font-black font-mono text-red-400 mt-1">
              {overview ? overview.liveMatchesCount : '...'}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Platform Liquidity</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-200 mt-1">
              {overview ? `${(overview.availableLiquidity / 1000).toFixed(0)}k ETB` : '...'}
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="text-slate-400 text-[11px] font-medium">Ledger Audit Count</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-300 mt-1">
              {overview ? overview.totalTransactions : '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            {
              id: 'deposits',
              label: (overview?.pendingDepositsCount || 0) > 0
                ? `Deposits (${overview.pendingDepositsCount} pending)`
                : 'Deposits',
              icon: ArrowDownCircle
            },
            { id: 'sportsData', label: 'Sports Data & Feeds', icon: Radio },
            { id: 'matches', label: 'Matches & Odds Trading', icon: Sliders },
            { id: 'settlements', label: 'Settlement Engine', icon: Trophy },
            { id: 'bets', label: `Placed Bets (${bets.length})`, icon: Receipt },
            { id: 'ledger', label: `Financial Ledger (${transactions.length})`, icon: DollarSign },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
            { id: 'roles', label: 'Staff & Roles', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Regulatory Health */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Regulatory Compliance Status</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Server-Authoritative Validation:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE & ENFORCED</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Financial Ledger Architecture:</span>
                    <span className="text-emerald-400 font-bold">IMMUTABLE (Double-Entry)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Responsible Gaming Engine:</span>
                    <span className="text-emerald-400 font-bold">DAILY LIMITS & TIMEOUTS</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">KYC Verification Gate:</span>
                    <span className="text-emerald-400 font-bold">TIER 1 ENFORCED</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Quick Operations */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Real-time Platform Operations</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Use the tabs above to manage live match states, simulate goals and period changes, adjust market odds with immediate server synchronization, or trigger market settlements to automatically distribute winnings.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('settlements')}
                    className="px-3.5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Open Settlement Engine
                  </button>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="px-3.5 py-2 bg-slate-800 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    Manage Matches & Odds
                  </button>
                </div>
              </div>
            </div>

            {/* PENDING DEPOSIT VERIFICATION QUEUE SECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">Pending Deposit Verification Queue</h3>
                      <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">
                        {pendingDeposits.length} Action Needed
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Verify user manual bank/Telebirr transfers & approve to credit user wallets via backend ledger
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={loadAdminData}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Queue</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>View All Deposits Desk</span>
                  </button>
                </div>
              </div>

              {depositFeedback && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  depositFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {depositFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{depositFeedback.text}</span>
                  </div>
                  <button onClick={() => setDepositFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {pendingDeposits.length === 0 ? (
                <div className="py-8 text-center space-y-3 bg-slate-950/50 rounded-xl border border-slate-800/60 p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">All Deposit Requests Processed</h4>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    There are no pending user deposit verification requests in the queue right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingDeposits.map(dep => {
                    const isActioning = isDepositActionLoading === dep.depositId;
                    return (
                      <div
                        key={dep.depositId}
                        className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg">
                          PENDING VERIFICATION
                        </div>

                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs">
                              {dep.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{dep.username}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({dep.userId.slice(-6)})</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(dep.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Amount Requested:</span>
                              <span className="text-emerald-400 font-black font-mono text-sm">
                                +{dep.amount.toFixed(2)} {dep.currency || 'ETB'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Payment Provider:</span>
                              <span className="text-slate-200 font-semibold capitalize flex items-center gap-1">
                                {dep.paymentMethod?.toLowerCase().includes('telebirr') ? (
                                  <Smartphone className="w-3 h-3 text-cyan-400" />
                                ) : (
                                  <Building2 className="w-3 h-3 text-amber-400" />
                                )}
                                {dep.paymentMethodName || dep.paymentMethod}
                              </span>
                            </div>

                            {dep.paymentReference && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Reference / FT#:</span>
                                <span className="text-amber-300 font-mono font-semibold">{dep.paymentReference}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions & Proof */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          {dep.screenshotUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewScreenshotDeposit(dep);
                                setZoomLevel(1);
                                setRotation(0);
                              }}
                              className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>Inspect Transfer Proof Image</span>
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => {
                                setApprovingDeposit(dep);
                                setApproveNote('');
                              }}
                              className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-500/20 active:scale-98"
                            >
                              {isActioning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => {
                                setRejectingDeposit(dep);
                                setRejectReason('Transfer not found on bank/telebirr statement');
                                setCustomRejectReason('');
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 font-semibold text-xs border border-slate-700 hover:border-red-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MANUAL DEPOSIT VERIFICATION SYSTEM */}
        {activeTab === 'deposits' && (
          <AdminDepositsSection onDepositApproved={() => loadAdminData()} />
        )}

        {/* TAB 2: MATCHES & ODDS TRADING */}
        {activeTab === 'matches' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white">Active Sportsbook Catalog & Trading Controls</h2>
              <span className="text-slate-400">Click actions to suspend, resume, or edit live score</span>
            </div>

            <div className="space-y-3">
              {matches.map(m => (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 uppercase font-mono">{m.sportId} • {m.leagueName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          m.status === 'live'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                            : m.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : m.status === 'finished'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="text-base font-black text-white">
                      {m.homeTeam} vs {m.awayTeam}
                      {m.score && (
                        <span className="text-emerald-400 font-mono ml-2">
                          ({m.score.home} - {m.score.away}) • {m.score.minute}'
                        </span>
                      )}
                    </div>

                    <div className="text-slate-500 text-[10px] sm:text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1">
                      <div>Start: {new Date(m.startTime).toLocaleString()}</div>
                      <div>Updated: {m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : 'N/A'}</div>
                      <div className="sm:col-span-2">Provider ID: {m.providerEventId || 'N/A'}</div>
                      <div className="sm:col-span-2">
                        {m.markets?.length || 0} active markets • Primary Odds:{' '}
                        {m.markets?.[0]?.selections?.map(s => `${s.name}: ${s.oddsValue.toFixed(2)}`).join(' | ') || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    {/* Live score edit button */}
                    <button
                      onClick={() => {
                        setEditingMatch(m);
                        setScoreHome(m.score?.home || 0);
                        setScoreAway(m.score?.away || 0);
                        setScoreMinute(m.score?.minute || 0);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold cursor-pointer"
                    >
                      Update Score
                    </button>

                    {/* Status Toggles */}
                    {m.status !== 'live' && (
                      <button
                        onClick={() => handleStatusChange(m.id, 'live')}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold cursor-pointer"
                      >
                        Set LIVE
                      </button>
                    )}

                    {m.status !== 'suspended' && (
                      <button
                        onClick={() => handleStatusChange(m.id, 'suspended')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}

                    {m.status === 'suspended' && (
                      <button
                        onClick={() => handleStatusChange(m.id, 'scheduled')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold cursor-pointer"
                      >
                        Resume
                      </button>
                    )}

                    {m.status !== 'finished' && (
                      <button
                        onClick={() => handleStatusChange(m.id, 'finished')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold cursor-pointer"
                      >
                        Mark Finished
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Edit Modal */}
            {editingMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4">
                  <h3 className="font-black text-white text-base">
                    Update Live Score ({editingMatch.homeTeam} vs {editingMatch.awayTeam})
                  </h3>
                  <form onSubmit={handleScoreSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">{editingMatch.homeTeam}</label>
                        <input
                          type="number"
                          value={scoreHome}
                          onChange={(e) => setScoreHome(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center font-mono font-bold text-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">{editingMatch.awayTeam}</label>
                        <input
                          type="number"
                          value={scoreAway}
                          onChange={(e) => setScoreAway(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center font-mono font-bold text-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Match Minute</label>
                      <input
                        type="number"
                        value={scoreMinute}
                        onChange={(e) => setScoreMinute(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingMatch(null)}
                        className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                      >
                        Save Score
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTLEMENTS */}
        {activeTab === 'settlements' && (
          <AdminSettlementSection
            onRefreshData={() => {
              loadAdminData();
              onRefreshMatches();
            }}
          />
        )}

        {/* TAB 4: BETS MONITOR */}
        {activeTab === 'bets' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white">Active System-Wide Wagers</h3>
            <div className="space-y-2">
              {bets.map(b => (
                <div
                  key={b.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">#{b.id}</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 uppercase">
                        {b.type}
                      </span>
                      <span className="text-[11px] text-slate-500">{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">
                      {b.selections.map(s => `${s.matchName}: ${s.selectionName} (${s.oddsAtPlacement})`).join(' + ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-slate-400 text-[11px]">Stake / Return</div>
                      <div className="font-mono font-bold text-white">
                        {b.stake} ETB → <span className="text-emerald-400">{b.potentialReturn} ETB</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                        b.status === 'won'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : b.status === 'lost'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FINANCIAL LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white">Double-Entry Financial Transactions</h3>
            <div className="space-y-2">
              {transactions.map(txn => (
                <div
                  key={txn.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">{txn.referenceId}</span>
                      <span className="font-bold text-white">{txn.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(txn.createdAt).toLocaleString()} • Balance: {txn.balanceBefore.toFixed(2)} → {txn.balanceAfter.toFixed(2)} ETB
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        txn.amount > 0 ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {txn.amount > 0 ? `+${txn.amount.toFixed(2)}` : `${txn.amount.toFixed(2)}`} ETB
                    </div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white">System Security & Regulatory Audit Trail</h3>
            <div className="space-y-2 font-mono">
              {auditLogs.map(log => (
                <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300 text-xs">{log.details}</div>
                  <div className="text-[10px] text-slate-500">
                    Actor: {log.actorEmail} ({log.actorId})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SPORTS DATA & ODDS INTEGRATION */}
        {activeTab === 'sportsData' && (
          <div className="space-y-6 text-xs max-w-5xl">
            {/* Header & Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">External Sports Data & Live Odds Provider</h3>
                    <p className="text-slate-400 text-xs">
                      Server-side adapter integration with automated schema normalization and odds verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5 text-blue-400" />}
                    <span>Test Connection</span>
                  </button>

                  <button
                    onClick={() => handleRunOddsDiagnostic('soccer_epl_bp')}
                    disabled={isDiagnosingOdds}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-amber-500/30"
                    title="Fetch raw response from 'https://api.the-odds-api.com/v4/sports/soccer_epl_bp/odds?apiKey=HIDDEN'"
                  >
                    {isDiagnosingOdds ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Terminal className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Diagnose Odds (soccer_epl_bp)</span>
                  </button>

                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || providerStats?.syncInProgress}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSyncing || providerStats?.syncInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Syncing Feeds...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>SYNC NOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Provider Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Provider Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      providerStats?.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : providerStats?.status === 'rate_limited'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : providerStats?.status === 'unconfigured'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {providerStats?.status ? providerStats.status.toUpperCase() : 'CHECKING...'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Active Provider:</span>
                    <span className="font-bold text-white font-mono">{providerStats?.providerName || 'The Odds API'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Provider Base URL:</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate max-w-[220px]">
                      {providerStats?.providerBaseUrl || 'https://api.the-odds-api.com/v4'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">API Key Configured:</span>
                    <span className={`font-mono font-bold ${providerStats?.isConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {providerStats?.isConfigured ? 'YES (Server Secret)' : 'NO (Using Verified Baseline)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Last Successful Sync:</span>
                    <span className="font-mono text-slate-200">
                      {providerStats?.lastSuccessfulSync
                        ? new Date(providerStats.lastSuccessfulSync).toLocaleTimeString() + ' (' + new Date(providerStats.lastSuccessfulSync).toLocaleDateString() + ')'
                        : 'Baseline Seed Active'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Last Failed Sync:</span>
                    <span className="font-mono text-slate-400">
                      {providerStats?.lastFailedSync
                        ? new Date(providerStats.lastFailedSync).toLocaleTimeString()
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Sync Status Note:</span>
                    <span className="text-slate-300 font-medium text-[11px] truncate max-w-[240px]">
                      {providerStats?.statusMessage || 'Catalog active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time sync feedback message banner */}
              {syncResult && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  syncResult.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}>
                  {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{syncResult.message}</span>
                </div>
              )}

              {/* Connection Test Result banner */}
              {connectionTestResult && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  connectionTestResult.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {connectionTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{connectionTestResult.message}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                    {connectionTestResult.latencyMs !== undefined && (
                      <span>Latency: {connectionTestResult.latencyMs}ms</span>
                    )}
                    {connectionTestResult.remainingRequests && (
                      <span className="text-emerald-400 font-bold">Quota Remaining: {connectionTestResult.remainingRequests}</span>
                    )}
                    <span>HTTP {connectionTestResult.details?.httpStatus || '200'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Odds API Raw Response Diagnostic Inspector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">Odds Endpoint Diagnostic Panel</h3>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                        soccer_epl_bp/odds
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-mono">
                      Target: https://api.the-odds-api.com/v4/sports/soccer_epl_bp/odds?apiKey=HIDDEN
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunOddsDiagnostic('soccer_epl_bp')}
                  disabled={isDiagnosingOdds}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 text-xs shrink-0"
                >
                  {isDiagnosingOdds ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching Raw Endpoint...</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Execute Diagnostic Call</span>
                    </>
                  )}
                </button>
              </div>

              {/* Diagnostic Results View */}
              {oddsDiagnosticResult ? (
                <div className="space-y-4">
                  {/* High Level Quota & Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Quota State */}
                    <div className={`p-3 rounded-xl border ${
                      oddsDiagnosticResult.quotaInfo?.isExhausted || oddsDiagnosticResult.httpStatus === 429 || oddsDiagnosticResult.httpStatus === 401
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5" />
                        <span>Quota Status</span>
                      </div>
                      <div className="font-bold text-sm truncate">
                        {oddsDiagnosticResult.quotaInfo?.isExhausted || oddsDiagnosticResult.httpStatus === 429 || oddsDiagnosticResult.httpStatus === 401
                          ? 'Quota Exhausted'
                          : 'Active Quota'}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5 truncate font-mono">
                        {oddsDiagnosticResult.quotaInfo?.errorCode || (oddsDiagnosticResult.httpStatus === 200 ? 'SUCCESS' : `HTTP ${oddsDiagnosticResult.httpStatus}`)}
                      </div>
                    </div>

                    {/* Requests Remaining */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Requests Remaining
                      </div>
                      <div className={`font-mono font-bold text-sm ${
                        (oddsDiagnosticResult.requestsRemaining === '0' || oddsDiagnosticResult.quotaInfo?.remaining === '0')
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}>
                        {oddsDiagnosticResult.requestsRemaining ?? oddsDiagnosticResult.quotaInfo?.remaining ?? '0'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        x-requests-remaining
                      </div>
                    </div>

                    {/* Requests Used */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Requests Used
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-200">
                        {oddsDiagnosticResult.requestsUsed ?? oddsDiagnosticResult.quotaInfo?.used ?? 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        x-requests-used
                      </div>
                    </div>

                    {/* HTTP Status & Latency */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        HTTP Status & Latency
                      </div>
                      <div className={`font-mono font-bold text-sm ${oddsDiagnosticResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {oddsDiagnosticResult.httpStatus || 500} {oddsDiagnosticResult.statusText || ''}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {oddsDiagnosticResult.durationMs}ms roundtrip
                      </div>
                    </div>
                  </div>

                  {/* Quota Exhaustion / Rate Limit Warning Callout */}
                  {(oddsDiagnosticResult.quotaInfo?.isExhausted || oddsDiagnosticResult.isError) && (
                    <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-1.5 text-rose-200">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Quota / Rate-Limit Alert: {oddsDiagnosticResult.quotaInfo?.errorCode || `HTTP ${oddsDiagnosticResult.httpStatus}`}</span>
                      </div>
                      <div className="text-[11px] text-rose-300 leading-relaxed">
                        {oddsDiagnosticResult.quotaInfo?.message || oddsDiagnosticResult.parsedError?.message || oddsDiagnosticResult.errorBody || 'Usage credits have been depleted or access was rejected.'}
                      </div>
                      <div className="text-[10px] text-rose-400/80 font-mono pt-0.5">
                        API Key: {oddsDiagnosticResult.maskedApiKey} | Last Request Cost: {oddsDiagnosticResult.requestsLast || oddsDiagnosticResult.quotaInfo?.lastCost || '0'} credits
                      </div>
                    </div>
                  )}

                  {/* Response Headers Collapsible */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDiagnosticHeaders(!showDiagnosticHeaders)}
                      className="w-full px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 flex items-center justify-between text-slate-300 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-semibold text-xs text-white">Full HTTP Response Headers</span>
                        <span className="text-[10px] text-slate-500 font-mono">({Object.keys(oddsDiagnosticResult.headers || {}).length} headers)</span>
                      </div>
                      {showDiagnosticHeaders ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {showDiagnosticHeaders && (
                      <div className="p-3 bg-slate-950 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto border-t border-slate-800">
                        {Object.keys(oddsDiagnosticResult.headers || {}).length > 0 ? (
                          Object.entries(oddsDiagnosticResult.headers).map(([key, val]) => (
                            <div key={key} className="flex gap-2 py-0.5 border-b border-slate-900/60 last:border-0">
                              <span className="text-slate-400 font-semibold min-w-[170px] shrink-0">{key}:</span>
                              <span className={`${key.includes('request') ? 'text-amber-300 font-bold' : 'text-slate-300'} break-all`}>{val}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 italic py-1">No headers captured</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Full Raw Error / Response Body block */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-xs text-white">
                          {oddsDiagnosticResult.isError ? 'Full Raw Response Error Body' : 'Raw Response Body'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(oddsDiagnosticResult.errorBody || oddsDiagnosticResult.responseBody || '');
                          setCopiedPayload(true);
                          setTimeout(() => setCopiedPayload(false), 2000);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800 cursor-pointer"
                      >
                        {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed">
                      {oddsDiagnosticResult.errorBody || oddsDiagnosticResult.responseBody || (oddsDiagnosticResult.success ? 'HTTP 200 OK: Valid response received' : 'No response payload')}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                  Click <strong className="text-amber-300">"Execute Diagnostic Call"</strong> to query <code className="text-slate-200 font-mono">https://api.the-odds-api.com/v4/sports/soccer_epl_bp/odds?apiKey=HIDDEN</code>, log status, headers, and error details, and inspect quota limits.
                </div>
              )}
            </div>

            {/* Live Sports Data Provider Selector Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Live Sports Data Provider Feed</h3>
                    <p className="text-slate-400 text-xs">
                      Switch between high-availability real-time sports providers. All fixtures are authentic real-world events.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-medium">Current Provider:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold uppercase font-mono text-xs">
                    {providerConfig.activeProvider}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option 1: ESPN Official Live Feed */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  providerConfig.providerKey === 'espn'
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        ESPN Live Feed
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        FREE & LIVE
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Official live scores, authentic club crests & logos, real European match schedules without API key limits.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSwitchingProvider || providerConfig.providerKey === 'espn'}
                    onClick={() => handleSwitchProvider('espn')}
                    className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      providerConfig.providerKey === 'espn'
                        ? 'bg-emerald-500 text-slate-950 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {providerConfig.providerKey === 'espn' ? 'Active Feed' : 'Switch to ESPN Feed'}
                  </button>
                </div>

                {/* Option 2: The Odds API */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  providerConfig.providerKey === 'the-odds-api'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        The Odds API
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        COMMERCIAL
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Commercial odds feed. Requires active API key with monthly usage credits. Switches to ESPN automatically when quota depleted.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSwitchingProvider || providerConfig.providerKey === 'the-odds-api'}
                    onClick={() => handleSwitchProvider('the-odds-api')}
                    className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      providerConfig.providerKey === 'the-odds-api'
                        ? 'bg-amber-500 text-slate-950 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {providerConfig.providerKey === 'the-odds-api' ? 'Active Feed' : 'Switch to The Odds API'}
                  </button>
                </div>

                {/* Option 3: API-Football */}
                <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  providerConfig.providerKey === 'api-football'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        API-Football
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        RAPIDAPI
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      European soccer catalog via RapidAPI. Requires RapidAPI subscription key.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSwitchingProvider || providerConfig.providerKey === 'api-football'}
                    onClick={() => handleSwitchProvider('api-football')}
                    className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      providerConfig.providerKey === 'api-football'
                        ? 'bg-blue-500 text-slate-950 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {providerConfig.providerKey === 'api-football' ? 'Active Feed' : 'Switch to API-Football'}
                  </button>
                </div>
              </div>

              {providerSwitchMsg && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  providerSwitchMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}>
                  {providerSwitchMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{providerSwitchMsg.text}</span>
                </div>
              )}
            </div>

            {/* Provider API Key Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Live Sports Data API Key Configuration</h3>
                    <p className="text-slate-400 text-xs">
                      Persistent API credentials for The Odds API. Configured server-side for uninterrupted real-time feeds in production.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-medium">Active Key:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-xs">
                    {maskedKey || 'Loaded from config'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  placeholder="Enter The Odds API Key (32 characters)..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400/80"
                />
                <button
                  type="button"
                  disabled={isUpdatingKey || !apiKeyInput.trim()}
                  onClick={handleUpdateApiKey}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Save & Re-sync Feed</span>
                </button>
              </div>

              {keyUpdateMsg && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  keyUpdateMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}>
                  {keyUpdateMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{keyUpdateMsg.text}</span>
                </div>
              )}
            </div>

            {/* Internal Odds-Source Selection Layer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Odds-Source Selection Layer</h3>
                    <p className="text-slate-400 text-xs">
                      Configure server bookmaker extraction priority. Normalized into canonical 1X2 / Match Winner markets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-medium">Selected Source:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold uppercase font-mono text-xs">
                    {bookmakerSource.selected}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-slate-300 font-bold text-xs">
                    Select Primary Bookmaker Source
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {bookmakerSource.available.map((bm) => {
                      const isSelected = bookmakerSource.selected === bm.key;
                      return (
                        <button
                          key={bm.key}
                          type="button"
                          disabled={isUpdatingBookmaker}
                          onClick={() => handleBookmakerChange(bm.key)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            isSelected
                              ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {bm.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-slate-400 text-[11px] space-y-1">
                  <div className="font-bold text-slate-200">European Priority Fallback</div>
                  <p>
                    When configured, odds are extracted from your selected source first. If unavailable, European top-tier bookmakers (Pinnacle, William Hill, Tipico, Betclic) act as reliable fallbacks.
                  </p>
                  {bookmakerUpdateMsg && (
                    <div className="text-emerald-400 font-bold pt-1">{bookmakerUpdateMsg}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Sports & European Competitions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Sports */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span>Active Provider Sports ({providerStats?.activeSportsCount || 4})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">v4 /sports</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(providerStats?.activeSportsList || ['Football / Soccer', 'Basketball', 'Tennis', 'American Football']).map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prioritized Football Competitions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Prioritized European Competitions</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">Real Feeds</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(providerStats?.activeFootballCompetitions || [
                    'English Premier League',
                    'UEFA Champions League',
                    'La Liga',
                    'Serie A',
                    'Bundesliga',
                    'Ligue 1',
                    'UEFA Europa League'
                  ]).map((c: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span>{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-[11px] font-medium">Matches Synchronized</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  {providerStats ? providerStats.matchesSynced : matches.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {providerStats?.upcomingMatchesCount !== undefined ? `${providerStats.upcomingMatchesCount} Upcoming` : 'Normalised Fixtures'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-[11px] font-medium">Live Matches In-Play</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-red-400 mt-1">
                  {providerStats ? providerStats.liveMatchesCount : matches.filter(m => m.status === 'live').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Real-time / Scores</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-[11px] font-medium">Active Markets</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                  {providerStats ? providerStats.activeMarketsCount : '...'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Match Winner & More</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-[11px] font-medium">Active Selections</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
                  {providerStats ? providerStats.activeSelectionsCount : '...'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Verified Odds Values</div>
              </div>
            </div>

            {/* Architecture & Security Specifications */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Zero-Trust Sports Data Architecture Specification</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Server-Side Provider Isolation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Browser never makes direct HTTP requests to the external sports API. All requests pass through our Node.js adapter, ensuring <code className="text-amber-400 font-mono">SPORTS_API_KEY</code> is never exposed to DevTools.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Canonical Data Normalization</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The external provider's JSON is immediately normalized into internal Apex models (<code className="text-emerald-400 font-mono">Match</code>, <code className="text-emerald-400 font-mono">Market</code>, <code className="text-emerald-400 font-mono">Selection</code>), decoupling UI components from provider vendors.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Authoritative Odds Validation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    At bet placement time, <code className="text-blue-400 font-mono">oddsService.validateBetTicket</code> verifies the live selection and odds. If odds moved or markets suspended, wagers are rejected with exact error messages.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Configurable Secrets & Providers</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Configured through <code className="text-amber-400 font-mono">SPORTS_API_KEY</code>, <code className="text-amber-400 font-mono">SPORTS_API_BASE_URL</code>, and <code className="text-amber-400 font-mono">SPORTS_API_PROVIDER</code> (The Odds API, API-Football).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: STAFF & ROLES */}
        {activeTab === 'roles' && (
          <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Role-Based Access Control (RBAC)</h3>
            <div className="space-y-2.5">
              {[
                { role: 'Administrator', email: 'mikiyaswoyne@gmail.com', access: 'Full system, user management, and ledger oversight' },
                { role: 'Odds Trader', email: 'trader.desk@sportsbook.et', access: 'Live match status, market suspension, and odds adjustment' },
                { role: 'Compliance Officer', email: 'compliance@gaming-board.gov', access: 'Audit log exports, AML transaction review, self-exclusion inspection' },
                { role: 'Settlement Officer', email: 'settlements@sportsbook.et', access: 'Certified match result entry and bet payout execution' }
              ].map((staff, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                  <div className="flex justify-between font-bold text-white">
                    <span>{staff.role}</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Active</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{staff.email}</div>
                  <div className="text-[10px] text-slate-500">{staff.access}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* APPROVAL CONFIRMATION MODAL WITH STATEMENT NOTE */}
      {approvingDeposit && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Approve Deposit & Credit User Wallet</span>
              </div>
              <button
                onClick={() => setApprovingDeposit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer Username:</span>
                <span className="text-white font-semibold">{approvingDeposit.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Deposit Amount:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  +{approvingDeposit.amount.toFixed(2)} {approvingDeposit.currency || 'ETB'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Method:</span>
                <span className="text-slate-200 capitalize">{approvingDeposit.paymentMethodName || approvingDeposit.paymentMethod}</span>
              </div>
              {approvingDeposit.paymentReference && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Transaction Reference:</span>
                  <span className="text-amber-300 font-mono">{approvingDeposit.paymentReference}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Optional Admin Note / Bank Statement Reference:
              </label>
              <input
                type="text"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="e.g. Statement verified #FT260991823"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingDeposit(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDepositActionLoading === approvingDeposit.depositId}
                onClick={() => handleApprovePendingDeposit(approvingDeposit, approveNote)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
              >
                {isDepositActionLoading === approvingDeposit.depositId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Ledger...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Credit Wallet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION CONFIRMATION MODAL */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Reject Deposit Request</span>
              </div>
              <button
                onClick={() => setRejectingDeposit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-semibold">{rejectingDeposit.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Amount:</span>
                <span className="text-slate-200 font-mono font-bold">
                  {rejectingDeposit.amount.toFixed(2)} {rejectingDeposit.currency || 'ETB'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">
                Select Rejection Reason:
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Transfer not found on bank/telebirr statement">Transfer not found on bank/telebirr statement</option>
                <option value="Incorrect transfer reference or FT number">Incorrect transfer reference or FT number</option>
                <option value="Unclear or unreadable receipt screenshot">Unclear or unreadable receipt screenshot</option>
                <option value="Duplicate deposit submission attempt">Duplicate deposit submission attempt</option>
                <option value="custom">Other custom reason...</option>
              </select>

              {rejectReason === 'custom' && (
                <textarea
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Enter detailed reason for customer..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDeposit(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDepositActionLoading === rejectingDeposit.depositId}
                onClick={() => handleRejectPendingDeposit(rejectingDeposit)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
              >
                {isDepositActionLoading === rejectingDeposit.depositId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT PROOF ZOOM MODAL */}
      {previewScreenshotDeposit && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Eye className="w-5 h-5 text-blue-400" />
                <span>Transfer Proof Screenshot — {previewScreenshotDeposit.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(z + 0.25, 2.5))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.75))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  title="Rotate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewScreenshotDeposit(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={previewScreenshotDeposit.screenshotUrl}
                alt="Payment Receipt Proof"
                className="max-h-[60vh] object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">
                Amount: <strong className="text-emerald-400">{previewScreenshotDeposit.amount} ETB</strong>
              </span>
              <button
                type="button"
                onClick={() => setPreviewScreenshotDeposit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
