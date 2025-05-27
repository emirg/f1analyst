from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1.events
from agent.f1_analysis_bot import F1AnalysisBot
import fastf1
import pandas as pd
import os
from utils import load_dummy_data, normalize_grand_prix
from cachetools import LRUCache, cached
from datetime import datetime, timedelta
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

drivers_cache = LRUCache(maxsize=50)
event_schedule_cache = LRUCache(maxsize=50)

USE_DUMMY_DATA = os.getenv('USE_DUMMY_DATA', 'true').lower() == 'true'
bot = None if USE_DUMMY_DATA else F1AnalysisBot()

@cached(drivers_cache)
def get_drivers_from_first_race(year: int) -> tuple[list[str], list[str]]:
    try:
        schedule = fastf1.get_event_schedule(year)
        for _, event in schedule.iterrows():
            try:
                session = fastf1.get_session(year, event['RoundNumber'], 'R')
                session.load()
                if session.results is not None:
                    drivers = session.results['Abbreviation'].unique().tolist()
                    names = session.results['FullName'].unique().tolist()
                    return drivers, names
            except Exception:
                continue
        return [], []
    except Exception:
        return [], []

@cached(event_schedule_cache)
def get_event_schedule_cached(year: int) -> fastf1.events.EventSchedule:
    return fastf1.get_event_schedule(year)

@app.post("/compare-drivers", response_model=DriverComparisonResponse)
async def compare_drivers(request: CompareDriversRequest):
    try:
        if USE_DUMMY_DATA:
            dummy_data = load_dummy_data()
            if "error" in dummy_data:
                raise HTTPException(status_code=500, detail=dummy_data["error"])
            return dummy_data['analysis']

        session = bot.get_session_data(
            request.year,
            request.grand_prix,
            request.session
        )
        
        analysis = bot.compare_drivers(
            session,
            request.driver1,
            request.driver2
        )

        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get(
        "/year-data/{year}",
        response_model=YearDataResponse
)
async def get_year_data(year: int):
    try:
        drivers, driver_names = get_drivers_from_first_race(year)
        schedule = get_event_schedule_cached(year)

        return YearDataResponse(
            grand_prix=schedule['EventName'].tolist(),
            sessions=['FP1', 'FP2', 'FP3', 'Q1', 'Q2', 'Q3', 'R'],
            drivers=drivers,
            driver_names=driver_names
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
        "/year-calendar/{year}",
        response_model=YearCalendarResponse
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
    tags=["Sessions"]
)
async def get_session_drivers(
    year: int,
    session: str,
    grand_prix: str = Depends(normalize_grand_prix),
):
    try:
        session_data = fastf1.get_session(year, grand_prix, session)
        session_data.load()

        results = session_data.results
        drivers = sorted(list(set(results['Abbreviation'].tolist())))

        return SessionDriversResponse(
            grand_prix=grand_prix,
            year=year,
            drivers=drivers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 