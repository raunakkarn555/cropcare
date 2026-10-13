
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FarmCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=255)
    area: float = Field(gt=0)
    soil_type: str | None = Field(default=None, max_length=100)


class FarmUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    location: str | None = Field(default=None, min_length=1, max_length=255)
    area: float | None = Field(default=None, gt=0)
    soil_type: str | None = Field(default=None, max_length=100)


class FarmResponse(FarmCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
