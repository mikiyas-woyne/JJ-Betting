import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Radio,
  ShieldCheck,
  Award,
  AlertCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Match, Sport, BetSlipItem, Wallet, Bet, Notification, User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { SportsBar } from './components/SportsBar';
import { MatchCard } from './components/MatchCard';
import { MatchDetailsModal } from './components/MatchDetailsModal';
import { BetSlip } from './components/BetSlip';
import { WalletModal } from './components/WalletModal';
import { BetHistoryModal } from './components/BetHistoryModal';
import { ResponsibleGamblingModal } from './components/ResponsibleGamblingModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [activeView, setActiveView] = useState<'sportsbook' | 'admin'>('sportsbook');
  const [sports, setSports] = useState<Sport[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string>('all');
  const [timingFilter, setTimingFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  
  // Modals & Sliders
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isBetsOpen, setIsBetsOpen] = useState<boolean>(false);
  const [isLimitsOpen, setIsLimitsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [betHistoryFilter, setBetHistoryFilter] = useState<'all' | 'pending' | 'won' | 'lost' | 'void' | 'cancelled'>('pending');

  // User State
  const [user, setUser] = useState<User>({
    id: 'usr_licensed_01',
    email: 'mikiyaswoyne@gmail.com',
    displayName: 'Mikiyas W.',
    role: 'customer',
    kycStatus: 'tier1_verified',
    dailyDepositLimit: 50000,
    singleBetLimit: 10000,
    createdAt: new Date().toISOString()
  });
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Bet Slip Items
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(true);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getSports(),
        api.getMatches(),
        api.getUserProfile(),
        api.getWallet(),
        api.getMyBets(),
        api.getNotifications(),
        api.getTransactions(),
        api.getSportsProviderStatus()
      ]);
      if (results[0].status === 'fulfilled') setSports(results[0].value);
      if (results[1].status === 'fulfilled') {
        const m = results[1].value;
        setMatches(m);
        if (m.length > 0) setLastUpdatedTime(Date.now());
      }
      if (results[2].status === 'fulfilled') setUser(results[2].value);
      if (results[3].status === 'fulfilled') setWallet(results[3].value);
      if (results[4].status === 'fulfilled') setUserBets(results[4].value);
      if (results[5].status === 'fulfilled') setNotifications(results[5].value);
      if (results[6].status === 'fulfilled') setTransactions(results[6].value);
      if (results[7].status === 'fulfilled') setProviderStatus(results[7].value);
    } catch (err) {
      console.warn('[Sportsbook] Initial data fetch notice:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchMatchesDataSilently = async () => {
    try {
      const [matchesData, pStatus] = await Promise.all([
        api.getMatches(),
        api.getSportsProviderStatus()
      ]);
      if (Array.isArray(matchesData)) {
        setMatches(matchesData);
        if (matchesData.length > 0) {
          setLastUpdatedTime(Date.now());
        }
      }
      if (pStatus) {
        setProviderStatus(pStatus);
      }
    } catch (err) {
      console.warn('[Sportsbook] Background poll skipped:', err);
    }
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await api.syncSportsNow();
      await fetchMatchesDataSilently();
    } catch (err) {
      console.warn('[Sportsbook] Retry sync notice:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchMatchesDataSilently();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdatedTime) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

  // Toggle selection in bet slip
  const handleToggleSelection = (item: BetSlipItem) => {
    setBetSlipItems(prev => {
      const exists = prev.some(b => b.matchId === item.matchId && b.selectionId === item.selectionId);
      if (exists) {
        return prev.filter(b => !(b.matchId === item.matchId && b.selectionId === item.selectionId));
      }
      // If same match has a pick, replace it for standard single pick, or append
      const otherMatchesPicks = prev.filter(b => b.matchId !== item.matchId);
      return [...otherMatchesPicks, item];
    });
  };

  const handleRemoveBetItem = (selectionId: string) => {
    setBetSlipItems(prev => prev.filter(b => b.selectionId !== selectionId));
  };

  const handleClearAllBets = () => {
    setBetSlipItems([]);
  };

  const handleUpdateBetItemOdds = (selectionId: string, newOdds: number) => {
    setBetSlipItems(prev => prev.map(item => {
      if (item.selectionId === selectionId) {
        return { ...item, oddsValue: newOdds };
      }
      return item;
    }));
  };

  // Place Bet Handler (Invokes server validation!)
  const handlePlaceBet = async (type: 'single' | 'multiple', stake: number, items: BetSlipItem[]): Promise<Bet> => {
    const payload = items.map(i => ({
      matchId: i.matchId,
      marketId: i.marketId,
      selectionId: i.selectionId,
      oddsValue: i.oddsValue
    }));
    const res = await api.placeBet(type, stake, payload);
    setWallet(res.wallet);
    setUserBets(prev => [res.bet, ...prev]);
    setTransactions(prev => [res.transaction, ...prev]);
    return res.bet;
  };

  // Deposit Handler
  const handleDeposit = async (amount: number, providerId: string, account: string) => {
    const res = await api.depositFunds(amount, providerId, undefined, account);
    setWallet(res.wallet);
    setTransactions(prev => [res.transaction, ...prev]);
  };

  // Withdraw Handler
  const handleWithdraw = async (amount: number, providerId: string, destAccount: string, holderName: string) => {
    const res = await api.withdrawFunds(amount, providerId, destAccount, holderName);
    setWallet(res.wallet);
    setTransactions(prev => [res.transaction, ...prev]);
  };

  // Update Limits Handler
  const handleUpdateLimits = async (limitsData: any) => {
    const res = await api.updateResponsibleLimits(limitsData);
    setUser(res.user);
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Filtering matches
  const liveMatches = matches.filter(m => m.status === 'live');
  const filteredMatches = matches.filter(match => {
    if (selectedSportId !== 'all' && match.sportId !== selectedSportId) return false;
    if (timingFilter === 'live' && match.status !== 'live') return false;
    if (timingFilter === 'upcoming' && match.status !== 'scheduled') return false;
    return true;
  });

  const featuredMatches = filteredMatches.filter(m => m.featured);
  const regularMatches = filteredMatches.filter(m => !m.featured);

  if (activeView === 'admin') {
    return (
      <AdminDashboard
        onBackToSportsbook={() => setActiveView('sportsbook')}
        matches={matches}
        onRefreshMatches={fetchAllData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        user={user}
        wallet={wallet}
        notifications={notifications}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenBets={() => setIsBetsOpen(true)}
        onOpenLimits={() => setIsLimitsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Sports Categories & Live Filter Bar */}
      <SportsBar
        sports={sports}
        selectedSportId={selectedSportId}
        onSelectSport={setSelectedSportId}
        activeFilter={timingFilter}
        onFilterChange={setTimingFilter}
        liveMatchCount={liveMatches.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32">
        {/* Responsible Gaming Alert if self-excluded */}
        {user.selfExclusionUntil && new Date(user.selfExclusionUntil) > new Date() && (
          <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Your account is currently under regulatory self-exclusion until{' '}
                <strong className="text-white">{new Date(user.selfExclusionUntil).toLocaleDateString()}</strong>.
                Wager placement is suspended.
              </span>
            </div>
            <button
              onClick={() => setIsLimitsOpen(true)}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg"
            >
              Settings
            </button>
          </div>
        )}

        {/* Featured / Live Hero Highlight */}
        {timingFilter !== 'upcoming' && featuredMatches.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Featured Matches
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Top League Fixtures</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  betSlipItems={betSlipItems}
                  onToggleSelection={handleToggleSelection}
                  onOpenDetails={setSelectedMatchForDetails}
                />
              ))}
            </div>
          </section>
        )}

        {/* All & Upcoming Matches Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {timingFilter === 'live'
                  ? 'Live Matches In Play'
                  : timingFilter === 'upcoming'
                  ? 'Upcoming Fixtures'
                  : 'All Sports Fixtures'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                {filteredMatches.length} Matches
              </span>
              {(providerStatus?.status === 'error' || providerStatus?.status === 'rate_limited' || providerStatus?.status === 'unconfigured' || (matches.length === 0 && !isLoadingMatches)) ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 text-rose-400 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border border-rose-500/25">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Live sports data unavailable</span>
                </div>
              ) : secondsAgo > 60 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-300 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border border-amber-500/25">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Live data delayed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Live data • {secondsAgo < 5 ? 'Just now' : `Last updated: ${secondsAgo}s ago`}</span>
                </div>
              )}
            </div>
          </div>

          {isLoadingMatches ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Loading licensed match catalog and real-time odds...
            </div>
          ) : (providerStatus?.status === 'error' || providerStatus?.status === 'rate_limited' || matches.length === 0) ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
              <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
              <div className="text-slate-200 text-base font-bold mb-1">Live sports data temporarily unavailable</div>
              <div className="text-slate-400 text-xs max-w-md mb-5">
                {providerStatus?.statusMessage || 'The live sports provider feed is currently unreachable. Real-time updates will resume once connection is restored.'}
              </div>
              <button 
                onClick={handleRetrySync}
                disabled={isRetrying}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying Connection...' : 'Retry Connection'}
              </button>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
              No matches found matching the selected sport or filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(featuredMatches.length > 0 && timingFilter !== 'upcoming'
                ? regularMatches
                : filteredMatches
              ).map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  betSlipItems={betSlipItems}
                  onToggleSelection={handleToggleSelection}
                  onOpenDetails={setSelectedMatchForDetails}
                />
              ))}
            </div>
          )}
        </section>

        {/* Regulatory Transparency & License Footer Banner */}
        <footer className="pt-8 border-t border-slate-800/80 text-xs text-slate-500 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>National Regulatory Compliance & Anti-Money Laundering Certified</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button
                onClick={() => setIsLimitsOpen(true)}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Self-Exclusion Policy
              </button>
              <span>•</span>
              <button
                onClick={() => setIsWalletOpen(true)}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Payment Providers
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveView('admin')}
                className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-semibold"
              >
                Admin Trading Desk
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Apex Sportsbook operates under strict national gaming regulations. Betting calculations, odd multipliers, and balance balances are computed and validated exclusively on secure server architecture. Zero-trust principles govern all client bet submissions. 18+ only.
          </p>
        </footer>
      </main>

      {/* Floating / Bottom Bet Slip */}
      <BetSlip
        items={betSlipItems}
        wallet={wallet}
        onRemoveItem={handleRemoveBetItem}
        onClearAll={handleClearAllBets}
        onPlaceBet={handlePlaceBet}
        onOpenWallet={() => setIsWalletOpen(true)}
        onUpdateItemOdds={handleUpdateBetItemOdds}
        onViewBet={(_bet) => {
          setBetHistoryFilter('pending');
          setIsBetsOpen(true);
        }}
      />

      {/* Match Details Modal */}
      {selectedMatchForDetails && (
        <MatchDetailsModal
          match={selectedMatchForDetails}
          betSlipItems={betSlipItems}
          onToggleSelection={handleToggleSelection}
          onClose={() => setSelectedMatchForDetails(null)}
        />
      )}

      {/* Wallet Modal (Deposits, Withdrawals, Transactions Ledger) */}
      {isWalletOpen && (
        <WalletModal
          wallet={wallet}
          transactions={transactions}
          user={user}
          onClose={() => setIsWalletOpen(false)}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />
      )}

      {/* Bet History Modal */}
      {isBetsOpen && (
        <BetHistoryModal
          bets={userBets}
          initialFilter={betHistoryFilter}
          onClose={() => setIsBetsOpen(false)}
        />
      )}

      {/* Responsible Gambling Settings Modal */}
      {isLimitsOpen && (
        <ResponsibleGamblingModal
          user={user}
          onClose={() => setIsLimitsOpen(false)}
          onUpdateLimits={handleUpdateLimits}
        />
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkRead={handleMarkNotificationRead}
        />
      )}
    </div>
  );
}
