from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api.v1.endpoints import agent, calendar

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(agent.router, prefix=f"{settings.API_V1_STR}/agent", tags=["Agent"])
app.include_router(calendar.router, prefix=f"{settings.API_V1_STR}/calendar", tags=["Calendar"])

@app.get("/")
async def root():
    return {"message": "Welcome to F1 Analyst API"} 