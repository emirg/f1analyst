import fastf1
import pandas as pd
from app.services.calendar import CalendarService, get_calendar_service
from app.services.cache_manager import get_cache_manager
from app.schemas.f1 import (
    LapTimeEntry, ComparisonLapsResponse,
    TelemetryPoint, DriverTelemetry, ComparisonTelemetryResponse,
    SectorTime, ComparisonSectorsResponse,
    Stint, DriverStrategy, ComparisonStrategyResponse,
    PositionEntry, ComparisonPositionsResponse,
)

_comparison_service_instance = None

class ComparisonService:
    def __init__(self):
        self.calendar_service = get_calendar_service()
        self.cache_manager = get_cache_manager()

    async def _get_session(self, year: int, gp: str, session: str, need_telemetry: bool = False):
        return await self.calendar_service.get_session_data(year, gp, session, load_telemetry=need_telemetry)

    async def get_laps(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonLapsResponse:
        session_data = await self._get_session(year, gp, session)
        laps = []
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            for _, lap in drv_laps.iterrows():
                lt = lap['LapTime']
                if pd.notna(lt):
                    laps.append(LapTimeEntry(
                        lap_number=int(lap['LapNumber']),
                        driver=drv,
                        time_seconds=lt.total_seconds(),
                        compound=lap.get('Compound')
                    ))
        return ComparisonLapsResponse(driver1=driver1, driver2=driver2, laps=laps)

    async def get_telemetry(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonTelemetryResponse:
        session_data = await self._get_session(year, gp, session, need_telemetry=True)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            fastest = drv_laps.pick_fastest()
            tel = fastest.get_telemetry()
            team_color = f"#{fastest['Team']}" if 'Team' in fastest else "#3b82f6"
            try:
                team_color = f"#{session_data.results[session_data.results['Abbreviation'] == drv].iloc[0]['TeamColor']}"
            except Exception:
                team_color = "#3b82f6"
            points = [
                TelemetryPoint(
                    distance=float(row['Distance']),
                    speed=float(row['Speed']),
                    throttle=float(row['Throttle']),
                    brake=bool(row['Brake'])
                )
                for _, row in tel.iterrows()
            ]
            result[drv] = DriverTelemetry(driver=drv, team_color=team_color, data=points)
        return ComparisonTelemetryResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_sectors(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonSectorsResponse:
        session_data = await self._get_session(year, gp, session)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            fastest = drv_laps.pick_fastest()
            result[drv] = SectorTime(
                driver=drv,
                sector1=fastest['Sector1Time'].total_seconds() if pd.notna(fastest['Sector1Time']) else 0,
                sector2=fastest['Sector2Time'].total_seconds() if pd.notna(fastest['Sector2Time']) else 0,
                sector3=fastest['Sector3Time'].total_seconds() if pd.notna(fastest['Sector3Time']) else 0,
            )
        return ComparisonSectorsResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_strategy(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonStrategyResponse:
        session_data = await self._get_session(year, gp, session)
        result = {}
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            stints = []
            stint_groups = drv_laps.groupby('Stint')
            for stint_num, stint_laps in stint_groups:
                compound = stint_laps.iloc[0].get('Compound', 'UNKNOWN')
                stints.append(Stint(
                    stint_number=int(stint_num),
                    compound=compound if compound else 'UNKNOWN',
                    lap_start=int(stint_laps['LapNumber'].min()),
                    lap_end=int(stint_laps['LapNumber'].max()),
                    laps=len(stint_laps),
                ))
            result[drv] = DriverStrategy(driver=drv, stints=stints)
        return ComparisonStrategyResponse(driver1=result[driver1], driver2=result[driver2])

    async def get_positions(self, year: int, gp: str, session: str, driver1: str, driver2: str) -> ComparisonPositionsResponse:
        session_data = await self._get_session(year, gp, session)
        positions = []
        for drv in [driver1, driver2]:
            drv_laps = session_data.laps.pick_drivers(drv)
            for _, lap in drv_laps.iterrows():
                if pd.notna(lap.get('Position')):
                    positions.append(PositionEntry(
                        lap_number=int(lap['LapNumber']),
                        driver=drv,
                        position=int(lap['Position'])
                    ))
        return ComparisonPositionsResponse(driver1=driver1, driver2=driver2, positions=positions)

def get_comparison_service() -> ComparisonService:
    global _comparison_service_instance
    if _comparison_service_instance is None:
        _comparison_service_instance = ComparisonService()
    return _comparison_service_instance
