from pydantic import BaseModel
from typing import List

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
    
class SessionDriversResponse(BaseModel):
    """Response model for session drivers data"""
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