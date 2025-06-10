from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.schemas.f1 import YearCalendarResponse, GPSessionsResponse, SessionDriversResponse, YearDataResponse
from app.services.calendar import CalendarService
from app.services.driver import DriverService
from app.core.config import settings

router = APIRouter()

@router.get(
    "/year-data/{year}",
    response_model=YearDataResponse,
    response_class=JSONResponse,
    tags=["Calendar"]
)
async def get_year_data(
    year: int,
    calendar_service: CalendarService = Depends(),
    driver_service: DriverService = Depends()
):
    try:
        drivers, driver_names = driver_service.get_drivers_from_first_race(year)
        schedule = await calendar_service.get_event_schedule(year)

        return YearDataResponse(
            grand_prix=schedule['EventName'].tolist(),
            drivers=drivers,
            driver_names=driver_names
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/year-calendar/{year}",
    response_model=YearCalendarResponse,
    response_class=JSONResponse,
    tags=["Calendar"]
)
async def get_year_calendar(
    year: int,
    calendar_service: CalendarService = Depends()
):
    try:
        calendar = await calendar_service.get_calendar(year)
        return YearCalendarResponse(
            year=year,
            total_rounds=len(calendar),
            calendar=calendar
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/gp-sessions/{year}/{grand_prix}",
    response_model=GPSessionsResponse,
    response_class=JSONResponse,
    tags=["Calendar"]
)
async def get_gp_sessions(
    year: int,
    grand_prix: str,
    calendar_service: CalendarService = Depends()
):
    try:
        sessions = await calendar_service.get_gp_sessions(year, grand_prix)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/session-drivers/{year}/{grand_prix}/{session}",
    response_model=SessionDriversResponse,
    response_class=JSONResponse,
    tags=["Calendar"]
)
async def get_session_drivers(
    year: int,
    grand_prix: str,
    session: str,
    calendar_service: CalendarService = Depends(),
    driver_service: DriverService = Depends()
):
    try:
        session_data = await calendar_service.get_session_data(year, grand_prix, session)
        drivers = driver_service.get_drivers_abbreviations_from_session(session_data)

        return SessionDriversResponse(
            grand_prix=grand_prix,
            year=year,
            drivers=drivers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 