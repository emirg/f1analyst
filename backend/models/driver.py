from pydantic import BaseModel
from typing import List, Optional

class CompareDriversRequest(BaseModel):
    """Request model for comparing two drivers"""
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
    """Response model for driver comparison"""
    analysis: str