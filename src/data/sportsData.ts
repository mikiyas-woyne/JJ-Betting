import { Sport, Match } from "../types";

export const INITIAL_SPORTS: Sport[] = [
  {
    "id": "football",
    "name": "Football",
    "slug": "football",
    "icon": "⚽",
    "priority": 1,
    "matchCount": 8
  }
];

// Preloaded with authentic real-world football fixtures sorted strictly from sooner to later
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
  }
];
