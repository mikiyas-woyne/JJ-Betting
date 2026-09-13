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

export const api = {
  async getSports(): Promise<Sport[]> {
    const res = await fetch('/api/sports');
    if (!res.ok) throw new Error('Failed to fetch sports');
    return res.json();
  },

  async getMatches(params?: { sportId?: string; status?: string; popular?: boolean; featured?: boolean }): Promise<Match[]> {
    const query = new URLSearchParams();
    if (params?.sportId) query.set('sportId', params.sportId);
    if (params?.status) query.set('status', params.status);
    if (params?.popular) query.set('popular', 'true');
    if (params?.featured) query.set('featured', 'true');
    
    try {
      const res = await fetch(`/api/matches?${query.toString()}`);
      if (!res.ok) {
        console.warn(`[API] Matches fetch returned HTTP ${res.status}`);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[API] Matches fetch connection interrupted:', err);
      return [];
    }
  },

  async getMatchById(id: string): Promise<Match> {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  },

  async getUserProfile(): Promise<User> {
    const res = await fetch('/api/user/me');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateResponsibleLimits(data: { dailyDepositLimit?: number; singleBetLimit?: number; selfExclusionDays?: number }): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/user/limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update responsible gambling limits');
    return json;
  },

  async getWallet(): Promise<Wallet> {
    const res = await fetch('/api/wallet');
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    const res = await fetch('/api/wallet/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async depositFunds(amount: number, providerId: string, referenceId?: string, paymentAccount?: string): Promise<{ success: boolean; wallet: Wallet; transaction: WalletTransaction }> {
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, providerId, referenceId, paymentAccount })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Deposit failed');
    return json;
  },

  async withdrawFunds(amount: number, providerId: string, destinationAccount: string, accountHolderName: string): Promise<{ success: boolean; wallet: Wallet; transaction: WalletTransaction }> {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, providerId, destinationAccount, accountHolderName })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Withdrawal failed');
    return json;
  },

  async getMyBets(): Promise<Bet[]> {
    const res = await fetch('/api/bets/my-bets');
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  // Admin APIs
  async getAdminOverview(): Promise<{
    totalHandle: number;
    totalPayout: number;
    ggr: number;
    pendingBetsCount: number;
    liveMatchesCount: number;
    totalUsers: number;
    totalTransactions: number;
    availableLiquidity: number;
  }> {
    const res = await fetch('/api/admin/overview');
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    return res.json();
  },

  async getAdminBets(): Promise<Bet[]> {
    const res = await fetch('/api/admin/bets');
    if (!res.ok) throw new Error('Failed to fetch admin bets');
    return res.json();
  },

  async getAdminTransactions(): Promise<WalletTransaction[]> {
    const res = await fetch('/api/admin/transactions');
    if (!res.ok) throw new Error('Failed to fetch admin transactions');
    return res.json();
  },

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs');
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
    const res = await fetch('/api/admin/sports-data/test-connection', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Connection test failed');
    return json;
  },

  async diagnoseOddsFetch(sportKey: string = 'soccer_epl_bp'): Promise<OddsApiDiagnosticResult> {
    const res = await fetch(`/api/admin/sports-data/diagnose-odds?sportKey=${encodeURIComponent(sportKey)}`);
    const json = await res.json();
    return json;
  },

  async getBookmakerSource(): Promise<{ selected: string; available: Array<{ key: string; title: string }> }> {
    const res = await fetch('/api/admin/sports-data/bookmaker');
    if (!res.ok) throw new Error('Failed to fetch bookmaker source');
    return res.json();
  },

  async setBookmakerSource(key: string): Promise<{ success: boolean; selected: string; available: Array<{ key: string; title: string }> }> {
    const res = await fetch('/api/admin/sports-data/bookmaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update bookmaker source');
    return json;
  },

  async getSportsApiKeyStatus(): Promise<{ isConfigured: boolean; maskedKey: string; providerName: string }> {
    const res = await fetch('/api/admin/sports-data/api-key');
    if (!res.ok) throw new Error('Failed to fetch sports API key status');
    return res.json();
  },

  async updateSportsApiKey(apiKey: string): Promise<{ success: boolean; message: string; maskedKey: string }> {
    const res = await fetch('/api/admin/sports-data/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update API key');
    return json;
  },

  async getSportsProvider(): Promise<{
    activeProvider: string;
    providerKey: string;
    isConfigured: boolean;
    supportedProviders: Array<{ key: string; name: string; description: string }>;
  }> {
    const res = await fetch('/api/admin/sports-data/provider');
    if (!res.ok) throw new Error('Failed to fetch sports provider config');
    return res.json();
  },

  async setSportsProvider(provider: string): Promise<{ success: boolean; message: string; activeProvider: string }> {
    const res = await fetch('/api/admin/sports-data/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to switch sports provider');
    return json;
  },

  // ----------------------------------------------------
  // MANUAL DEPOSIT VERIFICATION METHODS
  // ----------------------------------------------------
  async getDepositDestinations(): Promise<ManualPaymentDestination[]> {
    const res = await fetch('/api/deposits/destinations');
    if (!res.ok) throw new Error('Failed to fetch payment destinations');
    return res.json();
  },

  async submitManualDeposit(params: {
    paymentMethod: string;
    amount: number;
    screenshotUrl: string;
    note?: string;
  }): Promise<{ success: boolean; deposit: DepositRecord; message: string }> {
    const res = await fetch('/api/deposits/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Deposit submission failed');
    return json;
  },

  async getMyDeposits(): Promise<DepositRecord[]> {
    const res = await fetch('/api/deposits/my-deposits');
    if (!res.ok) throw new Error('Failed to fetch player deposits');
    return res.json();
  },

  async getAdminDeposits(status?: string, search?: string): Promise<DepositRecord[]> {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.set('status', status);
    if (search && search.trim()) query.set('search', search.trim());
    const res = await fetch(`/api/admin/deposits?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch deposits for review');
    return res.json();
  },

  async getAdminDepositSummary(): Promise<{
    pendingDeposits: number;
    approvedToday: number;
    rejectedToday: number;
    totalApprovedAmount: number;
  }> {
    const res = await fetch('/api/admin/deposits/summary');
    if (!res.ok) throw new Error('Failed to fetch deposit summary metrics');
    return res.json();
  },

  async approveDeposit(depositId: string): Promise<{
    success: boolean;
    deposit: DepositRecord;
    wallet: Wallet;
    transaction: WalletTransaction;
    message: string;
  }> {
    const res = await fetch(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Deposit approval failed');
    return json;
  },

  async rejectDeposit(depositId: string, reason?: string): Promise<{
    success: boolean;
    deposit: DepositRecord;
    message: string;
  }> {
    const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Deposit rejection failed');
    return json;
  }
};
