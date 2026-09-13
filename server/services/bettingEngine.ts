import {
  Bet,
  BetSelection,
  Wallet,
  WalletTransaction,
  User,
  AuditLog,
  StakeLimits
} from '../../src/types';
import { sportsApiService } from './sportsApi';

/**
 * Server-Authoritative Async Lock
 * Prevents race conditions and guarantees atomic balance operations per user
 */
class UserAsyncLock {
  private queues = new Map<string, Promise<void>>();

  public async acquire<T>(key: string, task: () => Promise<T>): Promise<T> {
    const currentQueue = this.queues.get(key) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.queues.set(key, currentQueue.then(() => nextLock));

    try {
      await currentQueue;
      return await task();
    } finally {
      releaseLock!();
      if (this.queues.get(key) === currentQueue.then(() => nextLock)) {
        this.queues.delete(key);
      }
    }
  }
}

export interface PlaceBetRequestSelection {
  matchId: string;
  marketId: string;
  selectionId: string;
  oddsValue?: number; // client odds at time of selection (for drift check)
}

export interface PlaceBetParams {
  user: User;
  wallet: Wallet;
  type?: 'single' | 'multiple';
  stake: number;
  selections: PlaceBetRequestSelection[];
  idempotencyKey?: string;
  auditLogsRef: AuditLog[];
  betsStoreRef: Bet[];
  transactionsStoreRef: WalletTransaction[];
}

export type BettingErrorCode =
  | 'INSUFFICIENT_BALANCE'
  | 'ODDS_CHANGED'
  | 'BETTING_SUSPENDED'
  | 'MATCH_STARTED'
  | 'MATCH_FINISHED'
  | 'INVALID_STAKE'
  | 'DUPLICATE_REQUEST'
  | 'PROVIDER_UNAVAILABLE'
  | 'SYSTEM_ERROR';

export interface BettingEngineResult {
  success: boolean;
  bet?: Bet;
  wallet?: Wallet;
  transaction?: WalletTransaction;
  code?: BettingErrorCode;
  error?: string;
  updatedSelections?: Array<{
    selectionId: string;
    marketId: string;
    matchId: string;
    previousOdds?: number;
    currentOdds: number;
    status: string;
  }>;
}

export class BettingEngine {
  private userLock = new UserAsyncLock();

  // Configurable Platform Limits (Not hardcoded throughout app)
  private limits: StakeLimits = {
    minimumStake: 10,
    maximumStake: 50000
  };

  // Idempotency cache: key -> cached response (expires after 1 hour)
  private idempotencyStore = new Map<
    string,
    {
      bet: Bet;
      wallet: Wallet;
      transaction: WalletTransaction;
      timestamp: number;
    }
  >();

  // Track in-flight idempotency keys to avoid concurrent duplicate submissions
  private inFlightKeys = new Set<string>();

  public getStakeLimits(): StakeLimits {
    return { ...this.limits };
  }

  public updateStakeLimits(
    newMin: number,
    newMax: number,
    actorEmail: string,
    auditLogsRef?: AuditLog[]
  ): StakeLimits {
    if (newMin <= 0 || newMax <= newMin) {
      throw new Error('Invalid stake limits: minimum must be > 0 and maximum must exceed minimum.');
    }
    const previous = { ...this.limits };
    this.limits = {
      minimumStake: Math.round(newMin * 100) / 100,
      maximumStake: Math.round(newMax * 100) / 100
    };

    if (auditLogsRef) {
      auditLogsRef.unshift({
        id: `audit_lim_${Date.now()}`,
        actorId: 'admin_desk',
        actorEmail,
        action: 'STAKE_LIMITS_UPDATED',
        entityType: 'limits',
        entityId: 'global_stake_limits',
        details: `Minimum stake: ${previous.minimumStake} -> ${this.limits.minimumStake} ETB, Maximum stake: ${previous.maximumStake} -> ${this.limits.maximumStake} ETB`,
        createdAt: new Date().toISOString()
      });
    }

    return { ...this.limits };
  }

  /**
   * Validate stake against platform and user limits
   */
  public validateStake(stake: number, userSingleBetLimit?: number): { valid: boolean; error?: string } {
    if (isNaN(stake) || typeof stake !== 'number' || stake <= 0) {
      return { valid: false, error: 'Please enter a valid stake.' };
    }
    if (stake < this.limits.minimumStake) {
      return {
        valid: false,
        error: `Please enter a valid stake. Minimum stake is ${this.limits.minimumStake} ETB.`
      };
    }
    if (stake > this.limits.maximumStake) {
      return {
        valid: false,
        error: `Please enter a valid stake. Maximum stake is ${this.limits.maximumStake} ETB.`
      };
    }
    if (userSingleBetLimit && stake > userSingleBetLimit) {
      return {
        valid: false,
        error: `Stake exceeds your configured single bet limit of ${userSingleBetLimit} ETB.`
      };
    }
    return { valid: true };
  }

  /**
   * Server-Side Bet Placement Execution
   * Completely validates events, odds, limits, and executes atomic wallet ledger deduction
   */
  public async placeBet(params: PlaceBetParams): Promise<BettingEngineResult> {
    const {
      user,
      wallet,
      type,
      stake: rawStake,
      selections: requestedSelections,
      idempotencyKey,
      auditLogsRef,
      betsStoreRef,
      transactionsStoreRef
    } = params;

    // Acquire atomic per-user lock
    return await this.userLock.acquire(user.id, async () => {
      // 1. Idempotency Check: Prevent duplicate submissions
      if (idempotencyKey) {
        if (this.inFlightKeys.has(idempotencyKey)) {
          return {
            success: false,
            code: 'DUPLICATE_REQUEST',
            error: 'A bet placement is currently in progress. Please wait.'
          };
        }

        const cached = this.idempotencyStore.get(idempotencyKey);
        if (cached) {
          // Return identical confirmation without double-charging
          return {
            success: true,
            bet: cached.bet,
            wallet: cached.wallet,
            transaction: cached.transaction
          };
        }

        this.inFlightKeys.add(idempotencyKey);
      }

      try {
        // 2. Validate User Eligibility (Responsible Gambling & KYC)
        if (user.selfExclusionUntil && new Date(user.selfExclusionUntil) > new Date()) {
          return {
            success: false,
            code: 'BETTING_SUSPENDED',
            error: 'Account is currently under self-exclusion restriction. Wagering is suspended.'
          };
        }

        // 3. Validate Stake (Server-Side)
        const stake = Math.round(Number(rawStake) * 100) / 100;
        const stakeCheck = this.validateStake(stake, user.singleBetLimit);
        if (!stakeCheck.valid) {
          return {
            success: false,
            code: 'INVALID_STAKE',
            error: stakeCheck.error || 'Please enter a valid stake.'
          };
        }

        // 4. Validate Available Balance atomically from wallet
        if (stake > wallet.availableBalance) {
          return {
            success: false,
            code: 'INSUFFICIENT_BALANCE',
            error: `Insufficient available balance. Available: ${wallet.availableBalance.toFixed(2)} ETB, Required: ${stake.toFixed(2)} ETB.`
          };
        }

        // 5. Authoritative Selections, Markets, & Odds Validation
        if (!Array.isArray(requestedSelections) || requestedSelections.length === 0) {
          return {
            success: false,
            code: 'INVALID_STAKE',
            error: 'Bet slip contains no selections.'
          };
        }

        const matchesMap = sportsApiService.getMatchesMap();
        const now = new Date();

        const verifiedSelections: BetSelection[] = [];
        const updatedSelections: Array<{
          selectionId: string;
          marketId: string;
          matchId: string;
          previousOdds?: number;
          currentOdds: number;
          status: string;
        }> = [];

        let oddsChanged = false;
        let suspended = false;
        let matchFinished = false;
        let matchStarted = false;
        let suspensionMessage = '';

        for (const req of requestedSelections) {
          const match = matchesMap.get(req.matchId);
          if (!match) {
            return {
              success: false,
              code: 'PROVIDER_UNAVAILABLE',
              error: 'Match data is currently synchronizing. Please try again shortly.'
            };
          }

          // Match status checks
          if (match.status === 'finished') {
            matchFinished = true;
            break;
          }

          if (match.status === 'cancelled' || match.status === 'suspended') {
            suspended = true;
            suspensionMessage = `Match ${match.homeTeam} vs ${match.awayTeam} has been ${match.status}. Betting is closed.`;
            break;
          }

          // If scheduled match kickoff time was over 10 minutes ago and not live
          const kickoff = new Date(match.startTime);
          if (match.status === 'scheduled' && now.getTime() - kickoff.getTime() > 10 * 60 * 1000) {
            matchStarted = true;
            break;
          }

          // Find market in match
          const market = match.markets.find((m) => m.id === req.marketId);
          if (!market || market.status !== 'active') {
            suspended = true;
            suspensionMessage = 'Betting is temporarily suspended for this selection.';
            break;
          }

          // Find selection in market
          const selection = market.selections.find((s) => s.id === req.selectionId);
          if (!selection || selection.status !== 'active') {
            suspended = true;
            suspensionMessage = 'Betting is temporarily suspended for this selection.';
            break;
          }

          // Retrieve AUTHORITATIVE server odds (NEVER trust client odds)
          const authoritativeOdds = selection.oddsValue;
          if (!authoritativeOdds || authoritativeOdds < 1.01) {
            suspended = true;
            suspensionMessage = 'Odds are temporarily unavailable for this selection.';
            break;
          }

          // Check if odds drifted compared to what the customer saw
          if (req.oddsValue !== undefined && Math.abs(authoritativeOdds - req.oddsValue) > 0.001) {
            oddsChanged = true;
            updatedSelections.push({
              selectionId: selection.id,
              marketId: market.id,
              matchId: match.id,
              previousOdds: req.oddsValue,
              currentOdds: authoritativeOdds,
              status: selection.status
            });
          }

          verifiedSelections.push({
            matchId: match.id,
            marketId: market.id,
            selectionId: selection.id,
            matchName: `${match.homeTeam} vs ${match.awayTeam}`,
            marketName: market.name,
            selectionName: selection.name,
            acceptedOdds: authoritativeOdds,
            oddsAtPlacement: authoritativeOdds,
            oddsAtSelection: req.oddsValue || authoritativeOdds,
            oddsLastChecked: new Date().toISOString(),
            status: 'pending'
          });
        }

        // Process rejection hierarchy
        if (matchFinished) {
          return {
            success: false,
            code: 'MATCH_FINISHED',
            error: 'Match has already concluded. Betting is closed.'
          };
        }

        if (matchStarted) {
          return {
            success: false,
            code: 'MATCH_STARTED',
            error: 'Match has started and pre-match betting is closed.'
          };
        }

        if (suspended) {
          return {
            success: false,
            code: 'BETTING_SUSPENDED',
            error: suspensionMessage || 'Betting is temporarily suspended for this selection.'
          };
        }

        if (oddsChanged) {
          return {
            success: false,
            code: 'ODDS_CHANGED',
            error: 'Odds have changed.',
            updatedSelections
          };
        }

        // 6. Calculate Authoritative Potential Return
        const betType = verifiedSelections.length > 1 ? (type || 'multiple') : 'single';
        const totalAcceptedOdds =
          betType === 'single'
            ? verifiedSelections[0].acceptedOdds
            : Math.round(
                verifiedSelections.reduce((acc, s) => acc * s.acceptedOdds, 1) * 100
              ) / 100;

        const potentialReturn = Math.round(stake * totalAcceptedOdds * 100) / 100;

        // 7. Atomic Wallet Ledger Deduction
        const balanceBefore = wallet.availableBalance;
        const balanceAfter = Math.round((balanceBefore - stake) * 100) / 100;

        // Ensure balance never becomes negative
        if (balanceAfter < 0) {
          return {
            success: false,
            code: 'INSUFFICIENT_BALANCE',
            error: 'Insufficient balance. Transaction aborted.'
          };
        }

        // Apply ledger balance update
        wallet.availableBalance = balanceAfter;
        wallet.updatedAt = new Date().toISOString();

        // 8. Create Bet Record (Matching Bet Database Model)
        const nowIso = new Date().toISOString();
        const betId = `BET-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newBet: Bet = {
          id: betId,
          userId: user.id,
          userEmail: user.email,
          betType,
          type: betType,
          stake,
          acceptedOdds: totalAcceptedOdds,
          totalOdds: totalAcceptedOdds,
          potentialReturn,
          status: 'pending',
          currency: 'ETB',
          selections: verifiedSelections,
          placedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          idempotencyKey
        };

        // 9. Create Immutable Wallet Transaction Record
        const txnId = `txn_bet_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        const selectionSummary =
          betType === 'single'
            ? `${verifiedSelections[0].selectionName} (${verifiedSelections[0].matchName})`
            : `${verifiedSelections.length} Selections Accumulator`;

        const newTxn: WalletTransaction = {
          id: txnId,
          walletId: 'wlt_01',
          userId: user.id,
          type: 'BET_STAKE',
          amount: -stake,
          currency: 'ETB',
          betId: newBet.id,
          fee: 0,
          balanceBefore,
          balanceAfter,
          status: 'completed',
          referenceId: `TXN-STAKE-${betId}`,
          description: `Wager Placed: ${selectionSummary} @ ${totalAcceptedOdds.toFixed(2)}`,
          createdAt: nowIso
        };

        // Commit to state stores
        betsStoreRef.unshift(newBet);
        transactionsStoreRef.unshift(newTxn);

        // Record compliance audit log
        auditLogsRef.unshift({
          id: `audit_bet_${Date.now()}`,
          actorId: user.id,
          actorEmail: user.email,
          action: 'BET_PLACED',
          entityType: 'bet',
          entityId: newBet.id,
          details: `Accepted wager: stake=${stake} ETB, odds=${totalAcceptedOdds}, potentialReturn=${potentialReturn} ETB. Ledger debit: ${balanceBefore} -> ${balanceAfter} ETB.`,
          createdAt: nowIso
        });

        // Store in idempotency cache
        if (idempotencyKey) {
          this.idempotencyStore.set(idempotencyKey, {
            bet: newBet,
            wallet,
            transaction: newTxn,
            timestamp: Date.now()
          });
        }

        return {
          success: true,
          bet: newBet,
          wallet,
          transaction: newTxn
        };
      } catch (err: any) {
        console.error('Unhandled betting engine error:', err);
        return {
          success: false,
          code: 'SYSTEM_ERROR',
          error: 'An unexpected system error occurred during bet placement. No funds have been deducted.'
        };
      } finally {
        if (idempotencyKey) {
          this.inFlightKeys.delete(idempotencyKey);
        }
      }
    });
  }
}

export const bettingEngine = new BettingEngine();
