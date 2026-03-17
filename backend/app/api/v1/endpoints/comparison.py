from fastapi import APIRouter, HTTPException, Depends, Query
from app.services.comparison import ComparisonService, get_comparison_service
from app.schemas.f1 import (
    ComparisonLapsResponse, ComparisonTelemetryResponse,
    ComparisonSectorsResponse, ComparisonStrategyResponse,
    ComparisonPositionsResponse,
)

router = APIRouter()

@router.get("/laps", response_model=ComparisonLapsResponse)
async def get_comparison_laps(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_laps(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/telemetry", response_model=ComparisonTelemetryResponse)
async def get_comparison_telemetry(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_telemetry(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sectors", response_model=ComparisonSectorsResponse)
async def get_comparison_sectors(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_sectors(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/strategy", response_model=ComparisonStrategyResponse)
async def get_comparison_strategy(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_strategy(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/positions", response_model=ComparisonPositionsResponse)
async def get_comparison_positions(
    year: int = Query(...), gp: str = Query(...), session: str = Query(...),
    driver1: str = Query(...), driver2: str = Query(...),
    service: ComparisonService = Depends(get_comparison_service)
):
    try:
        return await service.get_positions(year, gp, session, driver1, driver2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
