import { Sport, Match } from '../types';

export const INITIAL_SPORTS: Sport[] = [
  { id: 'football', name: 'Football', slug: 'football', icon: '⚽', priority: 1, matchCount: 8 },
  { id: 'baseball', name: 'Baseball', slug: 'baseball', icon: '⚾', priority: 2, matchCount: 21 },
  { id: 'basketball', name: 'Basketball', slug: 'basketball', icon: '🏀', priority: 3, matchCount: 4 },
  { id: 'americanfootball', name: 'American Football', slug: 'americanfootball', icon: '🏈', priority: 4, matchCount: 1 },
  { id: 'icehockey', name: 'Ice Hockey', slug: 'icehockey', icon: '🏒', priority: 5, matchCount: 4 }
];

// Preloaded with authentic real-world fixtures sorted strictly from sooner to later
export const INITIAL_MATCHES: Match[] = [
  {
    "id": "m_espn_401874933",
    "sportId": "football",
    "leagueId": "ita.1",
    "leagueName": "Serie A",
    "homeTeam": "Como",
    "awayTeam": "Parma",
    "homeTeamShort": "COMO",
    "awayTeamShort": "PAR",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/2572.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/115.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T16:30Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401874933_mw",
        "matchId": "m_espn_401874933",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874933_mw_1",
            "marketId": "m_espn_401874933_mw",
            "name": "Como",
            "oddsValue": 1.69,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_mw_x",
            "marketId": "m_espn_401874933_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_mw_2",
            "marketId": "m_espn_401874933_mw",
            "name": "Parma",
            "oddsValue": 10.5,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874933_ou",
        "matchId": "m_espn_401874933",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874933_ou_o",
            "marketId": "m_espn_401874933_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_ou_u",
            "marketId": "m_espn_401874933_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874933_btts",
        "matchId": "m_espn_401874933",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874933_btts_y",
            "marketId": "m_espn_401874933_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_btts_n",
            "marketId": "m_espn_401874933_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874933_dc",
        "matchId": "m_espn_401874933",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874933_dc_1x",
            "marketId": "m_espn_401874933_dc",
            "name": "COMO or Draw",
            "oddsValue": 1.17,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_dc_12",
            "marketId": "m_espn_401874933_dc",
            "name": "COMO or PAR",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401874933_dc_x2",
            "marketId": "m_espn_401874933_dc",
            "name": "Draw or PAR",
            "oddsValue": 2.76,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401874950",
    "sportId": "football",
    "leagueId": "ita.1",
    "leagueName": "Serie A",
    "homeTeam": "Torino",
    "awayTeam": "AS Roma",
    "homeTeamShort": "TOR",
    "awayTeamShort": "ROMA",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/239.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/104.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T16:30Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401874950_mw",
        "matchId": "m_espn_401874950",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874950_mw_1",
            "marketId": "m_espn_401874950_mw",
            "name": "Torino",
            "oddsValue": 1.6,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_mw_x",
            "marketId": "m_espn_401874950_mw",
            "name": "Draw",
            "oddsValue": 4.13,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_mw_2",
            "marketId": "m_espn_401874950_mw",
            "name": "AS Roma",
            "oddsValue": 11.55,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874950_ou",
        "matchId": "m_espn_401874950",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874950_ou_o",
            "marketId": "m_espn_401874950_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_ou_u",
            "marketId": "m_espn_401874950_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874950_btts",
        "matchId": "m_espn_401874950",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874950_btts_y",
            "marketId": "m_espn_401874950_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_btts_n",
            "marketId": "m_espn_401874950_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874950_dc",
        "matchId": "m_espn_401874950",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874950_dc_1x",
            "marketId": "m_espn_401874950_dc",
            "name": "TOR or Draw",
            "oddsValue": 1.16,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_dc_12",
            "marketId": "m_espn_401874950_dc",
            "name": "TOR or ROMA",
            "oddsValue": 1.41,
            "status": "active"
          },
          {
            "id": "m_espn_401874950_dc_x2",
            "marketId": "m_espn_401874950_dc",
            "name": "Draw or ROMA",
            "oddsValue": 3.04,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401874966",
    "sportId": "football",
    "leagueId": "ita.1",
    "leagueName": "Serie A",
    "homeTeam": "Internazionale",
    "awayTeam": "Udinese",
    "homeTeamShort": "INT",
    "awayTeamShort": "UDI",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/110.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/118.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T18:45Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401874966_mw",
        "matchId": "m_espn_401874966",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874966_mw_1",
            "marketId": "m_espn_401874966_mw",
            "name": "Internazionale",
            "oddsValue": 2.44,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_mw_x",
            "marketId": "m_espn_401874966_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_mw_2",
            "marketId": "m_espn_401874966_mw",
            "name": "Udinese",
            "oddsValue": 3.62,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874966_ou",
        "matchId": "m_espn_401874966",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874966_ou_o",
            "marketId": "m_espn_401874966_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_ou_u",
            "marketId": "m_espn_401874966_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874966_btts",
        "matchId": "m_espn_401874966",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874966_btts_y",
            "marketId": "m_espn_401874966_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_btts_n",
            "marketId": "m_espn_401874966_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401874966_dc",
        "matchId": "m_espn_401874966",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401874966_dc_1x",
            "marketId": "m_espn_401874966_dc",
            "name": "INT or Draw",
            "oddsValue": 1.48,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_dc_12",
            "marketId": "m_espn_401874966_dc",
            "name": "INT or UDI",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401874966_dc_x2",
            "marketId": "m_espn_401874966_dc",
            "name": "Draw or UDI",
            "oddsValue": 1.84,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401879280",
    "sportId": "football",
    "leagueId": "eng.1",
    "leagueName": "English Premier League",
    "homeTeam": "Leeds United",
    "awayTeam": "Newcastle United",
    "homeTeamShort": "LEE",
    "awayTeamShort": "NEW",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/357.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/361.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T19:00Z",
    "status": "scheduled",
    "featured": true,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401879280_mw",
        "matchId": "m_espn_401879280",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401879280_mw_1",
            "marketId": "m_espn_401879280_mw",
            "name": "Leeds United",
            "oddsValue": 3.28,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_mw_x",
            "marketId": "m_espn_401879280_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_mw_2",
            "marketId": "m_espn_401879280_mw",
            "name": "Newcastle United",
            "oddsValue": 2.63,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401879280_ou",
        "matchId": "m_espn_401879280",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401879280_ou_o",
            "marketId": "m_espn_401879280_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_ou_u",
            "marketId": "m_espn_401879280_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401879280_btts",
        "matchId": "m_espn_401879280",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401879280_btts_y",
            "marketId": "m_espn_401879280_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_btts_n",
            "marketId": "m_espn_401879280_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401879280_dc",
        "matchId": "m_espn_401879280",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401879280_dc_1x",
            "marketId": "m_espn_401879280_dc",
            "name": "LEE or Draw",
            "oddsValue": 1.75,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_dc_12",
            "marketId": "m_espn_401879280_dc",
            "name": "LEE or NEW",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401879280_dc_x2",
            "marketId": "m_espn_401879280_dc",
            "name": "Draw or NEW",
            "oddsValue": 1.54,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401882877",
    "sportId": "football",
    "leagueId": "esp.1",
    "leagueName": "La Liga",
    "homeTeam": "Villarreal",
    "awayTeam": "Real Betis",
    "homeTeamShort": "VIL",
    "awayTeamShort": "BET",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/102.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/244.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T19:00Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401882877_mw",
        "matchId": "m_espn_401882877",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882877_mw_1",
            "marketId": "m_espn_401882877_mw",
            "name": "Villarreal",
            "oddsValue": 3.09,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_mw_x",
            "marketId": "m_espn_401882877_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_mw_2",
            "marketId": "m_espn_401882877_mw",
            "name": "Real Betis",
            "oddsValue": 2.76,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882877_ou",
        "matchId": "m_espn_401882877",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882877_ou_o",
            "marketId": "m_espn_401882877_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_ou_u",
            "marketId": "m_espn_401882877_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882877_btts",
        "matchId": "m_espn_401882877",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882877_btts_y",
            "marketId": "m_espn_401882877_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_btts_n",
            "marketId": "m_espn_401882877_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882877_dc",
        "matchId": "m_espn_401882877",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882877_dc_1x",
            "marketId": "m_espn_401882877_dc",
            "name": "VIL or Draw",
            "oddsValue": 1.69,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_dc_12",
            "marketId": "m_espn_401882877_dc",
            "name": "VIL or BET",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401882877_dc_x2",
            "marketId": "m_espn_401882877_dc",
            "name": "Draw or BET",
            "oddsValue": 1.59,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816934",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Cleveland Guardians",
    "awayTeam": "Chicago White Sox",
    "homeTeamShort": "CLE",
    "awayTeamShort": "CHW",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/cle.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chw.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816934_mw",
        "matchId": "m_espn_401816934",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816934_mw_1",
            "marketId": "m_espn_401816934_mw",
            "name": "Cleveland Guardians",
            "oddsValue": 1.53,
            "status": "active"
          },
          {
            "id": "m_espn_401816934_mw_2",
            "marketId": "m_espn_401816934_mw",
            "name": "Chicago White Sox",
            "oddsValue": 3.33,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816936",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Cincinnati Reds",
    "awayTeam": "Los Angeles Dodgers",
    "homeTeamShort": "CIN",
    "awayTeamShort": "LAD",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/cin.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/lad.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816936_mw",
        "matchId": "m_espn_401816936",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816936_mw_1",
            "marketId": "m_espn_401816936_mw",
            "name": "Cincinnati Reds",
            "oddsValue": 1.89,
            "status": "active"
          },
          {
            "id": "m_espn_401816936_mw_2",
            "marketId": "m_espn_401816936_mw",
            "name": "Los Angeles Dodgers",
            "oddsValue": 2.36,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816935",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Toronto Blue Jays",
    "awayTeam": "Detroit Tigers",
    "homeTeamShort": "TOR",
    "awayTeamShort": "DET",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/tor.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/det.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T23:07Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816935_mw",
        "matchId": "m_espn_401816935",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816935_mw_1",
            "marketId": "m_espn_401816935_mw",
            "name": "Toronto Blue Jays",
            "oddsValue": 1.81,
            "status": "active"
          },
          {
            "id": "m_espn_401816935_mw_2",
            "marketId": "m_espn_401816935_mw",
            "name": "Detroit Tigers",
            "oddsValue": 2.5,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816933",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "New York Mets",
    "awayTeam": "Baltimore Orioles",
    "homeTeamShort": "NYM",
    "awayTeamShort": "BAL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/nym.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/bal.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T23:10Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816933_mw",
        "matchId": "m_espn_401816933",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816933_mw_1",
            "marketId": "m_espn_401816933_mw",
            "name": "New York Mets",
            "oddsValue": 1.53,
            "status": "active"
          },
          {
            "id": "m_espn_401816933_mw_2",
            "marketId": "m_espn_401816933_mw",
            "name": "Baltimore Orioles",
            "oddsValue": 3.33,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816937",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Chicago Cubs",
    "awayTeam": "Atlanta Braves",
    "homeTeamShort": "CHC",
    "awayTeamShort": "ATL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chc.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/atl.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T23:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816937_mw",
        "matchId": "m_espn_401816937",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816937_mw_1",
            "marketId": "m_espn_401816937_mw",
            "name": "Chicago Cubs",
            "oddsValue": 1.88,
            "status": "active"
          },
          {
            "id": "m_espn_401816937_mw_2",
            "marketId": "m_espn_401816937_mw",
            "name": "Atlanta Braves",
            "oddsValue": 2.39,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816938",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Minnesota Twins",
    "awayTeam": "New York Yankees",
    "homeTeamShort": "MIN",
    "awayTeamShort": "NYY",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/min.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/nyy.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T23:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816938_mw",
        "matchId": "m_espn_401816938",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816938_mw_1",
            "marketId": "m_espn_401816938_mw",
            "name": "Minnesota Twins",
            "oddsValue": 1.81,
            "status": "active"
          },
          {
            "id": "m_espn_401816938_mw_2",
            "marketId": "m_espn_401816938_mw",
            "name": "New York Yankees",
            "oddsValue": 2.5,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816939",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "St. Louis Cardinals",
    "awayTeam": "San Francisco Giants",
    "homeTeamShort": "STL",
    "awayTeamShort": "SF",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/stl.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sf.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-14T23:45Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816939_mw",
        "matchId": "m_espn_401816939",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816939_mw_1",
            "marketId": "m_espn_401816939_mw",
            "name": "St. Louis Cardinals",
            "oddsValue": 1.63,
            "status": "active"
          },
          {
            "id": "m_espn_401816939_mw_2",
            "marketId": "m_espn_401816939_mw",
            "name": "San Francisco Giants",
            "oddsValue": 2.96,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401872931",
    "sportId": "americanfootball",
    "leagueId": "nfl",
    "leagueName": "NFL Football",
    "homeTeam": "Kansas City Chiefs",
    "awayTeam": "Denver Broncos",
    "homeTeamShort": "KC",
    "awayTeamShort": "DEN",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/kc.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/den.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T00:15Z",
    "status": "scheduled",
    "featured": true,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401872931_mw",
        "matchId": "m_espn_401872931",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401872931_mw_1",
            "marketId": "m_espn_401872931_mw",
            "name": "Kansas City Chiefs",
            "oddsValue": 1.71,
            "status": "active"
          },
          {
            "id": "m_espn_401872931_mw_2",
            "marketId": "m_espn_401872931_mw",
            "name": "Denver Broncos",
            "oddsValue": 2.73,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816940",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Colorado Rockies",
    "awayTeam": "San Diego Padres",
    "homeTeamShort": "COL",
    "awayTeamShort": "SD",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/col.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sd.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T00:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816940_mw",
        "matchId": "m_espn_401816940",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816940_mw_1",
            "marketId": "m_espn_401816940_mw",
            "name": "Colorado Rockies",
            "oddsValue": 1.83,
            "status": "active"
          },
          {
            "id": "m_espn_401816940_mw_2",
            "marketId": "m_espn_401816940_mw",
            "name": "San Diego Padres",
            "oddsValue": 2.47,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816942",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Los Angeles Angels",
    "awayTeam": "Seattle Mariners",
    "homeTeamShort": "LAA",
    "awayTeamShort": "SEA",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/laa.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sea.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T01:38Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816942_mw",
        "matchId": "m_espn_401816942",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816942_mw_1",
            "marketId": "m_espn_401816942_mw",
            "name": "Los Angeles Angels",
            "oddsValue": 1.76,
            "status": "active"
          },
          {
            "id": "m_espn_401816942_mw_2",
            "marketId": "m_espn_401816942_mw",
            "name": "Seattle Mariners",
            "oddsValue": 2.59,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816941",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Arizona Diamondbacks",
    "awayTeam": "Miami Marlins",
    "homeTeamShort": "ARI",
    "awayTeamShort": "MIA",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/ari.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/mia.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T01:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816941_mw",
        "matchId": "m_espn_401816941",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816941_mw_1",
            "marketId": "m_espn_401816941_mw",
            "name": "Arizona Diamondbacks",
            "oddsValue": 1.63,
            "status": "active"
          },
          {
            "id": "m_espn_401816941_mw_2",
            "marketId": "m_espn_401816941_mw",
            "name": "Miami Marlins",
            "oddsValue": 2.96,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401882868",
    "sportId": "football",
    "leagueId": "esp.1",
    "leagueName": "La Liga",
    "homeTeam": "Rayo Vallecano",
    "awayTeam": "Espanyol",
    "homeTeamShort": "RAY",
    "awayTeamShort": "ESP",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/101.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/88.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T17:00Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401882868_mw",
        "matchId": "m_espn_401882868",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882868_mw_1",
            "marketId": "m_espn_401882868_mw",
            "name": "Rayo Vallecano",
            "oddsValue": 2.63,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_mw_x",
            "marketId": "m_espn_401882868_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_mw_2",
            "marketId": "m_espn_401882868_mw",
            "name": "Espanyol",
            "oddsValue": 3.28,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882868_ou",
        "matchId": "m_espn_401882868",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882868_ou_o",
            "marketId": "m_espn_401882868_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_ou_u",
            "marketId": "m_espn_401882868_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882868_btts",
        "matchId": "m_espn_401882868",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882868_btts_y",
            "marketId": "m_espn_401882868_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_btts_n",
            "marketId": "m_espn_401882868_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882868_dc",
        "matchId": "m_espn_401882868",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882868_dc_1x",
            "marketId": "m_espn_401882868_dc",
            "name": "RAY or Draw",
            "oddsValue": 1.54,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_dc_12",
            "marketId": "m_espn_401882868_dc",
            "name": "RAY or ESP",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401882868_dc_x2",
            "marketId": "m_espn_401882868_dc",
            "name": "Draw or ESP",
            "oddsValue": 1.75,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401882876",
    "sportId": "football",
    "leagueId": "esp.1",
    "leagueName": "La Liga",
    "homeTeam": "Alavés",
    "awayTeam": "Valencia",
    "homeTeamShort": "ALA",
    "awayTeamShort": "VAL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/96.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/94.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T18:00Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401882876_mw",
        "matchId": "m_espn_401882876",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882876_mw_1",
            "marketId": "m_espn_401882876_mw",
            "name": "Alavés",
            "oddsValue": 2.06,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_mw_x",
            "marketId": "m_espn_401882876_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_mw_2",
            "marketId": "m_espn_401882876_mw",
            "name": "Valencia",
            "oddsValue": 5,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882876_ou",
        "matchId": "m_espn_401882876",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882876_ou_o",
            "marketId": "m_espn_401882876_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_ou_u",
            "marketId": "m_espn_401882876_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882876_btts",
        "matchId": "m_espn_401882876",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882876_btts_y",
            "marketId": "m_espn_401882876_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_btts_n",
            "marketId": "m_espn_401882876_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882876_dc",
        "matchId": "m_espn_401882876",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882876_dc_1x",
            "marketId": "m_espn_401882876_dc",
            "name": "ALA or Draw",
            "oddsValue": 1.33,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_dc_12",
            "marketId": "m_espn_401882876_dc",
            "name": "ALA or VAL",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401882876_dc_x2",
            "marketId": "m_espn_401882876_dc",
            "name": "Draw or VAL",
            "oddsValue": 2.14,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401882872",
    "sportId": "football",
    "leagueId": "esp.1",
    "leagueName": "La Liga",
    "homeTeam": "Elche",
    "awayTeam": "Real Madrid",
    "homeTeamShort": "ELC",
    "awayTeamShort": "RMA",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/3751.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/soccer/500/86.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T19:30Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401882872_mw",
        "matchId": "m_espn_401882872",
        "type": "match_winner",
        "name": "Match Winner (1X2)",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882872_mw_1",
            "marketId": "m_espn_401882872_mw",
            "name": "Elche",
            "oddsValue": 3.5,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_mw_x",
            "marketId": "m_espn_401882872_mw",
            "name": "Draw",
            "oddsValue": 3.75,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_mw_2",
            "marketId": "m_espn_401882872_mw",
            "name": "Real Madrid",
            "oddsValue": 2.5,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882872_ou",
        "matchId": "m_espn_401882872",
        "type": "over_under_2_5",
        "name": "Over / Under 2.5 Goals",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882872_ou_o",
            "marketId": "m_espn_401882872_ou",
            "name": "Over 2.5",
            "oddsValue": 2.02,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_ou_u",
            "marketId": "m_espn_401882872_ou",
            "name": "Under 2.5",
            "oddsValue": 2.19,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882872_btts",
        "matchId": "m_espn_401882872",
        "type": "both_teams_to_score",
        "name": "Both Teams to Score",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882872_btts_y",
            "marketId": "m_espn_401882872_btts",
            "name": "Yes",
            "oddsValue": 1.94,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_btts_n",
            "marketId": "m_espn_401882872_btts",
            "name": "No",
            "oddsValue": 2.06,
            "status": "active"
          }
        ]
      },
      {
        "id": "m_espn_401882872_dc",
        "matchId": "m_espn_401882872",
        "type": "double_chance",
        "name": "Double Chance",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401882872_dc_1x",
            "marketId": "m_espn_401882872_dc",
            "name": "ELC or Draw",
            "oddsValue": 1.81,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_dc_12",
            "marketId": "m_espn_401882872_dc",
            "name": "ELC or RMA",
            "oddsValue": 1.46,
            "status": "active"
          },
          {
            "id": "m_espn_401882872_dc_x2",
            "marketId": "m_espn_401882872_dc",
            "name": "Draw or RMA",
            "oddsValue": 1.5,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816943",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Tampa Bay Rays",
    "awayTeam": "Athletics",
    "homeTeamShort": "TB",
    "awayTeamShort": "ATH",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/tb.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/ath.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816943_mw",
        "matchId": "m_espn_401816943",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816943_mw_1",
            "marketId": "m_espn_401816943_mw",
            "name": "Tampa Bay Rays",
            "oddsValue": 1.65,
            "status": "active"
          },
          {
            "id": "m_espn_401816943_mw_2",
            "marketId": "m_espn_401816943_mw",
            "name": "Athletics",
            "oddsValue": 2.88,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816945",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Cleveland Guardians",
    "awayTeam": "Chicago White Sox",
    "homeTeamShort": "CLE",
    "awayTeamShort": "CHW",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/cle.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chw.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816945_mw",
        "matchId": "m_espn_401816945",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816945_mw_1",
            "marketId": "m_espn_401816945_mw",
            "name": "Cleveland Guardians",
            "oddsValue": 1.56,
            "status": "active"
          },
          {
            "id": "m_espn_401816945_mw_2",
            "marketId": "m_espn_401816945_mw",
            "name": "Chicago White Sox",
            "oddsValue": 3.23,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816947",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Cincinnati Reds",
    "awayTeam": "Los Angeles Dodgers",
    "homeTeamShort": "CIN",
    "awayTeamShort": "LAD",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/cin.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/lad.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816947_mw",
        "matchId": "m_espn_401816947",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816947_mw_1",
            "marketId": "m_espn_401816947_mw",
            "name": "Cincinnati Reds",
            "oddsValue": 1.86,
            "status": "active"
          },
          {
            "id": "m_espn_401816947_mw_2",
            "marketId": "m_espn_401816947_mw",
            "name": "Los Angeles Dodgers",
            "oddsValue": 2.41,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816948",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Pittsburgh Pirates",
    "awayTeam": "Milwaukee Brewers",
    "homeTeamShort": "PIT",
    "awayTeamShort": "MIL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/pit.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/mil.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T22:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816948_mw",
        "matchId": "m_espn_401816948",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816948_mw_1",
            "marketId": "m_espn_401816948_mw",
            "name": "Pittsburgh Pirates",
            "oddsValue": 1.58,
            "status": "active"
          },
          {
            "id": "m_espn_401816948_mw_2",
            "marketId": "m_espn_401816948_mw",
            "name": "Milwaukee Brewers",
            "oddsValue": 3.13,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816949",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Washington Nationals",
    "awayTeam": "Philadelphia Phillies",
    "homeTeamShort": "WSH",
    "awayTeamShort": "PHI",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/wsh.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/phi.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T22:45Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816949_mw",
        "matchId": "m_espn_401816949",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816949_mw_1",
            "marketId": "m_espn_401816949_mw",
            "name": "Washington Nationals",
            "oddsValue": 1.81,
            "status": "active"
          },
          {
            "id": "m_espn_401816949_mw_2",
            "marketId": "m_espn_401816949_mw",
            "name": "Philadelphia Phillies",
            "oddsValue": 2.5,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816946",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Toronto Blue Jays",
    "awayTeam": "Detroit Tigers",
    "homeTeamShort": "TOR",
    "awayTeamShort": "DET",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/tor.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/det.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T23:07Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816946_mw",
        "matchId": "m_espn_401816946",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816946_mw_1",
            "marketId": "m_espn_401816946_mw",
            "name": "Toronto Blue Jays",
            "oddsValue": 1.78,
            "status": "active"
          },
          {
            "id": "m_espn_401816946_mw_2",
            "marketId": "m_espn_401816946_mw",
            "name": "Detroit Tigers",
            "oddsValue": 2.56,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816944",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "New York Mets",
    "awayTeam": "Baltimore Orioles",
    "homeTeamShort": "NYM",
    "awayTeamShort": "BAL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/nym.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/bal.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T23:10Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816944_mw",
        "matchId": "m_espn_401816944",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816944_mw_1",
            "marketId": "m_espn_401816944_mw",
            "name": "New York Mets",
            "oddsValue": 1.56,
            "status": "active"
          },
          {
            "id": "m_espn_401816944_mw_2",
            "marketId": "m_espn_401816944_mw",
            "name": "Baltimore Orioles",
            "oddsValue": 3.23,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816950",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Chicago Cubs",
    "awayTeam": "Atlanta Braves",
    "homeTeamShort": "CHC",
    "awayTeamShort": "ATL",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chc.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/atl.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T23:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816950_mw",
        "matchId": "m_espn_401816950",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816950_mw_1",
            "marketId": "m_espn_401816950_mw",
            "name": "Chicago Cubs",
            "oddsValue": 1.53,
            "status": "active"
          },
          {
            "id": "m_espn_401816950_mw_2",
            "marketId": "m_espn_401816950_mw",
            "name": "Atlanta Braves",
            "oddsValue": 3.33,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816953",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Minnesota Twins",
    "awayTeam": "New York Yankees",
    "homeTeamShort": "MIN",
    "awayTeamShort": "NYY",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/min.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/nyy.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T23:40Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816953_mw",
        "matchId": "m_espn_401816953",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816953_mw_1",
            "marketId": "m_espn_401816953_mw",
            "name": "Minnesota Twins",
            "oddsValue": 1.76,
            "status": "active"
          },
          {
            "id": "m_espn_401816953_mw_2",
            "marketId": "m_espn_401816953_mw",
            "name": "New York Yankees",
            "oddsValue": 2.59,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816954",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "St. Louis Cardinals",
    "awayTeam": "San Francisco Giants",
    "homeTeamShort": "STL",
    "awayTeamShort": "SF",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/stl.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/sf.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-15T23:45Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816954_mw",
        "matchId": "m_espn_401816954",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816954_mw_1",
            "marketId": "m_espn_401816954_mw",
            "name": "St. Louis Cardinals",
            "oddsValue": 1.59,
            "status": "active"
          },
          {
            "id": "m_espn_401816954_mw_2",
            "marketId": "m_espn_401816954_mw",
            "name": "San Francisco Giants",
            "oddsValue": 3.09,
            "status": "active"
          }
        ]
      }
    ]
  },
  {
    "id": "m_espn_401816951",
    "sportId": "baseball",
    "leagueId": "mlb",
    "leagueName": "MLB Baseball",
    "homeTeam": "Texas Rangers",
    "awayTeam": "Boston Red Sox",
    "homeTeamShort": "TEX",
    "awayTeamShort": "BOS",
    "homeLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/tex.png",
    "awayLogo": "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/bos.png",
    "providerName": "ESPN Official Live Feed",
    "startTime": "2026-09-16T00:05Z",
    "status": "scheduled",
    "featured": false,
    "popular": true,
    "markets": [
      {
        "id": "m_espn_401816951_mw",
        "matchId": "m_espn_401816951",
        "type": "match_winner",
        "name": "Moneyline Winner",
        "status": "active",
        "selections": [
          {
            "id": "m_espn_401816951_mw_1",
            "marketId": "m_espn_401816951_mw",
            "name": "Texas Rangers",
            "oddsValue": 1.72,
            "status": "active"
          },
          {
            "id": "m_espn_401816951_mw_2",
            "marketId": "m_espn_401816951_mw",
            "name": "Boston Red Sox",
            "oddsValue": 2.69,
            "status": "active"
          }
        ]
      }
    ]
  }
];
