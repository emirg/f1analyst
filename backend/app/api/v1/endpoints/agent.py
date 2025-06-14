from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.schemas.f1 import CompareDriversRequest, DriverComparisonResponse
from app.services.agent import AgentService, get_agent_service
from app.core.config import settings

router = APIRouter()

@router.post(
    "/compare-drivers",
    response_model=DriverComparisonResponse,
    response_class=JSONResponse,
    tags=["Agent"]
)
async def compare_drivers(
    request: CompareDriversRequest,
    agent_service: AgentService = Depends(get_agent_service)
):
    try:
        if settings.USE_DUMMY_DATA:
            dummy_data = agent_service.get_dummy_data()
            if "error" in dummy_data:
                raise HTTPException(status_code=500, detail=dummy_data["error"])
            return DriverComparisonResponse(analysis=dummy_data['analysis'])

        analysis = await agent_service.compare_drivers(
            request.year,
            request.grand_prix,
            request.session,
            request.driver1,
            request.driver2
        )
        
        return DriverComparisonResponse(analysis=analysis)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 