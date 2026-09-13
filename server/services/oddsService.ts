/**
 * Server-Side Odds Service & Validation Engine
 * 
 * Responsibilities:
 * 1. Normalized odds repository & fast in-memory cache with TTL
 * 2. Track lastUpdated timestamps on every selection
 * 3. Authoritative Bet Placement Odds Validation:
 *    - Validates match status (scheduled, live vs finished, suspended, cancelled)
 *    - Validates market & selection active status
 *    - Detects odds changes between client selection time and placement time
 *    - Rejects with: "Odds have changed. Please review your bet." or "Betting is temporarily suspended for this selection."
 */

import {
  NormalizedMarket,
  NormalizedSelection,
  NormalizedMatch
} from '../providers/sportsProvider.ts';

export interface SelectionValidationResult {
  valid: boolean;
  code?: 'ODDS_CHANGED' | 'MARKET_SUSPENDED' | 'MATCH_CLOSED' | 'SELECTION_NOT_FOUND';
  error?: string;
  currentOdds?: number;
  selection?: NormalizedSelection;
  market?: NormalizedMarket;
  match?: NormalizedMatch;
}

export interface BetTicketValidationResult {
  valid: boolean;
  code?: 'ODDS_CHANGED' | 'MARKET_SUSPENDED' | 'MATCH_CLOSED' | 'INVALID_SELECTIONS';
  errorMessage?: string;
  updatedSelections?: {
    selectionId: string;
    marketId: string;
    matchId: string;
    previousOdds?: number;
    currentOdds: number;
    status: 'active' | 'suspended';
    lastUpdated: string;
  }[];
  verifiedSelections?: {
    matchId: string;
    marketId: string;
    selectionId: string;
    matchName: string;
    marketName: string;
    selectionName: string;
    oddsAtPlacement: number;
    status: 'pending';
  }[];
  totalOddsMultiplier?: number;
}

export class OddsService {
  // Key: matchId -> Array of NormalizedMarket
  private marketsCache: Map<string, NormalizedMarket[]> = new Map();
  // Key: selectionId -> NormalizedSelection
  private selectionsCache: Map<string, NormalizedSelection> = new Map();
  // Key: selectionId -> previous odds (for detecting movement)
  private oddsHistory: Map<string, { previousOdds: number; changedAt: string }> = new Map();

  /**
   * Register or update normalized markets and selections for a match
   */
  public registerMarkets(matchId: string, markets: NormalizedMarket[]): void {
    this.marketsCache.set(matchId, markets);

    const nowIso = new Date().toISOString();
    for (const market of markets) {
      for (const sel of market.selections) {
        // Track odds changes
        const existing = this.selectionsCache.get(sel.id);
        if (existing && existing.oddsValue !== sel.oddsValue) {
          this.oddsHistory.set(sel.id, {
            previousOdds: existing.oddsValue,
            changedAt: nowIso
          });
        }

        // Store selection with all required fields:
        // selection ID, market ID, match ID, current odds, status, lastUpdated
        this.selectionsCache.set(sel.id, {
          ...sel,
          matchId,
          marketId: market.id,
          lastUpdated: sel.lastUpdated || nowIso
        });
      }
    }
  }

  /**
   * Get all active markets for a match
   */
  public getMarkets(matchId: string): NormalizedMarket[] {
    return this.marketsCache.get(matchId) || [];
  }

  /**
   * Clear cached markets and selections (e.g. when wiping sample data on live sync)
   */
  public clear(): void {
    this.marketsCache.clear();
    this.selectionsCache.clear();
    this.oddsHistory.clear();
  }

  /**
   * Retrieve a specific selection with verified metadata
   */
  public getSelection(selectionId: string): NormalizedSelection | undefined {
    return this.selectionsCache.get(selectionId);
  }

  /**
   * Update individual selection odds (e.g. from trader desk or provider stream)
   */
  public updateSelectionOdds(
    selectionId: string,
    newOdds: number,
    status?: 'active' | 'suspended'
  ): NormalizedSelection | null {
    const sel = this.selectionsCache.get(selectionId);
    if (!sel) return null;

    const nowIso = new Date().toISOString();
    if (sel.oddsValue !== newOdds) {
      this.oddsHistory.set(selectionId, {
        previousOdds: sel.oddsValue,
        changedAt: nowIso
      });
      sel.oddsValue = Math.round(newOdds * 100) / 100;
    }

    if (status) {
      sel.status = status;
    }
    sel.lastUpdated = nowIso;

    // Update in parent market
    const markets = this.marketsCache.get(sel.matchId);
    if (markets) {
      for (const m of markets) {
        const found = m.selections.find(s => s.id === selectionId);
        if (found) {
          found.oddsValue = sel.oddsValue;
          found.status = sel.status;
          found.lastUpdated = sel.lastUpdated;
          break;
        }
      }
    }

    return sel;
  }

  /**
   * Validate a single selection against live odds and status
   */
  public validateSelection(
    match: NormalizedMatch,
    marketId: string,
    selectionId: string,
    clientOdds?: number
  ): SelectionValidationResult {
    // 1. Check Match Status
    if (match.status === 'finished') {
      return {
        valid: false,
        code: 'MATCH_CLOSED',
        error: `Match ${match.homeTeam} vs ${match.awayTeam} has already finished. Betting is closed.`
      };
    }
    if (match.status === 'cancelled' || match.status === 'postponed') {
      return {
        valid: false,
        code: 'MATCH_CLOSED',
        error: `Match ${match.homeTeam} vs ${match.awayTeam} has been ${match.status}. Betting is closed.`
      };
    }
    if (match.status === 'suspended') {
      return {
        valid: false,
        code: 'MARKET_SUSPENDED',
        error: 'Betting is temporarily suspended for this selection.'
      };
    }

    // 2. Check Market Status
    const market = match.markets.find(m => m.id === marketId) ||
      (this.marketsCache.get(match.id) || []).find(m => m.id === marketId);

    if (!market) {
      return {
        valid: false,
        code: 'SELECTION_NOT_FOUND',
        error: 'Betting is temporarily suspended for this selection.'
      };
    }

    if (market.status !== 'active') {
      return {
        valid: false,
        code: 'MARKET_SUSPENDED',
        error: 'Betting is temporarily suspended for this selection.'
      };
    }

    // 3. Check Selection Status
    const selection = market.selections.find(s => s.id === selectionId) ||
      this.selectionsCache.get(selectionId);

    if (!selection) {
      return {
        valid: false,
        code: 'SELECTION_NOT_FOUND',
        error: 'Selection not found in current market.'
      };
    }

    if (selection.status !== 'active') {
      return {
        valid: false,
        code: 'MARKET_SUSPENDED',
        error: 'Betting is temporarily suspended for this selection.'
      };
    }

    // 4. Validate Odds Consistency
    const currentOdds = selection.oddsValue;
    if (clientOdds !== undefined && Math.abs(currentOdds - clientOdds) > 0.001) {
      return {
        valid: false,
        code: 'ODDS_CHANGED',
        error: 'Odds have changed. Please review your bet.',
        currentOdds,
        selection,
        market,
        match
      };
    }

    return {
      valid: true,
      currentOdds,
      selection,
      market,
      match
    };
  }

  /**
   * Comprehensive Server-Side Bet Ticket Validation
   * Validates all legs of a bet ticket atomically before processing wallet debit.
   */
  public validateBetTicket(
    requestedSelections: {
      matchId: string;
      marketId: string;
      selectionId: string;
      oddsValue?: number;
    }[],
    matchesMap: Map<string, NormalizedMatch>
  ): BetTicketValidationResult {
    if (!requestedSelections || requestedSelections.length === 0) {
      return {
        valid: false,
        code: 'INVALID_SELECTIONS',
        errorMessage: 'Bet slip contains no selections.'
      };
    }

    const verifiedSelections: BetTicketValidationResult['verifiedSelections'] = [];
    const updatedSelections: BetTicketValidationResult['updatedSelections'] = [];
    let totalMultiplier = 1;
    let oddsChanged = false;
    let suspended = false;
    let firstSuspensionError = '';

    for (const req of requestedSelections) {
      const match = matchesMap.get(req.matchId);
      if (!match) {
        return {
          valid: false,
          code: 'MATCH_CLOSED',
          errorMessage: 'One or more events in your slip are no longer available.'
        };
      }

      const res = this.validateSelection(match, req.marketId, req.selectionId, req.oddsValue);

      if (!res.valid) {
        if (res.code === 'ODDS_CHANGED') {
          oddsChanged = true;
          if (res.selection) {
            updatedSelections.push({
              selectionId: res.selection.id,
              marketId: req.marketId,
              matchId: req.matchId,
              previousOdds: req.oddsValue,
              currentOdds: res.selection.oddsValue,
              status: res.selection.status,
              lastUpdated: res.selection.lastUpdated
            });
          }
        } else if (res.code === 'MARKET_SUSPENDED' || res.code === 'MATCH_CLOSED') {
          suspended = true;
          firstSuspensionError = res.error || 'Betting is temporarily suspended for this selection.';
        }
      } else if (res.selection && res.market) {
        totalMultiplier *= res.selection.oddsValue;
        verifiedSelections.push({
          matchId: match.id,
          marketId: res.market.id,
          selectionId: res.selection.id,
          matchName: `${match.homeTeam} vs ${match.awayTeam}`,
          marketName: res.market.name,
          selectionName: res.selection.name,
          oddsAtPlacement: res.selection.oddsValue,
          status: 'pending'
        });
      }
    }

    // Suspension takes precedence over odds movement
    if (suspended) {
      return {
        valid: false,
        code: 'MARKET_SUSPENDED',
        errorMessage: firstSuspensionError || 'Betting is temporarily suspended for this selection.'
      };
    }

    // Odds changed
    if (oddsChanged) {
      return {
        valid: false,
        code: 'ODDS_CHANGED',
        errorMessage: 'Odds have changed. Please review your bet.',
        updatedSelections
      };
    }

    return {
      valid: true,
      verifiedSelections,
      totalOddsMultiplier: Math.round(totalMultiplier * 100) / 100
    };
  }

  /**
   * Count total active markets and selections
   */
  public getStats(): { activeMarketsCount: number; activeSelectionsCount: number } {
    let activeMarketsCount = 0;
    for (const markets of this.marketsCache.values()) {
      for (const m of markets) {
        if (m.status === 'active') activeMarketsCount++;
      }
    }

    let activeSelectionsCount = 0;
    for (const s of this.selectionsCache.values()) {
      if (s.status === 'active') activeSelectionsCount++;
    }

    return { activeMarketsCount, activeSelectionsCount };
  }
}

// Global Singleton
export const oddsService = new OddsService();
