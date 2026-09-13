import { Router, Request, Response } from 'express';
import { sportsApiService } from '../services/sportsApi.ts';

const router = Router();

// GET /api/matches - Retrieve matches with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { sportId, status, popular, featured } = req.query;
    let matches = sportsApiService.getMatches();

    if (sportId && typeof sportId === 'string' && sportId !== 'all') {
      matches = matches.filter(m => m.sportId === sportId);
    }
    if (status && typeof status === 'string') {
      matches = matches.filter(m => m.status === status);
    }
    if (popular === 'true') {
      matches = matches.filter(m => m.popular);
    }
    if (featured === 'true') {
      matches = matches.filter(m => m.featured);
    }

    res.json(matches);
  } catch (err: any) {
    console.error('Error in /api/matches:', err);
    res.status(500).json({ error: 'Failed to retrieve match listings' });
  }
});

// GET /api/matches/live - Retrieve live in-play matches
router.get('/live', (req: Request, res: Response) => {
  try {
    const matches = sportsApiService.getMatches().filter(m => m.status === 'live');
    res.json(matches);
  } catch (err: any) {
    console.error('Error in /api/matches/live:', err);
    res.status(500).json({ error: 'Failed to retrieve live matches' });
  }
});

// GET /api/matches/:id - Retrieve match by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const match = sportsApiService.getMatch(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (err: any) {
    console.error('Error fetching match by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve match details' });
  }
});

export default router;
