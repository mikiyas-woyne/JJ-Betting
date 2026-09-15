import {
  Bet,
  Match,
  Notification,
  Sport,
  User,
  Wallet,
  WalletTransaction,
  AuditLog,
  Settlement,
  SettlementRecord,
  MatchSettlementSummary,
  DepositRecord,
  ManualPaymentDestination,
  OddsApiDiagnosticResult
} from '../types';
import { espnClient } from './espnClient';
import { sortMatchesSoonerFirst } from '../utils/sortMatches';
import { INITIAL_SPORTS, INITIAL_MATCHES } from '../data/sportsData';
import {
  auth,
  saveFirestoreDeposit,
  fetchFirestoreDeposits,
  updateFirestoreDepositStatus,
  approveFirestoreDepositTransaction,
  rejectFirestoreDepositTransaction,
  fetchFirestoreWallet,
  fetchFirestoreTransactions
} from '../lib/firebase';

async function parseResponseJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) {
      throw new Error('Screenshot image size is too large. Please select a smaller image or compressed screenshot.');
    }
    if (!res.ok) {
      throw new Error(`Server request failed (HTTP ${res.status}). ${fallbackMessage}`);
    }
    throw new Error(fallbackMessage || 'Unexpected response format from server.');
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jjbetting_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async getSports(): Promise<Sport[]> {
    try {
      const res = await fetch('/api/sports');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // ignore
    }

    try {
      const matches = await espnClient.fetchRealMatches();
      if (matches && matches.length > 0) {
        return espnClient.getSportsWithCounts(matches);
      }
    } catch {
      // ignore
    }

    return INITIAL_SPORTS;
  },

  async getMatches(params?: { sportId?: string; status?: string; popular?: boolean; featured?: boolean }): Promise<Match[]> {
    const query = new URLSearchParams();
    if (params?.sportId) query.set('sportId', params.sportId);
    if (params?.status) query.set('status', params.status);
    if (params?.popular) query.set('popular', 'true');
    if (params?.featured) query.set('featured', 'true');
    
    try {
      const res = await fetch(`/api/matches?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return sortMatchesSoonerFirst(data);
        }
      }
    } catch (err) {
      console.warn('[API] Matches backend fetch failed, using client ESPN live feed:', err);
    }

    try {
      const realMatches = await espnClient.fetchRealMatches(params?.sportId);
      if (realMatches && realMatches.length > 0) {
        let filtered = realMatches;
        if (params?.status) filtered = filtered.filter(m => m.status === params.status);
        if (params?.popular) filtered = filtered.filter(m => m.popular);
        if (params?.featured) filtered = filtered.filter(m => m.featured);
        return sortMatchesSoonerFirst(filtered);
      }
    } catch (e) {
      console.warn('[API] Direct client ESPN fetch failed:', e);
    }

    return sortMatchesSoonerFirst(INITIAL_MATCHES);
  },

  async getMatchById(id: string): Promise<Match> {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  },

  async login(credentials: { email: string; password: string } | string, passwordParam?: string): Promise<{ user: User; token: string; wallet: Wallet }> {
    const payload = typeof credentials === 'string' ? { email: credentials, password: passwordParam! } : credentials;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await parseResponseJson<any>(res, 'Login failed');
    if (!res.ok) throw new Error(json.error || 'Login failed');
    if (json.token) {
      localStorage.setItem('jjbetting_token', json.token);
    }
    return json;
  },

  async signup(data: { email: string; password: string; displayName?: string; role?: string } | string, passwordParam?: string, displayNameParam?: string): Promise<{ user: User; token: string; wallet: Wallet }> {
    const payload = typeof data === 'string' ? { email: data, password: passwordParam!, displayName: displayNameParam } : data;
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await parseResponseJson<any>(res, 'Signup failed');
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    if (json.token) {
      localStorage.setItem('jjbetting_token', json.token);
    }
    return json;
  },

  async googleLogin(data: { email: string; displayName?: string; googleId?: string }): Promise<{ user: User; token: string; wallet: Wallet }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await parseResponseJson<any>(res, 'Google sign-in failed');
    if (!res.ok) throw new Error(json.error || 'Google sign-in failed');
    if (json.token) {
      localStorage.setItem('jjbetting_token', json.token);
    }
    return json;
  },

  async syncFirebaseSession(data: { uid: string; email: string; displayName?: string }): Promise<{ user: User; token: string; wallet: Wallet }> {
    try {
      const res = await fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.token) {
          localStorage.setItem('jjbetting_token', json.token);
        }
        return json;
      }
    } catch (netErr) {
      console.warn('[API] Server session sync notice (using client Firebase session):', netErr);
    }

    // Client-side fallback for static deployments (e.g. Vercel static hosting)
    const isAdmin = data.email === 'mikiyaswoyne@gmail.com' || data.email === 'admin@jjbetting.com';
    const fallbackUser: User = {
      id: data.uid,
      email: data.email,
      displayName: data.displayName || data.email.split('@')[0],
      role: isAdmin ? 'admin' : 'customer',
      kycStatus: isAdmin ? 'fully_verified' : 'tier1_verified',
      dailyDepositLimit: 50000,
      singleBetLimit: 10000,
      selfExclusionUntil: null,
      createdAt: new Date().toISOString()
    };
    const fallbackWallet: Wallet = {
      userId: data.uid,
      availableBalance: 5000,
      lockedBalance: 0,
      totalDeposited: 5000,
      totalWithdrawn: 0,
      currency: 'ETB',
      updatedAt: new Date().toISOString()
    };
    return {
      user: fallbackUser,
      token: `client_fb_${data.uid}`,
      wallet: fallbackWallet
    };
  },

  async getMe(): Promise<{ user: User; wallet: Wallet }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    const json = await parseResponseJson<any>(res, 'Failed to fetch auth session');
    if (!res.ok) throw new Error(json.error || 'Failed to fetch auth session');
    return json;
  },

  logout(): void {
    localStorage.removeItem('jjbetting_token');
  },

  async getUserProfile(): Promise<User> {
    const res = await fetch('/api/user/me', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateResponsibleLimits(data: { dailyDepositLimit?: number; singleBetLimit?: number; selfExclusionDays?: number }): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/user/limits', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update responsible gambling limits');
    return json;
  },

  async getWallet(): Promise<Wallet> {
    const userUid = auth.currentUser?.uid;
    if (userUid) {
      const fWallet = await fetchFirestoreWallet(userUid);
      if (fWallet) {
        return fWallet;
      }
    }

    try {
      const res = await fetch('/api/wallet', { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // server unreachable
    }

    return {
      userId: userUid || 'usr_licensed_01',
      availableBalance: 1000,
      currency: 'ETB',
      lockedBalance: 0,
      totalDeposited: 1000,
      totalWithdrawn: 0,
      updatedAt: new Date().toISOString()
    };
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    const userUid = auth.currentUser?.uid;
    let firestoreTxns: WalletTransaction[] = [];
    if (userUid) {
      firestoreTxns = await fetchFirestoreTransactions(userUid);
    }

    let serverTxns: WalletTransaction[] = [];
    try {
      const res = await fetch('/api/wallet/transactions', { headers: getAuthHeaders() });
      if (res.ok) {
        serverTxns = await res.json();
      }
    } catch {
      // ignore
    }

    const map = new Map<string, WalletTransaction>();
    for (const t of serverTxns) map.set(t.id, t);
    for (const t of firestoreTxns) map.set(t.id, t);

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async depositFunds(amount: number, providerId: string, referenceId?: string, paymentAccount?: string): Promise<{ success: boolean; wallet: Wallet; transaction: WalletTransaction }> {
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, providerId, referenceId, paymentAccount })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Deposit failed');
    return json;
  },

  async withdrawFunds(amount: number, providerId: string, destinationAccount: string, accountHolderName: string): Promise<{ success: boolean; wallet: Wallet; transaction: WalletTransaction }> {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, providerId, destinationAccount, accountHolderName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Withdrawal failed');
    return json;
  },

  async getMyBets(): Promise<Bet[]> {
    const res = await fetch('/api/bets/my-bets', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bets');
    return res.json();
  },

  async getOdds(matchId: string): Promise<any> {
    const res = await fetch(`/api/odds/${matchId}`);
    if (!res.ok) throw new Error('Failed to fetch odds');
    return res.json();
  },

  async validateOdds(selections: { matchId: string; marketId: string; selectionId: string; oddsValue?: number }[]): Promise<{
    valid: boolean;
    code?: string;
    error?: string;
    updatedSelections?: any[];
    verifiedSelections?: any[];
    totalOddsMultiplier?: number;
  }> {
    const res = await fetch('/api/odds/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections })
    });
    return res.json();
  },

  async placeBet(
    type: 'single' | 'multiple',
    stake: number,
    selections: { matchId: string; marketId: string; selectionId: string; oddsValue?: number }[],
    idempotencyKey?: string
  ): Promise<{ success: boolean; bet: Bet; wallet: Wallet; transaction: WalletTransaction }> {
    const key = idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await fetch('/api/bets/place', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, stake, selections, idempotencyKey: key })
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || 'Bet placement failed') as any;
      err.code = json.code;
      err.updatedSelections = json.updatedSelections;
      throw err;
    }
    return json;
  },

  async getStakeLimits(): Promise<{ minimumStake: number; maximumStake: number }> {
    const res = await fetch('/api/config/limits');
    if (!res.ok) throw new Error('Failed to fetch stake limits');
    return res.json();
  },

  async updateStakeLimits(minimumStake: number, maximumStake: number): Promise<{ success: boolean; limits: { minimumStake: number; maximumStake: number } }> {
    const res = await fetch('/api/admin/limits/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minimumStake, maximumStake })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update stake limits');
    return json;
  },

  async getNotifications(): Promise<Notification[]> {
    const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: getAuthHeaders() });
  },

  // Admin APIs
  async getAdminOverview(): Promise<{
    totalHandle: number;
    totalPayout: number;
    ggr: number;
    pendingBetsCount: number;
    liveMatchesCount: number;
    pendingDepositsCount: number;
    totalUsers: number;
    totalTransactions: number;
    availableLiquidity: number;
  }> {
    let serverData: any = {};
    try {
      const res = await fetch('/api/admin/overview', { headers: getAuthHeaders() });
      if (res.ok) {
        serverData = await res.json();
      }
    } catch {
      // ignore
    }

    let pendingDepositsCount = 0;
    try {
      const depositSummary = await this.getAdminDepositSummary();
      pendingDepositsCount = depositSummary.pendingDeposits;
    } catch {
      pendingDepositsCount = serverData.pendingDepositsCount || 0;
    }

    return {
      totalHandle: serverData.totalHandle || 0,
      totalPayout: serverData.totalPayout || 0,
      ggr: serverData.ggr || 0,
      pendingBetsCount: serverData.pendingBetsCount || 0,
      liveMatchesCount: serverData.liveMatchesCount || 0,
      pendingDepositsCount,
      totalUsers: serverData.totalUsers || 1,
      totalTransactions: serverData.totalTransactions || 0,
      availableLiquidity: serverData.availableLiquidity || 500000
    };
  },

  async getAdminBets(): Promise<Bet[]> {
    const res = await fetch('/api/admin/bets', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin bets');
    return res.json();
  },

  async getAdminTransactions(): Promise<WalletTransaction[]> {
    const res = await fetch('/api/admin/transactions', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin transactions');
    return res.json();
  },

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async updateMatchStatus(matchId: string, status: string): Promise<Match> {
    const res = await fetch('/api/admin/matches/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, status })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update match status');
    return json.match;
  },

  async updateMatchScore(matchId: string, homeScore: number, awayScore: number, minute?: number, period?: string): Promise<Match> {
    const res = await fetch('/api/admin/matches/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, homeScore, awayScore, minute, period })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update score');
    return json.match;
  },

  async updateOdds(matchId: string, marketId: string, selectionId: string, newOdds?: number, status?: 'active' | 'suspended'): Promise<void> {
    const res = await fetch('/api/admin/odds/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, marketId, selectionId, newOdds, status })
    });
    if (!res.ok) throw new Error('Failed to update odds');
  },

  async settleMarket(matchId: string, marketId: string, winningSelectionId: string): Promise<{
    success: boolean;
    settlement: Settlement;
    betsAffected: number;
    totalPayout: number;
    wallet: Wallet;
  }> {
    const res = await fetch('/api/admin/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, marketId, winningSelectionId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to settle market');
    return json;
  },

  // ----------------------------------------------------
  // BET SETTLEMENT & MATCH RESULT ENGINE
  // ----------------------------------------------------
  async getSettlementSummaries(): Promise<MatchSettlementSummary[]> {
    const res = await fetch('/api/admin/settlements/summaries');
    if (!res.ok) throw new Error('Failed to fetch settlement summaries');
    return res.json();
  },

  async getSettlementRecords(): Promise<SettlementRecord[]> {
    const res = await fetch('/api/admin/settlements/records');
    if (!res.ok) throw new Error('Failed to fetch settlement records');
    return res.json();
  },

  async getAffectedBetsForMatch(matchId: string): Promise<Bet[]> {
    const res = await fetch(`/api/admin/settlements/bets/${matchId}`);
    if (!res.ok) throw new Error('Failed to fetch affected bets for match');
    return res.json();
  },

  async manualSettleMatch(params: {
    matchId: string;
    status: 'FINISHED' | 'CANCELLED' | 'POSTPONED';
    homeScore?: number;
    awayScore?: number;
    reason: string;
    marketOutcomes?: Array<{ marketId: string; winningSelectionId?: string; voidMarket?: boolean }>;
  }): Promise<{
    success: boolean;
    summary: any;
    wallet: Wallet;
    message: string;
  }> {
    const res = await fetch('/api/admin/settlements/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Manual settlement failed');
    return json;
  },

  async retrySettlement(settlementId: string): Promise<{
    success: boolean;
    result: any;
    wallet: Wallet;
    message: string;
  }> {
    const res = await fetch('/api/admin/settlements/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settlementId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Retry settlement failed');
    return json;
  },

  async syncProviderResults(): Promise<{
    success: boolean;
    syncResult: any;
    wallet: Wallet;
    message: string;
  }> {
    const res = await fetch('/api/admin/settlements/sync-results', {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sync provider results');
    return json;
  },

  // Sports Provider Management
  async getSportsProviderStatus(): Promise<any> {
    try {
      const res = await fetch('/api/sports-data/status');
      if (res.ok) return await res.json();
      const adminRes = await fetch('/api/admin/sports-data/status');
      if (adminRes.ok) return await adminRes.json();
      return { status: 'error', statusMessage: 'Live sports data temporarily unavailable.' };
    } catch (err) {
      console.warn('[API] Sports provider status unreachable:', err);
      return { status: 'error', statusMessage: 'Live sports data temporarily unavailable.' };
    }
  },

  async syncSportsNow(): Promise<{ success: boolean; message: string; matchesCount: number }> {
    try {
      const res = await fetch('/api/sports-data/sync', { method: 'POST' });
      if (res.ok) return await res.json();
      const adminRes = await fetch('/api/admin/sports-data/sync', { method: 'POST' });
      if (adminRes.ok) return await adminRes.json();
      const json = await res.json().catch(() => ({}));
      return { success: false, message: json.error || 'Sync request failed', matchesCount: 0 };
    } catch (err: any) {
      return { success: false, message: err.message || 'Provider sync unreachable', matchesCount: 0 };
    }
  },

  async testSportsProviderConnection(): Promise<{ success: boolean; message: string; latencyMs?: number; remainingRequests?: string }> {
    const res = await fetch('/api/admin/sports-data/test-connection', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json().catch(() => ({ message: 'Connection test failed' }));
    if (!res.ok) throw new Error(json.message || 'Connection test failed');
    return json;
  },

  async diagnoseOddsFetch(sportKey: string = 'soccer_epl_bp'): Promise<OddsApiDiagnosticResult> {
    const res = await fetch(`/api/admin/sports-data/diagnose-odds?sportKey=${encodeURIComponent(sportKey)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json().catch(() => ({}));
    return json;
  },

  async getBookmakerSource(): Promise<{ selected: string; available: Array<{ key: string; title: string }> }> {
    try {
      const res = await fetch('/api/admin/sports-data/bookmaker', { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
      const pubRes = await fetch('/api/sports-data/bookmaker');
      if (pubRes.ok) {
        return await pubRes.json();
      }
    } catch {
      // ignore network errors and fallback gracefully
    }
    return {
      selected: 'default',
      available: [
        { key: 'default', title: 'Default (Pinnacle / Top European Odds)' },
        { key: 'pinnacle', title: 'Pinnacle Sports' },
        { key: 'williamhill', title: 'William Hill' },
        { key: 'betclic', title: 'Betclic' },
        { key: 'tipico', title: 'Tipico' }
      ]
    };
  },

  async setBookmakerSource(key: string): Promise<{ success: boolean; selected: string; available: Array<{ key: string; title: string }> }> {
    const res = await fetch('/api/admin/sports-data/bookmaker', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const json = await res.json().catch(() => ({ error: 'Failed to update bookmaker source' }));
    if (!res.ok) throw new Error(json.error || 'Failed to update bookmaker source');
    return json;
  },

  async getSportsApiKeyStatus(): Promise<{ isConfigured: boolean; maskedKey: string; providerName: string }> {
    try {
      const res = await fetch('/api/admin/sports-data/api-key', { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
    return { isConfigured: true, maskedKey: '●●●●●●●●●●●●', providerName: 'The Odds API' };
  },

  async updateSportsApiKey(apiKey: string): Promise<{ success: boolean; message: string; maskedKey: string }> {
    const res = await fetch('/api/admin/sports-data/api-key', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const json = await res.json().catch(() => ({ message: 'Failed to update API key' }));
    if (!res.ok) throw new Error(json.message || 'Failed to update API key');
    return json;
  },

  async getSportsProvider(): Promise<{
    activeProvider: string;
    providerKey: string;
    isConfigured: boolean;
    supportedProviders: Array<{ key: string; name: string; description: string }>;
  }> {
    try {
      const res = await fetch('/api/admin/sports-data/provider', { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
    return {
      activeProvider: 'The Odds API',
      providerKey: 'the-odds-api',
      isConfigured: true,
      supportedProviders: [
        { key: 'the-odds-api', name: 'The Odds API', description: 'Real-time European & US Odds' }
      ]
    };
  },

  async setSportsProvider(provider: string): Promise<{ success: boolean; message: string; activeProvider: string }> {
    const res = await fetch('/api/admin/sports-data/provider', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const json = await res.json().catch(() => ({ message: 'Failed to switch sports provider' }));
    if (!res.ok) throw new Error(json.message || 'Failed to switch sports provider');
    return json;
  },

  // ----------------------------------------------------
  // MANUAL DEPOSIT VERIFICATION METHODS
  // ----------------------------------------------------
  async getDepositDestinations(): Promise<ManualPaymentDestination[]> {
    try {
      const res = await fetch('/api/deposits/destinations');
      if (res.ok) {
        return await parseResponseJson<ManualPaymentDestination[]>(res, 'Failed to fetch payment destinations');
      }
    } catch {
      // fallback
    }

    return [
      {
        id: 'bank_of_abyssinia',
        name: 'Bank of Abyssinia',
        accountName: 'Mikiyas Woyne Gebresenbet',
        accountNumber: '155832444',
        instructions: 'Transfer your deposit to Bank of Abyssinia Account 155832444 (Mikiyas Woyne Gebresenbet). Take a screenshot of the confirmation receipt and upload it below.'
      },
      {
        id: 'telebirr',
        name: 'Telebirr',
        accountName: 'Mikiyas Woyne Gebresenbet',
        phoneNumber: '0938014055',
        instructions: 'Send money using Telebirr SuperApp or *127# to 0938014055 (Mikiyas Woyne Gebresenbet). Take a screenshot of the completed payment SMS or receipt and upload it below.'
      }
    ];
  },

  async submitManualDeposit(params: {
    paymentMethod: string;
    amount: number;
    screenshotUrl: string;
    note?: string;
  }): Promise<{ success: boolean; deposit: DepositRecord; message: string }> {
    const user = auth.currentUser;
    const userId = user?.uid || 'usr_licensed_01';
    const username = user?.displayName || user?.email?.split('@')[0] || 'Mikiyas W.';

    const newDeposit: DepositRecord = {
      depositId: `DEP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      username,
      paymentMethod: params.paymentMethod,
      paymentMethodName: params.paymentMethod === 'bank_of_abyssinia' ? 'Bank of Abyssinia' : 'Telebirr',
      amount: params.amount,
      currency: 'ETB',
      screenshotUrl: params.screenshotUrl,
      note: params.note || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      adminNote: null
    };

    // 1. Attempt server API submission
    let serverResult: { success: boolean; deposit: DepositRecord; message: string } | null = null;
    try {
      const res = await fetch('/api/deposits/submit', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        serverResult = await parseResponseJson<any>(res, 'Deposit submission failed');
      }
    } catch (err) {
      console.warn('[API] Server deposit submission unreachable, using client persistence:', err);
    }

    const finalDeposit = serverResult?.deposit || newDeposit;

    // 2. Persist to Firestore cloud database so admin receives real-time record across devices
    await saveFirestoreDeposit(finalDeposit);

    // 3. Save to localStorage fallback
    try {
      const stored = localStorage.getItem('apex_local_deposits');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(finalDeposit);
      localStorage.setItem('apex_local_deposits', JSON.stringify(list));
    } catch {
      // storage quota fallback
    }

    return {
      success: true,
      deposit: finalDeposit,
      message: 'Deposit request submitted successfully! Pending verification by admin.'
    };
  },

  async getMyDeposits(): Promise<DepositRecord[]> {
    let serverDeposits: DepositRecord[] = [];
    try {
      const res = await fetch('/api/deposits/my-deposits', { headers: getAuthHeaders() });
      if (res.ok) {
        serverDeposits = await parseResponseJson<DepositRecord[]>(res, 'Failed to fetch deposits');
      }
    } catch (err) {
      console.warn('[API] Failed to fetch server deposits:', err);
    }

    // Fetch from Firestore
    const userUid = auth.currentUser?.uid;
    const firestoreDeposits = await fetchFirestoreDeposits(false, userUid);

    let localDeposits: DepositRecord[] = [];
    try {
      const stored = localStorage.getItem('apex_local_deposits');
      if (stored) localDeposits = JSON.parse(stored);
    } catch {
      // ignore
    }

    const map = new Map<string, DepositRecord>();
    for (const d of localDeposits) map.set(d.depositId, d);
    for (const d of serverDeposits) map.set(d.depositId, d);
    for (const d of firestoreDeposits) map.set(d.depositId, d);

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAdminDeposits(status?: string, search?: string): Promise<DepositRecord[]> {
    let serverDeposits: DepositRecord[] = [];
    try {
      const query = new URLSearchParams();
      if (status && status !== 'all') query.set('status', status);
      if (search && search.trim()) query.set('search', search.trim());
      const res = await fetch(`/api/admin/deposits?${query.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        serverDeposits = await parseResponseJson<DepositRecord[]>(res, 'Failed to fetch deposits for review');
      }
    } catch {
      // ignore
    }

    // Fetch from Firestore
    const firestoreDeposits = await fetchFirestoreDeposits(true);

    let localDeposits: DepositRecord[] = [];
    try {
      const stored = localStorage.getItem('apex_local_deposits');
      if (stored) localDeposits = JSON.parse(stored);
    } catch {
      // ignore
    }

    const map = new Map<string, DepositRecord>();
    for (const d of localDeposits) map.set(d.depositId, d);
    for (const d of serverDeposits) map.set(d.depositId, d);
    for (const d of firestoreDeposits) map.set(d.depositId, d);

    let list = Array.from(map.values());
    if (status && status !== 'all') list = list.filter(d => d.status === status.toUpperCase());
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.depositId.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAdminDepositSummary(): Promise<{
    pendingDeposits: number;
    approvedToday: number;
    rejectedToday: number;
    totalApprovedAmount: number;
  }> {
    const allDeposits = await this.getAdminDeposits('all');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const pendingDeposits = allDeposits.filter(d => d.status === 'PENDING').length;
    const approvedToday = allDeposits.filter(d => d.status === 'APPROVED' && d.reviewedAt && new Date(d.reviewedAt).getTime() >= todayStart).length;
    const rejectedToday = allDeposits.filter(d => d.status === 'REJECTED' && d.reviewedAt && new Date(d.reviewedAt).getTime() >= todayStart).length;
    const totalApprovedAmount = allDeposits.filter(d => d.status === 'APPROVED').reduce((sum, d) => sum + d.amount, 0);

    return {
      pendingDeposits,
      approvedToday,
      rejectedToday,
      totalApprovedAmount
    };
  },

  async approveDeposit(depositId: string, adminNote?: string): Promise<{
    success: boolean;
    deposit: DepositRecord;
    wallet: Wallet;
    transaction: WalletTransaction;
    message: string;
  }> {
    const adminEmail = auth.currentUser?.email || 'admin@jjbetting.com';
    const adminId = auth.currentUser?.uid || 'usr_admin_01';

    // 1. First locate existing deposit record
    const all = await this.getAdminDeposits('all');
    const target = all.find(d => d.depositId === depositId);

    // 2. Call server route
    let serverRes: any = null;
    let serverError: string | null = null;
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit: target, adminNote })
      });
      if (res.ok) {
        serverRes = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        serverError = errData.error || `Server returned error ${res.status}`;
      }
    } catch (err: any) {
      serverError = err.message || 'Network request failed';
    }

    // 3. Atomically approve in Firestore using runTransaction
    let firestoreResult: { deposit: DepositRecord; wallet: Wallet; transaction: WalletTransaction } | null = null;
    try {
      firestoreResult = await approveFirestoreDepositTransaction(depositId, { id: adminId, email: adminEmail }, adminNote);
    } catch (fErr: any) {
      console.warn('[Firestore] approveFirestoreDepositTransaction notice:', fErr);
      if (fErr.message && fErr.message.includes('already APPROVED')) {
        throw fErr;
      }
    }

    // 4. Update localStorage cache if present
    try {
      const stored = localStorage.getItem('apex_local_deposits');
      if (stored) {
        const list: DepositRecord[] = JSON.parse(stored);
        const item = list.find(d => d.depositId === depositId);
        if (item) {
          item.status = 'APPROVED';
          item.reviewedAt = new Date().toISOString();
          item.reviewedBy = adminEmail;
          item.adminNote = adminNote || 'Approved by administrator after verification';
          localStorage.setItem('apex_local_deposits', JSON.stringify(list));
        }
      }
    } catch {
      // ignore
    }

    if (firestoreResult) {
      return {
        success: true,
        deposit: firestoreResult.deposit,
        wallet: firestoreResult.wallet,
        transaction: firestoreResult.transaction,
        message: 'Deposit verified and approved successfully. Wallet balance credited.'
      };
    }

    if (serverRes) return serverRes;

    throw new Error(serverError || 'Failed to approve deposit. Ledger verification was not completed.');
  },

  async rejectDeposit(depositId: string, reason?: string): Promise<{
    success: boolean;
    deposit: DepositRecord;
    message: string;
  }> {
    const adminEmail = auth.currentUser?.email || 'admin@jjbetting.com';
    const adminId = auth.currentUser?.uid || 'usr_admin_01';

    const all = await this.getAdminDeposits('all');
    const target = all.find(d => d.depositId === depositId);

    let serverRes: any = null;
    let serverError: string | null = null;
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, deposit: target })
      });
      if (res.ok) {
        serverRes = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        serverError = errData.error || `Server returned error ${res.status}`;
      }
    } catch (err: any) {
      serverError = err.message || 'Network request failed';
    }

    let firestoreRejected: DepositRecord | null = null;
    try {
      firestoreRejected = await rejectFirestoreDepositTransaction(
        depositId,
        { id: adminId, email: adminEmail },
        reason || 'Deposit rejected: receipt could not be verified.'
      );
    } catch (fErr) {
      console.warn('[Firestore] rejectFirestoreDepositTransaction notice:', fErr);
    }

    try {
      const stored = localStorage.getItem('apex_local_deposits');
      if (stored) {
        const list: DepositRecord[] = JSON.parse(stored);
        const item = list.find(d => d.depositId === depositId);
        if (item) {
          item.status = 'REJECTED';
          item.reviewedAt = new Date().toISOString();
          item.reviewedBy = adminEmail;
          item.adminNote = reason || null;
          item.rejectionReason = reason || null;
          localStorage.setItem('apex_local_deposits', JSON.stringify(list));
        }
      }
    } catch {
      // ignore
    }

    if (firestoreRejected) {
      return {
        success: true,
        deposit: firestoreRejected,
        message: 'Deposit has been marked as REJECTED.'
      };
    }

    if (serverRes) return serverRes;

    throw new Error(serverError || 'Failed to reject deposit. Ledger action could not be verified.');
  }
};
