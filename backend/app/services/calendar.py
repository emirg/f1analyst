import fastf1
import fastf1.events
import pandas as pd
from cachetools import TTLCache
from app.core.config import settings
from app.schemas.f1 import GPSessionsResponse, SessionInfo
from app.services.cache_manager import get_cache_manager

_calendar_service_instance = None

class CalendarService:
    def __init__(self):
        self.event_schedule_cache = TTLCache(
            maxsize=settings.EVENT_SCHEDULE_CACHE_SIZE,
            ttl=settings.EVENT_SCHEDULE_CACHE_TTL
        )
        # Use global cache manager for better coordination
        self.cache_manager = get_cache_manager()

    async def get_event_schedule(self, year: int) -> pd.DataFrame:
        cache_key = str(year)
        if cache_key in self.event_schedule_cache:
            return self.event_schedule_cache[cache_key]
        
        schedule = fastf1.get_event_schedule(year)
        self.event_schedule_cache[cache_key] = schedule
        return schedule

    async def get_calendar(self, year: int):
        schedule = await self.get_event_schedule(year)
        return [
            {
                "round_number": int(event['RoundNumber']),
                "event_name": event['EventName'],
                "event_format": event['EventFormat']
            }
            for _, event in schedule.iterrows()
        ]

    async def get_gp_sessions(self, year: int, grand_prix: str) -> GPSessionsResponse:
        schedule = await self.get_event_schedule(year)
        event = schedule[schedule['EventName'] == grand_prix]
        
        if event.empty:
            raise ValueError(f"Grand Prix {grand_prix} not found for year {year}")
        
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

    async def get_session_data(self, year: int, grand_prix: str, session: str, load_telemetry: bool = False):
        """
        Get session data with optimized loading strategy.
        By default, only loads essential data for fast access.
        """
        cache_key = self.cache_manager.generate_cache_key(year, grand_prix, session, load_telemetry)
        
        # Check global cache first
        cached_session = self.cache_manager.get_session_data(cache_key)
        if cached_session is not None:
            return cached_session
        
        print(f"Loading F1 session data: {year} {grand_prix} {session} (telemetry: {load_telemetry})")
        session_data = fastf1.get_session(year, grand_prix, session)
        
        # Optimized loading: only load what's needed
        if load_telemetry:
            # Full load for detailed analysis
            session_data.load(
                telemetry=True,
                laps=True, 
                weather=True,
                messages=False  # Messages are rarely needed and slow
            )
        else:
            # Fast load for basic analysis
            session_data.load(
                telemetry=False,
                laps=True,
                weather=False,
                messages=False
            )
        
        # Cache using global cache manager
        self.cache_manager.set_session_data(cache_key, session_data)
        return session_data 
    
def get_calendar_service() -> CalendarService:
    global _calendar_service_instance
    if _calendar_service_instance is None:
        _calendar_service_instance = CalendarService()
    return _calendar_service_instance