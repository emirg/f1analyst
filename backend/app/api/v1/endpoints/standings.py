from fastapi import APIRouter, HTTPException, Depends
from app.services.standings import StandingsService, get_standings_service
from app.schemas.f1 import StandingsResponse, ConstructorStandingsResponse

router = APIRouter()

@router.get("/drivers/{year}", response_model=StandingsResponse)
async def get_driver_standings(year: int, service: StandingsService = Depends(get_standings_service)):
    try:
        return await service.get_driver_standings(year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/constructors/{year}", response_model=ConstructorStandingsResponse)
async def get_constructor_standings(year: int, service: StandingsService = Depends(get_standings_service)):
    try:
        return await service.get_constructor_standings(year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
