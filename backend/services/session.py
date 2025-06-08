from cachetools import LRUCache, cachedmethod  
from operator import attrgetter
import fastf1
import pandas as pd
from enum import Enum
from typing import Optional

class SessionDataProfile(Enum):
    """Different profiles for loading session data"""
    BASIC = "basic"  # Only essential data from laps for basic analysis
    STANDARD = "standard"  # Standard data including laps, telemetry and weather
    FULL = "full"  # All available data including messages

class SessionService:
    def __init__(self):
        self._cache = LRUCache(maxsize=50)
        fastf1.Cache.enable_cache('data/cache')

    def _get_load_params(self, profile: SessionDataProfile) -> dict:
        params = {
            SessionDataProfile.BASIC: {
                'telemetry': False,
                'laps': False,
                'weather': False,
                'messages': False
            },
            SessionDataProfile.STANDARD: {
                'telemetry': True,
                'laps': True,
                'weather': True,
                'messages': False
            },
            SessionDataProfile.FULL: {
                'telemetry': True,
                'laps': True,
                'weather': True,
                'messages': True
            }
        }
        return params[profile]

    @cachedmethod(attrgetter('_cache'))
    def get_session_data(self, year: int, gp: str, session: str) -> fastf1.core.Session:
        try:
            session = fastf1.get_session(year, gp, session)
            print(f"Loading session data for {year} {gp} {session}")
            session.load(**self._get_load_params(SessionDataProfile.BASIC))
            return session
        except Exception as e:
            self.print_exception_message(e)

    def get_basic_session_data(self, year: int, gp: str, session: str) -> fastf1.core.Session:
        try:
            session = fastf1.get_session(year, gp, session)
            session.load(**self._get_load_params(SessionDataProfile.BASIC))
            return session
        except Exception as e:
            self.print_exception_message(e)

    def get_standard_session_data(self, year: int, gp: str, session: str) -> fastf1.core.Session:
        try:
            session = fastf1.get_session(year, gp, session)
            session.load(**self._get_load_params(SessionDataProfile.STANDARD))
            return session
        except Exception as e:
            self.print_exception_message(e)

    def get_full_session_data(self, year: int, gp: str, session: str) -> fastf1.core.Session:
        try:
            session = fastf1.get_session(year, gp, session)
            session.load(**self._get_load_params(SessionDataProfile.FULL))
            return session
        except Exception as e:
            self.print_exception_message(e)

    def get_session_results(self, session: fastf1.core.Session) -> pd.DataFrame:
        if session.results is None:
            return pd.DataFrame()
        return session.results[['Abbreviation', 'FullName', 'Position', 'Points']]

    def print_exception_message(self, e: Exception) -> str:
        print(f"Error loading session data: {str(e)}")
        print("Please ensure you're using a valid year, Grand Prix name, and session type.")
        print("Example: year=2025, gp='Monaco Grand Prix', session='FP1'")
        raise