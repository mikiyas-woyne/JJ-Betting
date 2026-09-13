import { Sport, Match } from '../types';

export const INITIAL_SPORTS: Sport[] = [
  { id: 'football', name: 'Football', slug: 'football', icon: '⚽', priority: 1, matchCount: 8 },
  { id: 'basketball', name: 'Basketball', slug: 'basketball', icon: '🏀', priority: 2, matchCount: 4 },
  { id: 'americanfootball', name: 'American Football', slug: 'americanfootball', icon: '🏈', priority: 3, matchCount: 5 },
  { id: 'baseball', name: 'Baseball', slug: 'baseball', icon: '⚾', priority: 4, matchCount: 5 },
  { id: 'icehockey', name: 'Ice Hockey', slug: 'icehockey', icon: '🏒', priority: 5, matchCount: 4 },
  { id: 'tennis', name: 'Tennis', slug: 'tennis', icon: '🎾', priority: 6, matchCount: 3 },
  { id: 'boxing', name: 'Boxing & MMA', slug: 'boxing', icon: '🥊', priority: 7, matchCount: 2 },
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-pl-01',
    sportId: 'football',
    leagueId: 'epl',
    leagueName: 'English Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    homeTeamShort: 'ARS',
    awayTeamShort: 'LIV',
    startTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    featured: true,
    popular: true,
    markets: [
      {
        id: 'm-pl-01-mw',
        matchId: 'm-pl-01',
        type: 'match_winner',
        name: 'Match Winner (1X2)',
        status: 'active',
        selections: [
          { id: 'sel-1', marketId: 'm-pl-01-mw', name: 'Arsenal', oddsValue: 1.85, status: 'active' },
          { id: 'sel-x', marketId: 'm-pl-01-mw', name: 'Draw', oddsValue: 3.40, status: 'active' },
          { id: 'sel-2', marketId: 'm-pl-01-mw', name: 'Liverpool', oddsValue: 4.20, status: 'active' },
        ]
      },
      {
        id: 'm-pl-01-ou',
        matchId: 'm-pl-01',
        type: 'over_under_2_5',
        name: 'Over / Under 2.5 Goals',
        status: 'active',
        selections: [
          { id: 'sel-ou-o', marketId: 'm-pl-01-ou', name: 'Over 2.5', oddsValue: 1.68, status: 'active' },
          { id: 'sel-ou-u', marketId: 'm-pl-01-ou', name: 'Under 2.5', oddsValue: 2.15, status: 'active' },
        ]
      },
      {
        id: 'm-pl-01-btts',
        matchId: 'm-pl-01',
        type: 'both_teams_to_score',
        name: 'Both Teams to Score',
        status: 'active',
        selections: [
          { id: 'sel-btts-y', marketId: 'm-pl-01-btts', name: 'Yes', oddsValue: 1.62, status: 'active' },
          { id: 'sel-btts-n', marketId: 'm-pl-01-btts', name: 'No', oddsValue: 2.20, status: 'active' },
        ]
      },
      {
        id: 'm-pl-01-dc',
        matchId: 'm-pl-01',
        type: 'double_chance',
        name: 'Double Chance',
        status: 'active',
        selections: [
          { id: 'sel-dc-1x', marketId: 'm-pl-01-dc', name: 'Arsenal or Draw (1X)', oddsValue: 1.22, status: 'active' },
          { id: 'sel-dc-12', marketId: 'm-pl-01-dc', name: 'Arsenal or Liverpool (12)', oddsValue: 1.30, status: 'active' },
          { id: 'sel-dc-x2', marketId: 'm-pl-01-dc', name: 'Draw or Liverpool (X2)', oddsValue: 1.95, status: 'active' },
        ]
      }
    ]
  },
  {
    id: 'm-pl-02',
    sportId: 'football',
    leagueId: 'epl',
    leagueName: 'English Premier League',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeTeamShort: 'RMA',
    awayTeamShort: 'FCB',
    startTime: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    status: 'live',
    score: { home: 2, away: 1, period: '2nd Half', minute: 67 },
    featured: true,
    popular: true,
    markets: [
      {
        id: 'm-pl-02-mw',
        matchId: 'm-pl-02',
        type: 'match_winner',
        name: 'Match Winner (1X2)',
        status: 'active',
        selections: [
          { id: 'sel-rma-1', marketId: 'm-pl-02-mw', name: 'Real Madrid', oddsValue: 1.45, status: 'active' },
          { id: 'sel-rma-x', marketId: 'm-pl-02-mw', name: 'Draw', oddsValue: 4.80, status: 'active' },
          { id: 'sel-rma-2', marketId: 'm-pl-02-mw', name: 'Barcelona', oddsValue: 7.20, status: 'active' },
        ]
      },
      {
        id: 'm-pl-02-ou',
        matchId: 'm-pl-02',
        type: 'over_under_2_5',
        name: 'Total Goals Over/Under 3.5',
        status: 'active',
        selections: [
          { id: 'sel-rma-ou-o', marketId: 'm-pl-02-ou', name: 'Over 3.5', oddsValue: 1.95, status: 'active' },
          { id: 'sel-rma-ou-u', marketId: 'm-pl-02-ou', name: 'Under 3.5', oddsValue: 1.80, status: 'active' },
        ]
      },
      {
        id: 'm-pl-02-btts',
        matchId: 'm-pl-02',
        type: 'both_teams_to_score',
        name: 'Both Teams to Score',
        status: 'settled',
        selections: [
          { id: 'sel-rma-btts-y', marketId: 'm-pl-02-btts', name: 'Yes (Won)', oddsValue: 1.55, status: 'active' },
          { id: 'sel-rma-btts-n', marketId: 'm-pl-02-btts', name: 'No', oddsValue: 2.30, status: 'suspended' },
        ]
      }
    ]
  },
  {
    id: 'm-pl-03',
    sportId: 'football',
    leagueId: 'ucl',
    leagueName: 'UEFA Champions League',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Paris Saint-Germain',
    homeTeamShort: 'BAY',
    awayTeamShort: 'PSG',
    startTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    featured: true,
    popular: true,
    markets: [
      {
        id: 'm-pl-03-mw',
        matchId: 'm-pl-03',
        type: 'match_winner',
        name: 'Match Winner (1X2)',
        status: 'active',
        selections: [
          { id: 'sel-bay-1', marketId: 'm-pl-03-mw', name: 'Bayern Munich', oddsValue: 2.10, status: 'active' },
          { id: 'sel-bay-x', marketId: 'm-pl-03-mw', name: 'Draw', oddsValue: 3.60, status: 'active' },
          { id: 'sel-bay-2', marketId: 'm-pl-03-mw', name: 'PSG', oddsValue: 3.20, status: 'active' },
        ]
      },
      {
        id: 'm-pl-03-ou',
        matchId: 'm-pl-03',
        type: 'over_under_2_5',
        name: 'Over / Under 2.5 Goals',
        status: 'active',
        selections: [
          { id: 'sel-bay-ou-o', marketId: 'm-pl-03-ou', name: 'Over 2.5', oddsValue: 1.50, status: 'active' },
          { id: 'sel-bay-ou-u', marketId: 'm-pl-03-ou', name: 'Under 2.5', oddsValue: 2.50, status: 'active' },
        ]
      },
      {
        id: 'm-pl-03-btts',
        matchId: 'm-pl-03',
        type: 'both_teams_to_score',
        name: 'Both Teams to Score',
        status: 'active',
        selections: [
          { id: 'sel-bay-btts-y', marketId: 'm-pl-03-btts', name: 'Yes', oddsValue: 1.48, status: 'active' },
          { id: 'sel-bay-btts-n', marketId: 'm-pl-03-btts', name: 'No', oddsValue: 2.55, status: 'active' },
        ]
      }
    ]
  },
  {
    id: 'm-pl-04',
    sportId: 'football',
    leagueId: 'epl',
    leagueName: 'English Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Chelsea',
    homeTeamShort: 'MCI',
    awayTeamShort: 'CHE',
    startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    popular: true,
    markets: [
      {
        id: 'm-pl-04-mw',
        matchId: 'm-pl-04',
        type: 'match_winner',
        name: 'Match Winner (1X2)',
        status: 'active',
        selections: [
          { id: 'sel-mci-1', marketId: 'm-pl-04-mw', name: 'Manchester City', oddsValue: 1.52, status: 'active' },
          { id: 'sel-mci-x', marketId: 'm-pl-04-mw', name: 'Draw', oddsValue: 4.40, status: 'active' },
          { id: 'sel-mci-2', marketId: 'm-pl-04-mw', name: 'Chelsea', oddsValue: 5.80, status: 'active' },
        ]
      },
      {
        id: 'm-pl-04-ou',
        matchId: 'm-pl-04',
        type: 'over_under_2_5',
        name: 'Over / Under 2.5 Goals',
        status: 'active',
        selections: [
          { id: 'sel-mci-ou-o', marketId: 'm-pl-04-ou', name: 'Over 2.5', oddsValue: 1.55, status: 'active' },
          { id: 'sel-mci-ou-u', marketId: 'm-pl-04-ou', name: 'Under 2.5', oddsValue: 2.35, status: 'active' },
        ]
      },
      {
        id: 'm-pl-04-btts',
        matchId: 'm-pl-04',
        type: 'both_teams_to_score',
        name: 'Both Teams to Score',
        status: 'active',
        selections: [
          { id: 'sel-mci-btts-y', marketId: 'm-pl-04-btts', name: 'Yes', oddsValue: 1.70, status: 'active' },
          { id: 'sel-mci-btts-n', marketId: 'm-pl-04-btts', name: 'No', oddsValue: 2.10, status: 'active' },
        ]
      }
    ]
  },
  {
    id: 'm-nba-01',
    sportId: 'basketball',
    leagueId: 'nba',
    leagueName: 'NBA Championship',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    homeTeamShort: 'BOS',
    awayTeamShort: 'LAL',
    startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'live',
    score: { home: 68, away: 64, period: 'Q3', minute: 7 },
    featured: true,
    popular: true,
    markets: [
      {
        id: 'm-nba-01-mw',
        matchId: 'm-nba-01',
        type: 'match_winner',
        name: 'Moneyline (Winner)',
        status: 'active',
        selections: [
          { id: 'sel-bos-1', marketId: 'm-nba-01-mw', name: 'Boston Celtics', oddsValue: 1.40, status: 'active' },
          { id: 'sel-bos-2', marketId: 'm-nba-01-mw', name: 'LA Lakers', oddsValue: 2.95, status: 'active' },
        ]
      },
      {
        id: 'm-nba-01-ou',
        matchId: 'm-nba-01',
        type: 'over_under_2_5',
        name: 'Total Points Over / Under 224.5',
        status: 'active',
        selections: [
          { id: 'sel-nba-ou-o', marketId: 'm-nba-01-ou', name: 'Over 224.5', oddsValue: 1.90, status: 'active' },
          { id: 'sel-nba-ou-u', marketId: 'm-nba-01-ou', name: 'Under 224.5', oddsValue: 1.90, status: 'active' },
        ]
      }
    ]
  },
  {
    id: 'm-nba-02',
    sportId: 'basketball',
    leagueId: 'nba',
    leagueName: 'NBA Championship',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    homeTeamShort: 'GSW',
    awayTeamShort: 'DEN',
    startTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    popular: true,
    markets: [
      {
        id: 'm-nba-02-mw',
        matchId: 'm-nba-02',
        type: 'match_winner',
        name: 'Moneyline (Winner)',
        status: 'active',
        selections: [
          { id: 'sel-gsw-1', marketId: 'm-nba-02-mw', name: 'Golden State Warriors', oddsValue: 2.05, status: 'active' },
          { id: 'sel-gsw-2', marketId: 'm-nba-02-mw', name: 'Denver Nuggets', oddsValue: 1.78, status: 'active' },
        ]
      }
    ]
  },
  {
    id: 'm-ten-01',
    sportId: 'tennis',
    leagueId: 'atp',
    leagueName: 'ATP Grand Slam Tournament',
    homeTeam: 'Carlos Alcaraz',
    awayTeam: 'Jannik Sinner',
    homeTeamShort: 'ALC',
    awayTeamShort: 'SIN',
    startTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    status: 'scheduled',
    featured: true,
    popular: true,
    markets: [
      {
        id: 'm-ten-01-mw',
        matchId: 'm-ten-01',
        type: 'match_winner',
        name: 'Match Winner',
        status: 'active',
        selections: [
          { id: 'sel-alc-1', marketId: 'm-ten-01-mw', name: 'Carlos Alcaraz', oddsValue: 1.92, status: 'active' },
          { id: 'sel-sin-2', marketId: 'm-ten-01-mw', name: 'Jannik Sinner', oddsValue: 1.88, status: 'active' },
        ]
      },
      {
        id: 'm-ten-01-ou',
        matchId: 'm-ten-01',
        type: 'over_under_2_5',
        name: 'Total Sets Over / Under 3.5',
        status: 'active',
        selections: [
          { id: 'sel-ten-ou-o', marketId: 'm-ten-01-ou', name: 'Over 3.5 Sets', oddsValue: 1.45, status: 'active' },
          { id: 'sel-ten-ou-u', marketId: 'm-ten-01-ou', name: 'Under 3.5 Sets', oddsValue: 2.60, status: 'active' },
        ]
      }
    ]
  }
];
