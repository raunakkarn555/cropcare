
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class MandiPriceResponse(BaseModel):
    id: int

    state: str
    district: str
    market: str

    commodity: str
    variety: str

    arrival_date: date

    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MandiPriceListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[MandiPriceResponse]
