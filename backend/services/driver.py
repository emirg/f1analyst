from cachetools import LRUCache, cachedmethod  
from operator import attrgetter
import fastf1

class DriverService:
    def __init__(self):
        self._cache = LRUCache(maxsize=50)
        # Enable FastF1 cache
        fastf1.Cache.enable_cache('data/cache')
    
    @cachedmethod(attrgetter('_cache'))
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