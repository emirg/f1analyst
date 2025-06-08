import os
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import fastf1
import fastf1.events
from agent.f1_analysis_bot import F1AnalysisBot
import pandas as pd
from utils import load_dummy_data, normalize_grand_prix
from cachetools import LRUCache, cached, TTLCache
from services.session import SessionService
from services.driver import DriverService
from models import (
    CompareDriversRequest,
    DriverComparisonResponse,
    YearCalendarResponse,
    GPSessionsResponse,
    SessionDriversResponse,
    YearDataResponse,
    SessionInfo,
    CalendarEvent
)

app = FastAPI(title="F1 Analyst API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure caches
event_schedule_cache = TTLCache(maxsize=50, ttl=3600)  # 1 hour TTL
session_data_cache = TTLCache(maxsize=100, ttl=1800)   # 30 minutes TTL
driver_comparison_cache = TTLCache(maxsize=50, ttl=1800)  # 30 minutes TTL

USE_DUMMY_DATA = os.getenv('USE_DUMMY_DATA', 'true').lower() == 'true'
bot = None if USE_DUMMY_DATA else F1AnalysisBot()
session_service = SessionService()
driver_service = DriverService()

@cached(event_schedule_cache)
def get_event_schedule_cached(year: int) -> fastf1.events.EventSchedule:
    return fastf1.get_event_schedule(year)

@cached(session_data_cache)
def get_session_data_cached(year: int, grand_prix: str, session: str) -> fastf1.core.Session:
    print(f"Getting session data for {year} / {grand_prix} / {session}")
    return session_service.get_session_data(year, grand_prix, session)

@app.post(
        "/compare-drivers", 
        response_model=DriverComparisonResponse, 
        tags=["Agent"]
) 
async def compare_drivers(request: CompareDriversRequest):
    try:
        # Just for dev testing, to avoid using OpenAI credits
        if USE_DUMMY_DATA:
            dummy_data = load_dummy_data()
            if "error" in dummy_data:
                raise HTTPException(status_code=500, detail=dummy_data["error"])
            return DriverComparisonResponse(analysis=dummy_data['analysis'])

        # Create a cache key
        cache_key = f"{request.year}_{request.grand_prix}_{request.session}_{request.driver1}_{request.driver2}"
        
        # Check if we have a cached comparison
        if cache_key in driver_comparison_cache:
            print(f"Using cached comparison for {cache_key}")
            return DriverComparisonResponse(analysis=driver_comparison_cache[cache_key])

        print("No cached comparison found")
        session = get_session_data_cached(
            request.year,
            request.grand_prix,
            request.session
        )

        print(f"Session data loaded for {request.year} / {request.grand_prix} / {request.session}")
        print(f"Comparing drivers {request.driver1} and {request.driver2}")
        analysis = bot.compare_drivers(
            session,
            request.driver1,
            request.driver2
        )
        
        print(f"Caching comparison result for {cache_key}")
        driver_comparison_cache[cache_key] = analysis
        
        return DriverComparisonResponse(analysis=analysis)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get(
        "/year-data/{year}",
        response_model=YearDataResponse,
        response_class=JSONResponse
)
async def get_year_data(year: int):
    try:
        # Use cached data where possible
        drivers, driver_names = driver_service.get_drivers_from_first_race(year)
        schedule = get_event_schedule_cached(year)

        return YearDataResponse(
            grand_prix=schedule['EventName'].tolist(),
            drivers=drivers,
            driver_names=driver_names
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
        "/year-calendar/{year}",
        response_model=YearCalendarResponse,
        tags=["Calendar"],
        response_class=JSONResponse
)
async def get_year_calendar(year: int):
    try:
        schedule = get_event_schedule_cached(year)
        
        calendar = [
            CalendarEvent(
                round_number=int(event['RoundNumber']),
                event_name=event['EventName'],
                event_format=event['EventFormat']
            )
            for _, event in schedule.iterrows()
        ]
        
        return YearCalendarResponse(
            year=year,
            total_rounds=len(calendar),
            calendar=calendar
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/gp-sessions/{year}/{grand_prix}",
    response_model=GPSessionsResponse,
    tags=["Sessions"],
    response_class=JSONResponse
)
async def get_gp_sessions(
    year: int,
    grand_prix: str = Depends(normalize_grand_prix),
):
    try:
        schedule = get_event_schedule_cached(year)
        event = schedule[schedule['EventName'] == grand_prix]
        
        if event.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Grand Prix {grand_prix} not found for year {year}"
            )
        
        event = event.iloc[0]
        sessions = []
        
        session_types = {
            'FP1': 'Session1Date',
            'FP2': 'Session2Date',
            'FP3': 'Session3Date',
            'Q1': 'Session4Date',
            'Q2': 'Session4Date',
            'Q3': 'Session4Date',
            'Race': 'Session5Date'
        }
        
        for session_type, date_column in session_types.items():
            if pd.notna(event[date_column]):
                sessions.append(SessionInfo(
                    type=session_type,
                    date=event[date_column].strftime('%Y-%m-%d %H:%M:%S')
                ))
        
        return GPSessionsResponse(
            year=year,
            grand_prix=grand_prix,
            event_format=event['EventFormat'],
            sessions=sessions
        )
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get(
    "/session-drivers/{year}/{grand_prix}/{session}",
    response_model=SessionDriversResponse,
    tags=["Drivers"],
    response_class=JSONResponse
)
async def get_session_drivers(
    year: int,
    session: str,
    grand_prix: str = Depends(normalize_grand_prix),
):
    try:
        session_data = get_session_data_cached(year, grand_prix, session)

        drivers_abbreviations = driver_service.get_drivers_abbreviations_from_session(session_data)

        return SessionDriversResponse(
            grand_prix=grand_prix,
            year=year,
            drivers=drivers_abbreviations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 