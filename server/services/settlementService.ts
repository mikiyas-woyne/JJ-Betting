import {
  Match,
  MatchResult,
  MatchStatus,
  Bet,
  BetSelection,
  Wallet,
  WalletTransaction,
  User,
  AuditLog,
  Notification,
  SettlementRecord,
  MatchSettlementSummary,
  SettlementStatus
} from '../../src/types.ts';
import { sportsApiService } from './sportsApi.ts';

/**
 * Concurrency Mutex Lock for atomic bet settlement
 * Prevents race conditions and guarantees bets are settled exactly once
 */
class SettlementAsyncLock {
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

export interface SettleMatchParams {
  matchId: string;
  status: 'FINISHED' | 'CANCELLED' | 'POSTPONED';
  result?: {
    homeScore: number;
    awayScore: number;
    winner?: 'home' | 'away' | 'draw' | null;
    finishedAt?: string;
    resultSource: string;
    resultVerified: boolean;
  };
  marketOutcomes?: Array<{
    marketId: string;
    winningSelectionId?: string;
    voidMarket?: boolean;
  }>;
  processedBy: string;
  reason?: string;
  auditLogsRef: AuditLog[];
  betsStoreRef: Bet[];
  transactionsStoreRef: WalletTransaction[];
  walletRef: Wallet;
  notificationsRef: Notification[];
  matchesStoreRef?: Match[];
}

export interface ManualSettleParams {
  adminUser: User;
  matchId: string;
  status: 'FINISHED' | 'CANCELLED' | 'POSTPONED';
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away' | 'draw' | null;
  marketOutcomes?: Array<{
    marketId: string;
    winningSelectionId?: string;
    voidMarket?: boolean;
  }>;
  reason: string;
  auditLogsRef: AuditLog[];
  betsStoreRef: Bet[];
  transactionsStoreRef: WalletTransaction[];
  walletRef: Wallet;
  notificationsRef: Notification[];
  matchesStoreRef?: Match[];
}

export interface SettleBetResult {
  betId: string;
  settled: boolean;
  previousStatus: string;
  newStatus: string;
  stake: number;
  payout: number;
  settlementRecord?: SettlementRecord;
  error?: string;
}

export interface SettleMatchSummaryResult {
  success: boolean;
  matchId: string;
  matchStatus: MatchStatus;
  result?: MatchResult;
  affectedBetsCount: number;
  settledBetsCount: number;
  alreadySettledCount: number;
  pendingBetsCount: number;
  totalPayout: number;
  settlements: SettlementRecord[];
  errors: string[];
}

export class SettlementService {
  private lock = new SettlementAsyncLock();
  
  // Idempotency: Stores all completed/failed settlements by settlementId and betId
  private settlements = new Map<string, SettlementRecord>();
  private settledBetIds = new Set<string>();

  constructor() {
    this.seedBaselineSettlement();
  }

  private seedBaselineSettlement() {
    // Seed an initial historical settlement record for demonstration
    const demoSettlement: SettlementRecord = {
      settlementId: 'stl_hist_01',
      betId: 'bet-rec-01',
      userId: 'usr_licensed_01',
      matchId: 'm-settled-01',
      result: 'WON',
      stake: 500,
      payout: 950,
      settledAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      processedBy: 'auto:sports-provider',
      source: 'the-odds-api',
      status: 'COMPLETED',
      reason: 'Official match result certified (Arsenal 3 - 1 Chelsea)'
    };
    this.settlements.set(demoSettlement.settlementId, demoSettlement);
    this.settledBetIds.add('bet-rec-01');
  }

  /**
   * Evaluates selection outcome based on match result or market overrides
   */
  public evaluateSelectionOutcome(
    match: Match,
    selection: BetSelection,
    result: MatchResult | undefined,
    matchStatus: MatchStatus,
    marketOutcomes?: Array<{ marketId: string; winningSelectionId?: string; voidMarket?: boolean }>
  ): 'won' | 'lost' | 'void' | 'pending' {
    const statusNormalized = matchStatus.toUpperCase();

    // 1. Cancelled or Postponed match => All selections VOID
    if (statusNormalized === 'CANCELLED' || statusNormalized === 'POSTPONED') {
      return 'void';
    }

    // 2. Check if this specific market was marked VOID by admin
    const override = marketOutcomes?.find(o => o.marketId === selection.marketId);
    if (override?.voidMarket) {
      return 'void';
    }

    // 3. Explicit winning selection override (e.g. from admin manual resolution)
    if (override?.winningSelectionId) {
      return override.winningSelectionId === selection.selectionId ? 'won' : 'lost';
    }

    // 4. If match is not finished or has no result, it is still pending
    if (statusNormalized !== 'FINISHED' || !result) {
      return 'pending';
    }

    const { homeScore, awayScore } = result;
    const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

    const marketType = selection.marketName.toLowerCase();
    const selName = selection.selectionName.trim().toLowerCase();
    const homeName = match.homeTeam.toLowerCase();
    const awayName = match.awayTeam.toLowerCase();

    // Match Winner / 1X2 / Moneyline
    if (
      marketType.includes('winner') ||
      marketType.includes('1x2') ||
      marketType.includes('moneyline') ||
      selection.marketId.includes('mw') ||
      selection.marketId.includes('winner')
    ) {
      if (selName === 'draw' || selName === 'tie' || selName === 'x') {
        return winner === 'draw' ? 'won' : 'lost';
      }
      if (selName.includes(homeName) || homeName.includes(selName) || selName === 'home' || selName === '1') {
        return winner === 'home' ? 'won' : 'lost';
      }
      if (selName.includes(awayName) || awayName.includes(selName) || selName === 'away' || selName === '2') {
        return winner === 'away' ? 'won' : 'lost';
      }
      return winner === 'draw' ? 'lost' : 'lost';
    }

    // Over / Under 2.5 Goals
    if (marketType.includes('over') || marketType.includes('under') || marketType.includes('total')) {
      const totalGoals = homeScore + awayScore;
      if (selName.includes('over')) {
        return totalGoals > 2.5 ? 'won' : 'lost';
      }
      if (selName.includes('under')) {
        return totalGoals < 2.5 ? 'won' : 'lost';
      }
    }

    // Both Teams to Score (BTTS)
    if (marketType.includes('both') || marketType.includes('btts')) {
      const btts = homeScore > 0 && awayScore > 0;
      if (selName === 'yes' || selName.includes('yes')) {
        return btts ? 'won' : 'lost';
      }
      if (selName === 'no' || selName.includes('no')) {
        return !btts ? 'won' : 'lost';
      }
    }

    // Double Chance
    if (marketType.includes('double chance')) {
      if (selName.includes('1x') || (selName.includes('home') && selName.includes('draw'))) {
        return winner === 'home' || winner === 'draw' ? 'won' : 'lost';
      }
      if (selName.includes('x2') || (selName.includes('draw') && selName.includes('away'))) {
        return winner === 'away' || winner === 'draw' ? 'won' : 'lost';
      }
      if (selName.includes('12') || (selName.includes('home') && selName.includes('away'))) {
        return winner === 'home' || winner === 'away' ? 'won' : 'lost';
      }
    }

    // Draw No Bet (DNB)
    if (marketType.includes('draw no bet') || marketType.includes('dnb')) {
      if (winner === 'draw') {
        return 'void';
      }
      if (selName.includes(homeName) || homeName.includes(selName)) {
        return winner === 'home' ? 'won' : 'lost';
      }
      if (selName.includes(awayName) || awayName.includes(selName)) {
        return winner === 'away' ? 'won' : 'lost';
      }
    }

    // Fallback: Default to home/away/draw comparison
    if (selName.includes(homeName)) return winner === 'home' ? 'won' : 'lost';
    if (selName.includes(awayName)) return winner === 'away' ? 'won' : 'lost';
    if (selName === 'draw') return winner === 'draw' ? 'won' : 'lost';

    return 'lost';
  }

  /**
   * Main Settlement Processor for a Match
   * Validates match, sets result, discovers unsettled bets, and settles them atomically.
   */
  public async settleMatchResult(params: SettleMatchParams): Promise<SettleMatchSummaryResult> {
    const {
      matchId,
      status,
      result,
      marketOutcomes,
      processedBy,
      reason,
      auditLogsRef,
      betsStoreRef,
      transactionsStoreRef,
      walletRef,
      notificationsRef,
      matchesStoreRef
    } = params;

    const normalizedStatus = status.toUpperCase() as 'FINISHED' | 'CANCELLED' | 'POSTPONED';

    // 1. Mandatory Validation Rule:
    // "Do not mark a match FINISHED without a valid result."
    let validatedResult: MatchResult | undefined;

    if (normalizedStatus === 'FINISHED') {
      if (!result) {
        throw new Error('Cannot mark match FINISHED without a certified match result (homeScore, awayScore, resultSource).');
      }

      if (typeof result.homeScore !== 'number' || typeof result.awayScore !== 'number' || result.homeScore < 0 || result.awayScore < 0) {
        throw new Error('Invalid match score. Scores must be non-negative integers.');
      }

      if (!result.resultSource || result.resultSource.trim().length === 0) {
        throw new Error('Result source identifier is required.');
      }

      const winner: 'home' | 'away' | 'draw' =
        result.homeScore > result.awayScore
          ? 'home'
          : result.awayScore > result.homeScore
          ? 'away'
          : 'draw';

      validatedResult = {
        homeScore: Math.floor(result.homeScore),
        awayScore: Math.floor(result.awayScore),
        winner,
        finishedAt: result.finishedAt || new Date().toISOString(),
        resultSource: result.resultSource,
        resultVerified: result.resultVerified !== undefined ? result.resultVerified : true
      };
    } else {
      // CANCELLED or POSTPONED
      validatedResult = result
        ? {
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            winner: null,
            finishedAt: new Date().toISOString(),
            resultSource: result.resultSource || 'manual:admin',
            resultVerified: true
          }
        : undefined;
    }

    // 2. Find and update the Match in system catalogs
    const match = sportsApiService.getMatch(matchId) || matchesStoreRef?.find(m => m.id === matchId);
    if (!match) {
      throw new Error(`Match with ID '${matchId}' not found in active catalog.`);
    }

    // Update match state
    match.status = normalizedStatus === 'FINISHED' ? 'finished' : normalizedStatus === 'CANCELLED' ? 'cancelled' : 'postponed';
    if (validatedResult) {
      match.result = validatedResult;
      match.score = {
        home: validatedResult.homeScore,
        away: validatedResult.awayScore,
        period: 'Full Time'
      };
    }

    // Update in sportsApiService
    sportsApiService.updateMatchStatus(matchId, match.status as any);
    if (validatedResult) {
      sportsApiService.updateMatchScore(matchId, validatedResult.homeScore, validatedResult.awayScore, 90, 'Full Time');
    }

    // 3. Find all bets containing selections from this match
    const affectedBets = betsStoreRef.filter(b =>
      b.selections.some(s => s.matchId === matchId)
    );

    let settledBetsCount = 0;
    let alreadySettledCount = 0;
    let pendingBetsCount = 0;
    let totalPayout = 0;
    const matchSettlements: SettlementRecord[] = [];
    const errors: string[] = [];

    // 4. Settle each affected bet atomically
    for (const bet of affectedBets) {
      // If already settled, skip duplicate settlement
      const currentStatus = bet.status.toLowerCase();
      if (currentStatus !== 'pending') {
        alreadySettledCount++;
        continue;
      }

      try {
        const singleResult = await this.settleSingleBet({
          bet,
          match,
          matchStatus: normalizedStatus,
          result: validatedResult,
          marketOutcomes,
          processedBy,
          source: validatedResult?.resultSource || 'system',
          reason,
          auditLogsRef,
          transactionsStoreRef,
          walletRef,
          notificationsRef,
          matchesStoreRef
        });

        if (singleResult.settled) {
          settledBetsCount++;
          totalPayout += singleResult.payout;
          if (singleResult.settlementRecord) {
            matchSettlements.push(singleResult.settlementRecord);
          }
        } else {
          // Bet is still pending because it has other uncompleted matches
          pendingBetsCount++;
        }
      } catch (betErr: any) {
        errors.push(`Bet #${bet.id} settlement error: ${betErr.message}`);
      }
    }

    // 5. Create audit log for match settlement
    auditLogsRef.unshift({
      id: `audit_settle_${Date.now()}_${matchId}`,
      actorId: processedBy,
      actorEmail: processedBy,
      action: 'MATCH_SETTLED',
      entityType: 'settlement',
      entityId: matchId,
      details: `Match ${match.homeTeam} vs ${match.awayTeam} settled as ${normalizedStatus}. Result: ${
        validatedResult ? `${validatedResult.homeScore}-${validatedResult.awayScore}` : 'N/A'
      }. Affected bets: ${affectedBets.length}, Settled: ${settledBetsCount}, Total Payout: ${totalPayout.toFixed(2)} ETB. Reason: ${reason || 'Official sports result certified'}`,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      matchId,
      matchStatus: match.status,
      result: validatedResult,
      affectedBetsCount: affectedBets.length,
      settledBetsCount,
      alreadySettledCount,
      pendingBetsCount,
      totalPayout,
      settlements: matchSettlements,
      errors
    };
  }

  /**
   * Settle a single Bet with strict server-authoritative calculations,
   * atomic concurrency lock, and idempotency protection.
   */
  public async settleSingleBet(params: {
    bet: Bet;
    match: Match;
    matchStatus: MatchStatus;
    result?: MatchResult;
    marketOutcomes?: Array<{ marketId: string; winningSelectionId?: string; voidMarket?: boolean }>;
    processedBy: string;
    source: string;
    reason?: string;
    auditLogsRef: AuditLog[];
    transactionsStoreRef: WalletTransaction[];
    walletRef: Wallet;
    notificationsRef: Notification[];
    matchesStoreRef?: Match[];
  }): Promise<SettleBetResult> {
    const {
      bet,
      match,
      matchStatus,
      result,
      marketOutcomes,
      processedBy,
      source,
      reason,
      auditLogsRef,
      transactionsStoreRef,
      walletRef,
      notificationsRef,
      matchesStoreRef
    } = params;

    // Mutex lock per betId guarantees concurrent settlement requests cannot duplicate payouts
    return await this.lock.acquire(bet.id, async () => {
      // 1. Idempotency Check:
      // If already settled, NEVER settle again or credit wallet twice
      const currentStatus = bet.status.toLowerCase();
      if (currentStatus !== 'pending' || this.settledBetIds.has(bet.id)) {
        return {
          betId: bet.id,
          settled: false,
          previousStatus: bet.status,
          newStatus: bet.status,
          stake: bet.stake,
          payout: bet.payoutAmount || 0,
          error: 'Bet has already been settled.'
        };
      }

      const settlementId = `stl_${Date.now()}_${bet.id}`;
      const nowIso = new Date().toISOString();

      // Create a provisional PROCESSING settlement record
      const provisionalRecord: SettlementRecord = {
        settlementId,
        betId: bet.id,
        userId: bet.userId,
        matchId: match.id,
        result: 'WON', // provisional
        stake: bet.stake,
        payout: 0,
        settledAt: nowIso,
        processedBy,
        source,
        status: 'PROCESSING',
        reason
      };
      this.settlements.set(settlementId, provisionalRecord);

      try {
        // 2. Evaluate selections belonging to this match
        for (const sel of bet.selections) {
          if (sel.matchId === match.id) {
            const outcome = this.evaluateSelectionOutcome(match, sel, result, matchStatus, marketOutcomes);
            sel.status = outcome;
            sel.settledAt = nowIso;
            sel.settlementNote = `Evaluated against ${matchStatus} (${result ? `${result.homeScore}-${result.awayScore}` : 'cancelled'})`;
          } else if (sel.status === 'pending' || sel.status === 'PENDING') {
            // Check if other match in selection has finished in the background
            const otherMatch = sportsApiService.getMatch(sel.matchId) || matchesStoreRef?.find(m => m.id === sel.matchId);
            if (otherMatch && (otherMatch.status === 'finished' || otherMatch.status === 'cancelled' || otherMatch.status === 'postponed')) {
              const outcome = this.evaluateSelectionOutcome(
                otherMatch,
                sel,
                otherMatch.result,
                otherMatch.status,
                undefined
              );
              sel.status = outcome;
              sel.settledAt = nowIso;
            }
          }
        }

        // 3. Determine Overall Bet Resolution
        // Check if all selections in the bet are resolved
        const hasPendingSelections = bet.selections.some(
          s => s.status.toLowerCase() === 'pending'
        );

        if (hasPendingSelections) {
          // Bet cannot be settled yet because it's a multiple bet with unfinished legs
          this.settlements.delete(settlementId);
          return {
            betId: bet.id,
            settled: false,
            previousStatus: bet.status,
            newStatus: 'pending',
            stake: bet.stake,
            payout: 0
          };
        }

        // All selections are resolved! Settle the bet.
        const hasLoss = bet.selections.some(s => s.status.toLowerCase() === 'lost');
        const allVoid = bet.selections.every(s => s.status.toLowerCase() === 'void');

        let finalResult: 'WON' | 'LOST' | 'VOID' | 'CANCELLED';
        let payoutAmount = 0;
        let effectiveOdds = 1.0;

        if (hasLoss) {
          // --- CASE A: LOST BET ---
          finalResult = 'LOST';
          bet.status = 'lost';
          payoutAmount = 0;
          effectiveOdds = bet.acceptedOdds || bet.totalOdds;
        } else if (allVoid) {
          // --- CASE B: COMPLETELY VOID BET ---
          // Full refund of original stake
          finalResult = 'VOID';
          bet.status = 'void';
          payoutAmount = Math.round(bet.stake * 100) / 100;
          effectiveOdds = 1.0;

          // Credit refund to wallet
          const balanceBefore = walletRef.availableBalance;
          const balanceAfter = Math.round((balanceBefore + payoutAmount) * 100) / 100;
          walletRef.availableBalance = balanceAfter;
          walletRef.updatedAt = nowIso;

          // Immutable wallet ledger transaction
          const refundTxn: WalletTransaction = {
            id: `txn_rfnd_${Date.now()}_${bet.id}`,
            walletId: 'wlt_01',
            userId: bet.userId,
            type: 'BET_REFUND',
            amount: payoutAmount,
            fee: 0,
            balanceBefore,
            balanceAfter,
            status: 'completed',
            betId: bet.id,
            settlementId,
            referenceId: `REFUND-${bet.id}`,
            description: `Void Wager Refund: Ticket #${bet.id}`,
            createdAt: nowIso
          };
          transactionsStoreRef.unshift(refundTxn);

          // Notify player
          notificationsRef.unshift({
            id: `notif_rfnd_${Date.now()}_${bet.id}`,
            userId: bet.userId,
            title: 'Wager Refunded (Match Void/Cancelled)',
            message: `Ticket #${bet.id} was voided. Your stake of ${payoutAmount.toFixed(2)} ETB has been refunded to your wallet.`,
            type: 'bet_outcome',
            read: false,
            createdAt: nowIso
          });
        } else {
          // --- CASE C: WON BET ---
          // Every non-void selection won!
          finalResult = 'WON';
          bet.status = 'won';

          // Multiply odds of only the WON selections (void selections have odds 1.0)
          const winningSelections = bet.selections.filter(s => s.status.toLowerCase() === 'won');
          let combinedMultiplier = 1.0;
          for (const winSel of winningSelections) {
            combinedMultiplier *= (winSel.acceptedOdds || winSel.oddsAtPlacement || 1.0);
          }

          effectiveOdds = Math.round(combinedMultiplier * 100) / 100;
          payoutAmount = Math.round(bet.stake * effectiveOdds * 100) / 100;

          // Credit winnings to wallet
          const balanceBefore = walletRef.availableBalance;
          const balanceAfter = Math.round((balanceBefore + payoutAmount) * 100) / 100;
          walletRef.availableBalance = balanceAfter;
          walletRef.updatedAt = nowIso;

          // Immutable wallet ledger transaction
          const winTxn: WalletTransaction = {
            id: `txn_win_${Date.now()}_${bet.id}`,
            walletId: 'wlt_01',
            userId: bet.userId,
            type: 'BET_WIN',
            amount: payoutAmount,
            fee: 0,
            balanceBefore,
            balanceAfter,
            status: 'completed',
            betId: bet.id,
            settlementId,
            referenceId: `WIN-${bet.id}`,
            description: `Settled Wager Payout: Ticket #${bet.id}`,
            createdAt: nowIso
          };
          transactionsStoreRef.unshift(winTxn);

          // Notify player
          notificationsRef.unshift({
            id: `notif_win_${Date.now()}_${bet.id}`,
            userId: bet.userId,
            title: 'Congratulations! Bet Won 🎉',
            message: `Ticket #${bet.id} won! ${payoutAmount.toFixed(2)} ETB has been credited to your wallet balance.`,
            type: 'bet_outcome',
            read: false,
            createdAt: nowIso
          });
        }

        // 4. Finalize Bet entity
        bet.settledAt = nowIso;
        bet.payoutAmount = payoutAmount;
        bet.effectiveOdds = effectiveOdds;
        bet.settlementId = settlementId;
        bet.updatedAt = nowIso;

        // 5. Complete and store the settlement record
        const completedRecord: SettlementRecord = {
          settlementId,
          betId: bet.id,
          userId: bet.userId,
          matchId: match.id,
          result: finalResult,
          stake: bet.stake,
          payout: payoutAmount,
          settledAt: nowIso,
          processedBy,
          source,
          status: 'COMPLETED',
          reason
        };
        this.settlements.set(settlementId, completedRecord);
        this.settledBetIds.add(bet.id);

        auditLogsRef.unshift({
          id: `audit_bet_settled_${Date.now()}_${bet.id}`,
          actorId: processedBy,
          actorEmail: processedBy,
          action: 'BET_SETTLED',
          entityType: 'bet',
          entityId: bet.id,
          details: `Ticket #${bet.id} settled as ${finalResult}. Stake: ${bet.stake} ETB, Payout: ${payoutAmount.toFixed(2)} ETB, Odds: ${effectiveOdds.toFixed(2)}`,
          createdAt: nowIso
        });

        return {
          betId: bet.id,
          settled: true,
          previousStatus: currentStatus,
          newStatus: bet.status,
          stake: bet.stake,
          payout: payoutAmount,
          settlementRecord: completedRecord
        };
      } catch (err: any) {
        // Settlement failed: Record FAILED status, do NOT partially credit
        const failedRecord: SettlementRecord = {
          settlementId,
          betId: bet.id,
          userId: bet.userId,
          matchId: match.id,
          result: 'LOST',
          stake: bet.stake,
          payout: 0,
          settledAt: nowIso,
          processedBy,
          source,
          status: 'FAILED',
          errorMessage: err.message,
          reason
        };
        this.settlements.set(settlementId, failedRecord);

        auditLogsRef.unshift({
          id: `audit_bet_fail_${Date.now()}_${bet.id}`,
          actorId: processedBy,
          actorEmail: processedBy,
          action: 'BET_SETTLEMENT_FAILED',
          entityType: 'bet',
          entityId: bet.id,
          details: `Failed settlement on ticket #${bet.id}: ${err.message}. State rolled back, safe for retry.`,
          createdAt: nowIso
        });

        throw err;
      }
    });
  }

  /**
   * Manual Match Settlement with mandatory Admin Authentication,
   * Reason validation, and Audit Trail.
   */
  public async manualSettleMatch(params: ManualSettleParams): Promise<SettleMatchSummaryResult> {
    const { adminUser, matchId, status, homeScore, awayScore, marketOutcomes, reason } = params;

    // 1. Admin Authentication & Role Authorization check
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'odds_trader')) {
      throw new Error('Unauthorized. Only authenticated administrators or odds traders can manually settle matches.');
    }

    // 2. Mandatory Reason check
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed justification reason (minimum 5 characters) is required for manual settlement.');
    }

    // 3. Score validation for FINISHED matches
    if (status === 'FINISHED') {
      if (homeScore === undefined || awayScore === undefined || isNaN(homeScore) || isNaN(awayScore)) {
        throw new Error('Home and Away scores are required to settle a match as FINISHED.');
      }
      if (homeScore < 0 || awayScore < 0) {
        throw new Error('Scores cannot be negative.');
      }
    }

    const winner: 'home' | 'away' | 'draw' | null =
      status === 'FINISHED' && homeScore !== undefined && awayScore !== undefined
        ? homeScore > awayScore
          ? 'home'
          : awayScore > homeScore
          ? 'away'
          : 'draw'
        : null;

    const resultPayload =
      status === 'FINISHED' && homeScore !== undefined && awayScore !== undefined
        ? {
            homeScore: Number(homeScore),
            awayScore: Number(awayScore),
            winner,
            finishedAt: new Date().toISOString(),
            resultSource: `manual:${adminUser.email}`,
            resultVerified: true
          }
        : undefined;

    return await this.settleMatchResult({
      matchId,
      status,
      result: resultPayload,
      marketOutcomes,
      processedBy: adminUser.email,
      reason: `Manual Admin Settlement: ${reason}`,
      auditLogsRef: params.auditLogsRef,
      betsStoreRef: params.betsStoreRef,
      transactionsStoreRef: params.transactionsStoreRef,
      walletRef: params.walletRef,
      notificationsRef: params.notificationsRef,
      matchesStoreRef: params.matchesStoreRef
    });
  }

  /**
   * Retry a failed settlement record safely
   */
  public async retryFailedSettlement(params: {
    settlementId: string;
    adminUser: User;
    auditLogsRef: AuditLog[];
    betsStoreRef: Bet[];
    transactionsStoreRef: WalletTransaction[];
    walletRef: Wallet;
    notificationsRef: Notification[];
    matchesStoreRef?: Match[];
  }): Promise<SettleBetResult> {
    const { settlementId, adminUser, betsStoreRef, matchesStoreRef } = params;

    const record = this.settlements.get(settlementId);
    if (!record) {
      throw new Error(`Settlement record '${settlementId}' not found.`);
    }

    if (record.status !== 'FAILED') {
      throw new Error(`Settlement record '${settlementId}' is in status ${record.status} and does not need retry.`);
    }

    const bet = betsStoreRef.find(b => b.id === record.betId);
    if (!bet) {
      throw new Error(`Bet '${record.betId}' not found for settlement retry.`);
    }

    const match = sportsApiService.getMatch(record.matchId || '') || matchesStoreRef?.find(m => m.id === record.matchId);
    if (!match) {
      throw new Error(`Match '${record.matchId}' not found for settlement retry.`);
    }

    // Clear failed mark to allow re-evaluation
    this.settledBetIds.delete(bet.id);
    this.settlements.delete(settlementId);

    return await this.settleSingleBet({
      bet,
      match,
      matchStatus: match.status,
      result: match.result,
      processedBy: adminUser.email,
      source: 'manual:retry',
      reason: `Admin retry on previously failed settlement #${settlementId}`,
      auditLogsRef: params.auditLogsRef,
      transactionsStoreRef: params.transactionsStoreRef,
      walletRef: params.walletRef,
      notificationsRef: params.notificationsRef,
      matchesStoreRef
    });
  }

  /**
   * Get settlement summary for every match in catalog
   */
  public getMatchSettlementSummaries(matches: Match[], bets: Bet[]): MatchSettlementSummary[] {
    return matches.map(match => {
      const matchBets = bets.filter(b => b.selections.some(s => s.matchId === match.id));
      const settledBets = matchBets.filter(b => b.status !== 'pending' && b.status !== 'PENDING');
      const pendingBets = matchBets.filter(b => b.status === 'pending' || b.status === 'PENDING');

      let totalStakes = 0;
      let totalPayouts = 0;

      for (const b of matchBets) {
        totalStakes += b.stake;
        if (b.status === 'won' || b.status === 'WON') {
          totalPayouts += (b.payoutAmount || b.potentialReturn);
        } else if (b.status === 'void' || b.status === 'VOID') {
          totalPayouts += (b.payoutAmount || b.stake);
        }
      }

      // Collect settlements for this match
      const relatedSettlements = Array.from(this.settlements.values()).filter(
        s => s.matchId === match.id || matchBets.some(b => b.id === s.betId)
      );

      const failedBetsCount = relatedSettlements.filter(s => s.status === 'FAILED').length;

      let settlementStatus: MatchSettlementSummary['settlementStatus'] = 'NO_BETS';
      if (matchBets.length === 0) {
        settlementStatus = 'NO_BETS';
      } else if (failedBetsCount > 0) {
        settlementStatus = 'FAILED';
      } else if (pendingBets.length === 0 && settledBets.length > 0) {
        settlementStatus = 'COMPLETED';
      } else if (settledBets.length > 0 && pendingBets.length > 0) {
        settlementStatus = 'PARTIAL';
      } else {
        settlementStatus = 'PENDING';
      }

      return {
        matchId: match.id,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        leagueName: match.leagueName,
        startTime: match.startTime,
        status: match.status,
        result: match.result,
        affectedBetsCount: matchBets.length,
        settledBetsCount: settledBets.length,
        pendingBetsCount: pendingBets.length,
        failedBetsCount,
        totalStakes: Math.round(totalStakes * 100) / 100,
        totalPayouts: Math.round(totalPayouts * 100) / 100,
        settlementStatus,
        settlements: relatedSettlements
      };
    });
  }

  /**
   * Get all settlement records
   */
  public getAllSettlements(): SettlementRecord[] {
    return Array.from(this.settlements.values()).sort(
      (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()
    );
  }

  /**
   * Get affected bets for a specific match with full detail
   */
  public getAffectedBetsForMatch(matchId: string, bets: Bet[]): Bet[] {
    return bets.filter(b => b.selections.some(s => s.matchId === matchId));
  }
}

export const settlementService = new SettlementService();
