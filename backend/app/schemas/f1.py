from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CompareDriversRequest(BaseModel):
    year: int
    grand_prix: str
    session: str
    driver1: str
    driver2: str

class DriverComparisonResponse(BaseModel):
    analysis: str

class SessionInfo(BaseModel):
    type: str
    date: str

class CalendarEvent(BaseModel):
    round_number: int
    event_name: str
    event_format: str

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

class YearDataResponse(BaseModel):
    grand_prix: List[str]
    drivers: List[str]
    driver_names: List[str] 