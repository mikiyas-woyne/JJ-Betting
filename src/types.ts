export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'cancelled'
  | 'postponed'
  | 'suspended'
  | 'UPCOMING'
  | 'LIVE'
  | 'FINISHED'
  | 'CANCELLED'
  | 'POSTPONED';

export type BetStatus =
  | 'pending'
  | 'won'
  | 'lost'
  | 'void'
  | 'cancelled'
  | 'PENDING'
  | 'WON'
  | 'LOST'
  | 'VOID'
  | 'CANCELLED';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_placement'
  | 'BET_STAKE'
  | 'bet_payout'
  | 'BET_WIN'
  | 'bet_refund'
  | 'BET_REFUND'
  | 'adjustment';

export type UserRole = 'customer' | 'admin' | 'odds_trader' | 'compliance_officer';
export type KycStatus = 'unverified' | 'tier1_verified' | 'fully_verified';

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw' | null;
  finishedAt: string;
  resultSource: string;
  resultVerified: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  kycStatus: KycStatus;
  dailyDepositLimit: number;
  singleBetLimit: number;
  selfExclusionUntil?: string | null;
  createdAt: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  priority: number;
  matchCount?: number;
}

export interface League {
  id: string;
  sportId: string;
  name: string;
  country: string;
  flag?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  country?: string;
}

export interface Selection {
  id: string;
  marketId: string;
  name: string; // e.g. "Arsenal", "Draw", "Liverpool", "Over 2.5", "Yes"
  oddsValue: number;
  status: 'active' | 'suspended';
}

export interface Market {
  id: string;
  matchId: string;
  type: 'match_winner' | 'over_under_2_5' | 'both_teams_to_score' | 'double_chance' | 'draw_no_bet';
  name: string; // e.g. "Match Winner", "Over / Under 2.5 Goals", "Both Teams to Score"
  status: 'active' | 'suspended' | 'settled';
  selections: Selection[];
}

export interface MatchScore {
  home: number;
  away: number;
  period?: string; // e.g., '1st Half', '2nd Half', 'Q3', 'Set 2'
  minute?: number;
}

export interface Match {
  id: string;
  sportId: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamShort?: string;
  awayTeamShort?: string;
  homeLogo?: string;
  awayLogo?: string;
  providerName?: string;
  startTime: string; // ISO string
  status: MatchStatus;
  score?: MatchScore;
  result?: MatchResult;
  providerEventId?: string;
  featured?: boolean;
  popular?: boolean;
  markets: Market[];
}

export interface BetSlipItem {
  matchId: string;
  marketId: string;
  selectionId: string;
  matchTitle: string;
  marketName: string;
  selectionName: string;
  oddsValue: number;
}

export interface BetSelection {
  matchId: string;
  marketId: string;
  selectionId: string;
  matchName: string;
  marketName: string;
  selectionName: string;
  acceptedOdds: number;
  oddsAtPlacement: number;
  oddsAtSelection?: number;
  oddsLastChecked?: string;
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled' | 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED';
  settledAt?: string;
  settlementNote?: string;
}

export interface Bet {
  id: string;
  userId: string;
  userEmail?: string;
  betType: 'single' | 'multiple';
  type: 'single' | 'multiple';
  stake: number;
  acceptedOdds: number;
  totalOdds: number;
  potentialReturn: number;
  effectiveOdds?: number;
  currency: string;
  status: BetStatus;
  selections: BetSelection[];
  placedAt: string;
  createdAt: string;
  updatedAt?: string;
  settledAt?: string | null;
  payoutAmount?: number | null;
  settlementId?: string | null;
  idempotencyKey?: string;
}

export interface StakeLimits {
  minimumStake: number;
  maximumStake: number;
}

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DepositRecord {
  depositId: string;
  userId: string;
  username: string;
  paymentMethod: string;
  paymentMethodName?: string;
  paymentReference?: string;
  amount: number;
  currency: string;
  screenshotUrl: string;
  note?: string;
  status: DepositStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  adminNote?: string | null;
  rejectionReason?: string | null;
}

export interface ManualPaymentDestination {
  id: string;
  name: string;
  accountName: string;
  accountNumber?: string;
  phoneNumber?: string;
  instructions: string;
}

export interface Wallet {
  userId: string;
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  customerId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  betId?: string;
  depositId?: string;
  settlementId?: string;
  fee?: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  referenceId: string;
  description: string;
  paymentMethod?: string;
  approvedBy?: string;
  adminId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type SettlementStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface SettlementRecord {
  settlementId: string;
  betId: string;
  userId: string;
  matchId?: string;
  result: 'WON' | 'LOST' | 'VOID' | 'CANCELLED';
  stake: number;
  payout: number;
  settledAt: string;
  processedBy: string;
  source: string;
  status: SettlementStatus;
  reason?: string;
  errorMessage?: string;
}

export interface MatchSettlementSummary {
  matchId: string;
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  startTime: string;
  status: MatchStatus;
  result?: MatchResult;
  affectedBetsCount: number;
  settledBetsCount: number;
  pendingBetsCount: number;
  failedBetsCount: number;
  totalStakes: number;
  totalPayouts: number;
  settlementStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'NO_BETS';
  settlements: SettlementRecord[];
}

export interface Settlement {
  id: string;
  matchId: string;
  marketId: string;
  winningSelectionId: string;
  settledBy: string;
  settledAt: string;
  betsAffected: number;
  totalPayout: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  type: 'deposit_bonus' | 'free_bet' | 'odds_boost';
  value: number;
  minDeposit: number;
  validUntil: string;
  active: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bet_outcome' | 'deposit' | 'withdrawal' | 'promo' | 'security' | 'responsible_gambling';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: 'bet' | 'wallet' | 'match' | 'odds' | 'settlement' | 'user' | 'limits' | 'sports_provider' | 'deposit';
  entityId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ResponsibleGamblingSettings {
  dailyDepositLimit: number;
  singleBetLimit: number;
  timeOutDays: number;
  isSelfExcluded: boolean;
  selfExclusionUntil?: string | null;
}

export interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  supportedCurrencies: string[];
  status: 'active' | 'sandbox' | 'awaiting_credentials';
  depositFeePercent: number;
  withdrawalFeePercent: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
}

export interface SportsProviderStatus {
  providerName: string;
  providerBaseUrl: string;
  isConfigured: boolean;
  status: 'connected' | 'rate_limited' | 'error' | 'unconfigured' | 'mock_fallback';
  statusMessage: string;
  lastSuccessfulSync: string | null;
  lastFailedSync: string | null;
  lastError: string | null;
  matchesSynced: number;
  upcomingMatchesCount: number;
  liveMatchesCount: number;
  activeMarketsCount: number;
  activeSelectionsCount: number;
  activeSportsCount: number;
  activeSportsList: string[];
  activeFootballCompetitions: string[];
  selectedBookmaker: string;
  availableBookmakers: Array<{ key: string; title: string }>;
  syncInProgress: boolean;
}

export interface OddsApiDiagnosticResult {
  timestamp: string;
  provider: string;
  endpoint: string;
  targetUrl: string;
  sanitizedUrl: string;
  httpStatus: number | null;
  statusText: string | null;
  headers: Record<string, string>;
  responseBody: string | null;
  errorBody: string | null;
  parsedError: any | null;
  isError: boolean;
  success: boolean;
  durationMs: number;
  apiKeyConfigured: boolean;
  maskedApiKey: string;
  requestsRemaining?: string | null;
  requestsUsed?: string | null;
  requestsLast?: string | null;
  quotaInfo?: {
    isExhausted: boolean;
    remaining: string | null;
    used: string | null;
    lastCost: string | null;
    errorCode: string | null;
    message: string | null;
  };
}
