from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class BaseResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "message": "Success"
            }
        }
    ) 

class CompareDriversRequest(BaseModel):
    year: int
    grand_prix: str
    session: str
    driver1: str
    driver2: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2024,
                "grandPrix": "Monaco",
                "session": "FP1",
                "driver1": "VER",
                "driver2": "HAM"
            }
        }
    }

class DriverComparisonResponse(BaseModel):
    analysis: str

class SessionInfo(BaseModel):
    type: str
    date: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "FP1",
                "date": "2024-05-24 10:30:00"
            }
        }
    }

class CalendarEvent(BaseModel):
    round_number: int
    event_name: str
    event_format: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "roundNumber": 1,
                "eventName": "Bahrain Grand Prix",
                "eventFormat": "conventional"
            }
        }
    }

class YearCalendarResponse(BaseModel):
    year: int
    total_rounds: int
    calendar: List[CalendarEvent]

class GPSessionsResponse(BaseModel):
    year: int
    grand_prix: str
    event_format: str
    sessions: List[SessionInfo]

class SessionDriversResponse(BaseModel):
    grand_prix: str
    year: int
    drivers: List[str]

    model_config = {
        "json_schema_extra": {
            "example": {
                "grandPrix": "Monaco",
                "year": 2024,
                "drivers": ["VER", "HAM", "LEC"]
            }
        }
    } 

class YearDataResponse(BaseModel):
    grand_prix: List[str]
    drivers: List[str]
    driver_names: List[str]

class LapTimeEntry(BaseModel):
    lap_number: int
    driver: str
    time_seconds: float
    compound: Optional[str] = None

class ComparisonLapsResponse(BaseModel):
    driver1: str
    driver2: str
    laps: List[LapTimeEntry]

class TelemetryPoint(BaseModel):
    distance: float
    speed: float
    throttle: float
    brake: bool

class DriverTelemetry(BaseModel):
    driver: str
    team_color: str
    data: List[TelemetryPoint]

class ComparisonTelemetryResponse(BaseModel):
    driver1: DriverTelemetry
    driver2: DriverTelemetry

class SectorTime(BaseModel):
    driver: str
    sector1: float
    sector2: float
    sector3: float

class ComparisonSectorsResponse(BaseModel):
    driver1: SectorTime
    driver2: SectorTime

class Stint(BaseModel):
    stint_number: int
    compound: str
    lap_start: int
    lap_end: int
    laps: int

class DriverStrategy(BaseModel):
    driver: str
    stints: List[Stint]

class ComparisonStrategyResponse(BaseModel):
    driver1: DriverStrategy
    driver2: DriverStrategy

class PositionEntry(BaseModel):
    lap_number: int
    driver: str
    position: int

class ComparisonPositionsResponse(BaseModel):
    driver1: str
    driver2: str
    positions: List[PositionEntry]

class ComparisonQueryParams(BaseModel):
    year: int
    gp: str
    session: str
    driver1: str
    driver2: str

class DriverStanding(BaseModel):
    position: int
    driver: str
    driver_abbreviation: str
    team: str
    team_color: str
    points: float

class StandingsResponse(BaseModel):
    year: int
    standings: List[DriverStanding]

class ConstructorStanding(BaseModel):
    position: int
    team: str
    team_color: str
    points: float

class ConstructorStandingsResponse(BaseModel):
    year: int
    standings: List[ConstructorStanding]

class NextRace(BaseModel):
    event_name: str
    round_number: int
    date: str
    country: Optional[str] = None

class LastRaceResult(BaseModel):
    event_name: str
    top5: List[DriverStanding]

class DashboardOverview(BaseModel):
    year: int
    next_race: Optional[NextRace] = None
    last_race: Optional[LastRaceResult] = None
    driver_standings_top10: List[DriverStanding]
    constructor_standings_top10: List[ConstructorStanding]