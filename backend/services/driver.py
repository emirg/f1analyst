from cachetools import LRUCache, cachedmethod  
from operator import attrgetter
import fastf1

class DriverService:
    def __init__(self):
        self._cache = LRUCache(maxsize=50)
        # Enable FastF1 cache
        fastf1.Cache.enable_cache('data/cache')
    
    @cachedmethod(attrgetter('_cache'))
    def get_drivers_from_first_race(self, year: int) -> tuple[list[str], list[str]]:
        try:
            schedule = fastf1.get_event_schedule(year)
            for _, event in schedule.iterrows():
                try:
                    session = fastf1.get_session(year, event['RoundNumber'], 'R')
                    session.load(telemetry=False, laps=False, weather=False, messages=False)
                    if session.results is not None:
                        drivers = session.results['Abbreviation'].unique().tolist()
                        names = session.results['FullName'].unique().tolist()
                        return drivers, names
                except Exception:
                    continue
            return [], []
        except Exception:
            return [], []
        
    def get_drivers_abbreviations_from_session(self, session: fastf1.core.Session | None) -> list[str]:
        if session is None or session.results is None:
            return []
        return sorted(list(set(session.results['Abbreviation'].tolist())))
    
    def get_drivers_names_from_session(self, session: fastf1.core.Session | None) -> list[str]:
        if session is None or session.results is None:
            return []
        return session.results['FullName'].unique().tolist()