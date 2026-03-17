from fastapi import APIRouter, HTTPException, Depends
from app.services.standings import StandingsService, get_standings_service
from app.schemas.f1 import DashboardOverview

router = APIRouter()

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    year: int = None,
    service: StandingsService = Depends(get_standings_service)
):
    if year is None:
        from datetime import datetime
        year = datetime.now().year
    try:
        return await service.get_dashboard_overview(year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
