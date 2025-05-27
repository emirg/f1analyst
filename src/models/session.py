from pydantic import BaseModel
from typing import List

class SessionDriversResponse(BaseModel):
    """Response model for session drivers data"""
    grandPrix: str
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