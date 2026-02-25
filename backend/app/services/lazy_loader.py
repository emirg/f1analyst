import asyncio
from typing import Dict, Any, Optional
import fastf1
from concurrent.futures import ThreadPoolExecutor
from app.services.cache_manager import get_cache_manager

class LazySessionLoader:
    """
    Loads F1 session data lazily and in parallel when possible.
    Prioritizes the most commonly needed data first.
    """
    
    def __init__(self):
        self.cache_manager = get_cache_manager()
        self.executor = ThreadPoolExecutor(max_workers=2)  # Limit concurrent loads
        self.loading_tasks: Dict[str, asyncio.Task] = {}
    
    async def preload_session_basics(self, year: int, grand_prix: str, session: str) -> None:
        """
        Preload basic session data in the background without telemetry
        """
        cache_key = self.cache_manager.generate_cache_key(year, grand_prix, session, False)
        
        if self.cache_manager.get_session_data(cache_key) is not None:
            return  # Already cached
        
        # Check if already loading
        if cache_key in self.loading_tasks:
            return
        
        # Start background loading task
        task = asyncio.create_task(self._load_basic_data(year, grand_prix, session, cache_key))
        self.loading_tasks[cache_key] = task
        
        # Don't await - let it load in background
        task.add_done_callback(lambda t: self.loading_tasks.pop(cache_key, None))
    
    async def _load_basic_data(self, year: int, grand_prix: str, session: str, cache_key: str) -> None:
        """Load basic session data in a separate thread"""
        try:
            loop = asyncio.get_event_loop()
            session_data = await loop.run_in_executor(
                self.executor,
                self._sync_load_basic,
                year, grand_prix, session
            )
            
            if session_data:
                self.cache_manager.set_session_data(cache_key, session_data)
                print(f"Preloaded basic data for {year} {grand_prix} {session}")
        except Exception as e:
            print(f"Failed to preload basic data: {str(e)}")
    
    def _sync_load_basic(self, year: int, grand_prix: str, session: str) -> Optional[Any]:
        """Synchronous basic data loading"""
        try:
            session_data = fastf1.get_session(year, grand_prix, session)
            session_data.load(telemetry=False, laps=True, weather=False, messages=False)
            return session_data
        except Exception as e:
            print(f"Error in sync load: {str(e)}")
            return None
    
    async def get_session_with_preload(self, year: int, grand_prix: str, session: str, load_telemetry: bool = False):
        """
        Get session data, using preloaded basic data when possible
        """
        basic_cache_key = self.cache_manager.generate_cache_key(year, grand_prix, session, False)
        full_cache_key = self.cache_manager.generate_cache_key(year, grand_prix, session, load_telemetry)
        
        # If we need telemetry, check if full data is cached
        if load_telemetry:
            full_data = self.cache_manager.get_session_data(full_cache_key)
            if full_data is not None:
                return full_data
        
        # Check if basic data is cached (or being loaded)
        basic_data = self.cache_manager.get_session_data(basic_cache_key)
        if basic_data is not None and not load_telemetry:
            return basic_data
        
        # If basic data is loading, wait for it
        if basic_cache_key in self.loading_tasks:
            await self.loading_tasks[basic_cache_key]
            basic_data = self.cache_manager.get_session_data(basic_cache_key)
            if basic_data is not None and not load_telemetry:
                return basic_data
        
        # Need to load fresh data
        print(f"Loading F1 session: {year} {grand_prix} {session} (telemetry: {load_telemetry})")
        session_data = fastf1.get_session(year, grand_prix, session)
        
        if load_telemetry:
            session_data.load(telemetry=True, laps=True, weather=True, messages=False)
            self.cache_manager.set_session_data(full_cache_key, session_data)
        else:
            session_data.load(telemetry=False, laps=True, weather=False, messages=False)
            self.cache_manager.set_session_data(basic_cache_key, session_data)
        
        return session_data

# Global lazy loader instance
_lazy_loader = None

def get_lazy_loader() -> LazySessionLoader:
    """Get the global lazy loader instance"""
    global _lazy_loader
    if _lazy_loader is None:
        _lazy_loader = LazySessionLoader()
    return _lazy_loader