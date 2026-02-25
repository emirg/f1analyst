from cachetools import TTLCache
from app.core.config import settings
from app.services.calendar import CalendarService
from app.agent.f1_analysis_bot import F1AnalysisBot
from app.services.cache_manager import get_cache_manager

_agent_service_instance = None

class AgentService:
    def __init__(self):
        self.bot = None if settings.USE_DUMMY_DATA else F1AnalysisBot()
        self.calendar_service = CalendarService()
        self.cache_manager = get_cache_manager()

    def get_dummy_data(self):
        # Implement dummy data logic here
        return {
            "analysis": "This is a dummy analysis for testing purposes."
        }

    async def compare_drivers(
        self,
        year: int,
        grand_prix: str,
        session: str,
        driver1: str,
        driver2: str
    ) -> str:
        # Create a cache key using the global cache manager
        cache_key = self.cache_manager.generate_cache_key(year, grand_prix, session, driver1, driver2)
        
        # Check if we have a cached comparison
        cached_result = self.cache_manager.get_comparison(cache_key)
        if cached_result is not None:
            return cached_result

        # Get session data with telemetry only if needed for detailed analysis
        session_data = await self.calendar_service.get_session_data(year, grand_prix, session, load_telemetry=True)
        
        # Compare drivers
        analysis = self.bot.compare_drivers(
            session_data,
            driver1,
            driver2
        )
        
        # Cache the result using global cache manager
        self.cache_manager.set_comparison(cache_key, analysis)
        
        return analysis 

def get_agent_service() -> AgentService:
    global _agent_service_instance
    if _agent_service_instance is None:
        _agent_service_instance = AgentService()
    return _agent_service_instance