from pydantic import BaseModel
from typing import List, Optional

class CompareDriversRequest(BaseModel):
    """Request model for comparing two drivers"""
    year: int
    grandPrix: str
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

class DriverAnalysis(BaseModel):
    """Model for driver analysis data"""
    name: str
    avg_lap: str
    best_lap: str
    consistency: str
    fuel_data: Optional[dict] = None

class DriverComparisonResponse(BaseModel):
    """Response model for driver comparison"""
    driver1: DriverAnalysis
    driver2: DriverAnalysis 