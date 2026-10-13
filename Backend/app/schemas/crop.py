
from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


CropStatus = Literal[
    "planned",
    "growing",
    "harvested",
    "cancelled",
]


class CropCreate(BaseModel):
    farm_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    variety: str | None = Field(default=None, max_length=100)
    area: float = Field(gt=0)

    sowing_date: date
    expected_harvest_date: date | None = None

    status: CropStatus = "planned"
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.expected_harvest_date is not None
            and self.expected_harvest_date < self.sowing_date
        ):
            raise ValueError(
                "Harvest date cannot be before sowing date"
            )
        return self


class CropUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    variety: str | None = Field(default=None, max_length=100)
    area: float | None = Field(default=None, gt=0)

    sowing_date: date | None = None
    expected_harvest_date: date | None = None

    status: CropStatus | None = None
    notes: str | None = None


class CropResponse(CropCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
