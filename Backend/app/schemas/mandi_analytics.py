
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class PriceHistoryPoint(BaseModel):
    date: date
    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal


class PriceHistoryResponse(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: str

    points: list[PriceHistoryPoint]

    first_price: Decimal | None = None
    latest_price: Decimal | None = None
    price_change: Decimal | None = None
    percentage_change: Decimal | None = None


class MarketComparisonItem(BaseModel):
    district: str
    market: str
    commodity: str
    variety: str

    arrival_date: date

    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal


class MarketComparisonResponse(BaseModel):
    state: str
    commodity: str
    variety: str | None = None

    total: int = Field(ge=0)
    markets: list[MarketComparisonItem]
