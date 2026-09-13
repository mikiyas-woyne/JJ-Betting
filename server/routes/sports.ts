import { Router, Request, Response } from 'express';
import { sportsApiService } from '../services/sportsApi.ts';

const router = Router();

// GET /api/sports - List all normalized sports with match counts
router.get('/', (req: Request, res: Response) => {
  try {
    const sports = sportsApiService.getSports();
    const matches = sportsApiService.getMatches();

    const enrichedSports = sports.map(sport => {
      const matchCount = matches.filter(m => m.sportId === sport.id).length;
      return {
        ...sport,
        matchCount
      };
    });

    res.json(enrichedSports);
  } catch (err: any) {
    console.error('Error fetching sports:', err);
    res.status(500).json({ error: 'Failed to retrieve sports catalog' });
  }
});

export default router;
