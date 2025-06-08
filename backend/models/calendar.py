from pydantic import BaseModel
from typing import List
from datetime import datetime

from models.session import SessionInfo

class CalendarEvent(BaseModel):
    """Model for calendar event information"""
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
    """Response model for year calendar data"""
    year: int
    total_rounds: int
    calendar: List[CalendarEvent]

class GPSessionsResponse(BaseModel):
    """Response model for Grand Prix sessions data"""
    year: int
    grand_prix: str
    event_format: str
    sessions: List[SessionInfo]

class YearDataResponse(BaseModel):
    """Response model for year data"""
    grand_prix: List[str]
    drivers: List[str]
    driver_names: List[str] 