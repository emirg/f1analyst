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