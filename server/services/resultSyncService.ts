import { Match, MatchResult, Bet, WalletTransaction, Wallet, AuditLog, Notification } from '../../src/types.ts';
import { sportsApiService } from './sportsApi.ts';
import { settlementService, SettleMatchSummaryResult } from './settlementService.ts';

export interface ResultSyncStats {
  lastSyncAt: string | null;
  totalSyncedEvents: number;
  totalSettledMatches: number;
  totalSettledBets: number;
  totalPayouts: number;
  errors: string[];
  inProgress: boolean;
}

export class ResultSyncService {
  private processedEventIds = new Set<string>();
  private stats: ResultSyncStats = {
    lastSyncAt: null,
    totalSyncedEvents: 0,
    totalSettledMatches: 0,
    totalSettledBets: 0,
    totalPayouts: 0,
    errors: [],
    inProgress: false
  };

  /**
   * Run synchronization of completed match results from configured sports-data provider.
   * Strictly verifies results, normalizes them, guards against duplicates, and executes bet settlement.
   */
  public async syncFinishedMatches(context: {
    betsStoreRef: Bet[];
    transactionsStoreRef: WalletTransaction[];
    walletRef: Wallet;
    notificationsRef: Notification[];
    auditLogsRef: AuditLog[];
    matchesStoreRef?: Match[];
  }): Promise<{
    syncedCount: number;
    settledMatches: SettleMatchSummaryResult[];
    errors: string[];
  }> {
    if (this.stats.inProgress) {
      return {
        syncedCount: 0,
        settledMatches: [],
        errors: ['Result synchronization is already running in background.']
      };
    }

    this.stats.inProgress = true;
    const errors: string[] = [];
    const settledMatches: SettleMatchSummaryResult[] = [];
    let syncedCount = 0;

    try {
      // 1. Query sports provider via provider abstraction
      const provider = (sportsApiService as any).provider;
      if (!provider || typeof provider.fetchFinishedMatches !== 'function') {
        throw new Error('Active sports data provider does not support automated result synchronization.');
      }

      if (!provider.isConfigured() || (provider.isQuotaExhausted && provider.isQuotaExhausted())) {
        return {
          syncedCount: 0,
          settledMatches: [],
          errors: ['Sports data provider is unconfigured or has exhausted usage quota. Manual settlement available.']
        };
      }

      // Fetch finished football/soccer matches
      const activeSports = ['soccer_epl', 'soccer_uefa_champs_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 'soccer_germany_bundesliga'];
      const finishedEventsFromProvider: any[] = [];

      for (const sportKey of activeSports) {
        try {
          const events = await provider.fetchFinishedMatches(sportKey);
          if (Array.isArray(events)) {
            finishedEventsFromProvider.push(...events);
          }
        } catch (sportErr: any) {
          errors.push(`[${sportKey}] ${sportErr.message}`);
        }
      }

      // 2. Iterate through certified finished events from provider
      for (const event of finishedEventsFromProvider) {
        if (!event.providerEventId && !event.id) continue;
        const providerEventId = event.providerEventId || event.id;

        // Prevent duplicate processing
        if (this.processedEventIds.has(providerEventId)) {
          continue;
        }

        // Verify result validity - strictly never create fake results
        if (!event.result || typeof event.result.homeScore !== 'number' || typeof event.result.awayScore !== 'number') {
          continue;
        }

        // Match event against our catalog
        const catalogMatches = sportsApiService.getAllMatches();
        const targetMatch = catalogMatches.find(
          m =>
            m.id === event.id ||
            m.providerEventId === providerEventId ||
            (m.homeTeam.toLowerCase() === event.homeTeam.toLowerCase() &&
              m.awayTeam.toLowerCase() === event.awayTeam.toLowerCase())
        );

        if (!targetMatch) {
          continue;
        }

        // Mark event as processed
        this.processedEventIds.add(providerEventId);
        targetMatch.providerEventId = providerEventId;
        syncedCount++;

        const certifiedResult: MatchResult = {
          homeScore: event.result.homeScore,
          awayScore: event.result.awayScore,
          winner: event.result.winner || (event.result.homeScore > event.result.awayScore ? 'home' : event.result.awayScore > event.result.homeScore ? 'away' : 'draw'),
          finishedAt: event.result.finishedAt || new Date().toISOString(),
          resultSource: 'the-odds-api',
          resultVerified: true
        };

        // 3. Trigger bet settlement engine
        try {
          const summary = await settlementService.settleMatchResult({
            matchId: targetMatch.id,
            status: 'FINISHED',
            result: certifiedResult,
            processedBy: 'auto:sports-provider',
            reason: `Automated provider result synchronization from ${event.result.resultSource || 'The Odds API'}`,
            auditLogsRef: context.auditLogsRef,
            betsStoreRef: context.betsStoreRef,
            transactionsStoreRef: context.transactionsStoreRef,
            walletRef: context.walletRef,
            notificationsRef: context.notificationsRef,
            matchesStoreRef: context.matchesStoreRef
          });

          settledMatches.push(summary);
          this.stats.totalSettledMatches++;
          this.stats.totalSettledBets += summary.settledBetsCount;
          this.stats.totalPayouts += summary.totalPayout;
        } catch (settleErr: any) {
          errors.push(`Failed to settle match ${targetMatch.id}: ${settleErr.message}`);
        }
      }

      this.stats.totalSyncedEvents += syncedCount;
      this.stats.lastSyncAt = new Date().toISOString();
      this.stats.errors = errors;

      return {
        syncedCount,
        settledMatches,
        errors
      };
    } catch (err: any) {
      errors.push(`Result sync service failed: ${err.message}`);
      return {
        syncedCount,
        settledMatches,
        errors
      };
    } finally {
      this.stats.inProgress = false;
    }
  }

  public getStats(): ResultSyncStats {
    return { ...this.stats };
  }
}

export const resultSyncService = new ResultSyncService();
