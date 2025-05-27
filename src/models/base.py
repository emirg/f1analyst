from pydantic import BaseModel, ConfigDict

class BaseResponse(BaseModel):
    """Base response model with common configurations"""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "message": "Success"
            }
        }
    ) 