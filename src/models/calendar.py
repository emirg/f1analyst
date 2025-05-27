from pydantic import BaseModel
from typing import List
from datetime import datetime

class SessionInfo(BaseModel):
    """Model for session information"""
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
    """Model for calendar event information"""
    roundNumber: int
    eventName: str
    eventFormat: str

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
    totalRounds: int
    calendar: List[CalendarEvent]

class GPSessionsResponse(BaseModel):
    """Response model for Grand Prix sessions data"""
    year: int
    grandPrix: str
    eventFormat: str
    sessions: List[SessionInfo]

class YearDataResponse(BaseModel):
    """Response model for year data"""
    grandPrix: List[str]
    sessions: List[str]
    drivers: List[str]
    driverNames: List[str] 