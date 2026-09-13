import { Router, Request, Response } from 'express';
import { oddsService } from '../services/oddsService.ts';
import { sportsApiService } from '../services/sportsApi.ts';

const router = Router();

// GET /api/odds/:matchId - Get all current normalized markets and odds for a match
router.get('/:matchId', (req: Request, res: Response) => {
  try {
    const markets = oddsService.getMarkets(req.params.matchId);
    if (!markets || markets.length === 0) {
      // Fallback: check match object directly
      const match = sportsApiService.getMatch(req.params.matchId);
      if (match && match.markets) {
        return res.json(match.markets);
      }
      return res.status(404).json({ error: 'Markets not found for match' });
    }
    res.json(markets);
  } catch (err: any) {
    console.error('Error fetching odds:', err);
    res.status(500).json({ error: 'Failed to retrieve match odds' });
  }
});

// GET /api/odds/selection/:selectionId - Get individual selection status and odds
router.get('/selection/:selectionId', (req: Request, res: Response) => {
  try {
    const selection = oddsService.getSelection(req.params.selectionId);
    if (!selection) {
      return res.status(404).json({ error: 'Selection not found' });
    }
    res.json(selection);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve selection' });
  }
});

// POST /api/odds/validate - Authoritative validation of selections before bet submission
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ valid: false, error: 'No selections provided for validation' });
    }

    const matchesMap = sportsApiService.getMatchesMap();
    const result = oddsService.validateBetTicket(selections, matchesMap);

    if (!result.valid) {
      return res.status(200).json({
        valid: false,
        code: result.code,
        error: result.errorMessage,
        updatedSelections: result.updatedSelections
      });
    }

    res.json({
      valid: true,
      verifiedSelections: result.verifiedSelections,
      totalOddsMultiplier: result.totalOddsMultiplier
    });
  } catch (err: any) {
    console.error('Odds validation error:', err);
    res.status(500).json({ valid: false, error: 'Server error during odds validation' });
  }
});

export default router;
