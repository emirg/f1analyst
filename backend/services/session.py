from cachetools import LRUCache, cachedmethod  
from operator import attrgetter
import fastf1

class SessionService:
    def __init__(self):
        self._cache = LRUCache(maxsize=50)
        # Enable FastF1 cache
        fastf1.Cache.enable_cache('data/cache')

    @cachedmethod(attrgetter('_cache'))
    def get_session_data(self, year: int, gp: str, session: str) -> fastf1.core.Session: # TODO: Refactor. This function should be in another file.
        """Fetch session data for a specific Grand Prix"""
        try:
            session = fastf1.get_session(year, gp, session)
            session.load()
            return session
        except Exception as e:
            print(f"Error loading session data: {str(e)}")
            print("Please ensure you're using a valid year, Grand Prix name, and session type.")
            print("Example: year=2025, gp='Monaco', session='FP1'")
            raise
