from cachetools import TTLCache
from app.core.config import settings
from app.services.calendar import CalendarService
from app.agent.f1_analysis_bot import F1AnalysisBot

class AgentService:
    def __init__(self):
        self.bot = None if settings.USE_DUMMY_DATA else F1AnalysisBot()
        self.calendar_service = CalendarService()
        self.driver_comparison_cache = TTLCache(
            maxsize=settings.DRIVER_COMPARISON_CACHE_SIZE,
            ttl=settings.DRIVER_COMPARISON_CACHE_TTL
        )

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
        # Create a cache key
        cache_key = f"{year}_{grand_prix}_{session}_{driver1}_{driver2}"
        
        # Check if we have a cached comparison
        if cache_key in self.driver_comparison_cache:
            return self.driver_comparison_cache[cache_key]

        # Get session data
        session_data = await self.calendar_service.get_session_data(year, grand_prix, session)
        
        # Compare drivers
        analysis = self.bot.compare_drivers(
            session_data,
            driver1,
            driver2
        )
        
        # Cache the result
        self.driver_comparison_cache[cache_key] = analysis
        
        return analysis 