from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "F1 Analyst API"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    # Cache settings
    EVENT_SCHEDULE_CACHE_SIZE: int = 50
    EVENT_SCHEDULE_CACHE_TTL: int = 3600  # 1 hour
    SESSION_DATA_CACHE_SIZE: int = 100
    SESSION_DATA_CACHE_TTL: int = 1800  # 30 minutes
    DRIVER_COMPARISON_CACHE_SIZE: int = 50
    DRIVER_COMPARISON_CACHE_TTL: int = 1800  # 30 minutes
    
    # Environment settings
    USE_DUMMY_DATA: bool = True

    OPENAI_API_KEY: str 
    OPENAI_MODEL: str

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings() 