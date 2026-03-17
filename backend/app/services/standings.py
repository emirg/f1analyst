import fastf1
import pandas as pd
from datetime import datetime
from cachetools import TTLCache
from app.services.cache_manager import get_cache_manager
from app.schemas.f1 import (
    DriverStanding, StandingsResponse,
    ConstructorStanding, ConstructorStandingsResponse,
    NextRace, LastRaceResult, DashboardOverview,
)

_standings_service_instance = None

class StandingsService:
    def __init__(self):
        self.cache_manager = get_cache_manager()
        self._standings_cache = TTLCache(maxsize=20, ttl=3600)

    def _get_latest_race_session(self, year: int):
        """Find the most recent completed race in the season."""
        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')
        latest_session = None
        latest_event = None

        for _, event in schedule.iterrows():
            session_date = event.get('Session5Date')
            if session_date is not None and pd.notna(session_date):
                if hasattr(session_date, 'tz') and session_date.tz is None:
                    session_date = session_date.tz_localize('UTC')
                if session_date < now:
                    try:
                        session = fastf1.get_session(year, int(event['RoundNumber']), 'R')
                        session.load(telemetry=False, laps=False, weather=False, messages=False)
                        if session.results is not None and not session.results.empty:
                            latest_session = session
                            latest_event = event
                    except Exception:
                        continue
        return latest_session, latest_event

    def _extract_team_color(self, results, driver_abbr: str) -> str:
        try:
            row = results[results['Abbreviation'] == driver_abbr].iloc[0]
            return f"#{row['TeamColor']}" if pd.notna(row.get('TeamColor')) else "#3b82f6"
        except Exception:
            return "#3b82f6"

    async def get_driver_standings(self, year: int) -> StandingsResponse:
        cache_key = f"driver_standings_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        session, _ = self._get_latest_race_session(year)
        standings = []
        if session is not None and session.results is not None:
            results = session.results.sort_values('Position')
            # Build cumulative standings from results
            for _, row in results.iterrows():
                standings.append(DriverStanding(
                    position=int(row['Position']) if pd.notna(row['Position']) else 0,
                    driver=row.get('FullName', ''),
                    driver_abbreviation=row.get('Abbreviation', ''),
                    team=row.get('TeamName', ''),
                    team_color=self._extract_team_color(results, row.get('Abbreviation', '')),
                    points=float(row['Points']) if pd.notna(row.get('Points')) else 0,
                ))

        resp = StandingsResponse(year=year, standings=standings)
        self._standings_cache[cache_key] = resp
        return resp

    async def get_constructor_standings(self, year: int) -> ConstructorStandingsResponse:
        cache_key = f"constructor_standings_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        session, _ = self._get_latest_race_session(year)
        team_points = {}
        team_colors = {}
        if session is not None and session.results is not None:
            for _, row in session.results.iterrows():
                team = row.get('TeamName', 'Unknown')
                pts = float(row['Points']) if pd.notna(row.get('Points')) else 0
                team_points[team] = team_points.get(team, 0) + pts
                if team not in team_colors:
                    team_colors[team] = f"#{row['TeamColor']}" if pd.notna(row.get('TeamColor')) else "#3b82f6"

        sorted_teams = sorted(team_points.items(), key=lambda x: x[1], reverse=True)
        standings = [
            ConstructorStanding(
                position=i + 1,
                team=team,
                team_color=team_colors.get(team, "#3b82f6"),
                points=pts,
            )
            for i, (team, pts) in enumerate(sorted_teams)
        ]

        resp = ConstructorStandingsResponse(year=year, standings=standings)
        self._standings_cache[cache_key] = resp
        return resp

    async def get_dashboard_overview(self, year: int) -> DashboardOverview:
        cache_key = f"dashboard_{year}"
        if cache_key in self._standings_cache:
            return self._standings_cache[cache_key]

        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')

        # Find next race
        next_race = None
        for _, event in schedule.iterrows():
            session_date = event.get('Session5Date')
            if session_date is not None and pd.notna(session_date):
                if hasattr(session_date, 'tz') and session_date.tz is None:
                    session_date = session_date.tz_localize('UTC')
                if session_date > now:
                    next_race = NextRace(
                        event_name=event['EventName'],
                        round_number=int(event['RoundNumber']),
                        date=session_date.strftime('%Y-%m-%d %H:%M:%S'),
                        country=event.get('Country'),
                    )
                    break

        # Get standings
        driver_standings = await self.get_driver_standings(year)
        constructor_standings = await self.get_constructor_standings(year)

        # Last race result
        last_race = None
        session, last_event = self._get_latest_race_session(year)
        if session is not None and last_event is not None:
            last_race = LastRaceResult(
                event_name=last_event['EventName'],
                top5=driver_standings.standings[:5],
            )

        overview = DashboardOverview(
            year=year,
            next_race=next_race,
            last_race=last_race,
            driver_standings_top10=driver_standings.standings[:10],
            constructor_standings_top10=constructor_standings.standings[:10],
        )
        self._standings_cache[cache_key] = overview
        return overview

def get_standings_service() -> StandingsService:
    global _standings_service_instance
    if _standings_service_instance is None:
        _standings_service_instance = StandingsService()
    return _standings_service_instance
