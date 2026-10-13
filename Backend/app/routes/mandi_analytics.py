
from datetime import date
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.mandi_price import MandiPrice

from app.schemas.mandi_analytics import (
    PriceHistoryPoint,
    PriceHistoryResponse,
    MarketComparisonItem,
    MarketComparisonResponse,
)


router = APIRouter(
    prefix="/api/mandi",
    tags=["Mandi Analytics"],
)


# 1. PRICE HISTORY
@router.get(
    "/history",
    response_model=PriceHistoryResponse,
)
def get_price_history(
    state: str = Query(default="Bihar"),
    district: str = Query(min_length=1),
    market: str = Query(min_length=1),
    commodity: str = Query(min_length=1),
    variety: str = Query(default="Other"),

    start_date: date | None = None,
    end_date: date | None = None,

    db: Session = Depends(get_db),
):
    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        raise HTTPException(
            status_code=422,
            detail="start_date cannot exceed end_date",
        )

    filters = [
        func.lower(MandiPrice.state)
        == state.strip().lower(),

        func.lower(MandiPrice.district)
        == district.strip().lower(),

        func.lower(MandiPrice.market)
        == market.strip().lower(),

        func.lower(MandiPrice.commodity)
        == commodity.strip().lower(),

        func.lower(MandiPrice.variety)
        == variety.strip().lower(),
    ]

    if start_date is not None:
        filters.append(
            MandiPrice.arrival_date >= start_date
        )

    if end_date is not None:
        filters.append(
            MandiPrice.arrival_date <= end_date
        )

    query = (
        select(MandiPrice)
        .where(*filters)
        .order_by(
            MandiPrice.arrival_date.asc(),
            MandiPrice.id.asc(),
        )
        .limit(1000)
    )

    records = db.scalars(query).all()

    points = [
        PriceHistoryPoint(
            date=record.arrival_date,
            min_price=record.min_price,
            max_price=record.max_price,
            modal_price=record.modal_price,
        )
        for record in records
    ]

    first_price = None
    latest_price = None
    price_change = None
    percentage_change = None

    if records:
        first_price = records[0].modal_price
        latest_price = records[-1].modal_price

        price_change = latest_price - first_price

        if first_price != 0:
            percentage_change = (
                price_change / first_price
            ) * Decimal("100")

            percentage_change = (
                percentage_change.quantize(
                    Decimal("0.01")
                )
            )

    return PriceHistoryResponse(
        state=state,
        district=district,
        market=market,
        commodity=commodity,
        variety=variety,
        points=points,
        first_price=first_price,
        latest_price=latest_price,
        price_change=price_change,
        percentage_change=percentage_change,
    )


# 2. MARKET COMPARISON
@router.get(
    "/compare",
    response_model=MarketComparisonResponse,
)
def compare_markets(
    commodity: str = Query(min_length=1),
    state: str = Query(default="Bihar"),
    district: str | None = None,
    variety: str | None = None,

    db: Session = Depends(get_db),
):
    filters = [
        func.lower(MandiPrice.state)
        == state.strip().lower(),

        func.lower(MandiPrice.commodity)
        == commodity.strip().lower(),
    ]

    if district:
        filters.append(
            func.lower(MandiPrice.district)
            == district.strip().lower()
        )

    if variety:
        filters.append(
            func.lower(MandiPrice.variety)
            == variety.strip().lower()
        )

    # Rank records inside each market + variety
    # so the newest observation gets row number 1.
    ranked = (
        select(
            MandiPrice.id.label("price_id"),
            func.row_number().over(
                partition_by=[
                    MandiPrice.state,
                    MandiPrice.district,
                    MandiPrice.market,
                    MandiPrice.commodity,
                    MandiPrice.variety,
                ],
                order_by=[
                    MandiPrice.arrival_date.desc(),
                    MandiPrice.id.desc(),
                ],
            ).label("row_num"),
        )
        .where(*filters)
        .subquery()
    )

    query = (
        select(MandiPrice)
        .join(
            ranked,
            MandiPrice.id == ranked.c.price_id,
        )
        .where(ranked.c.row_num == 1)
        .order_by(
            MandiPrice.modal_price.desc(),
            MandiPrice.market.asc(),
        )
        .limit(100)
    )

    records = db.scalars(query).all()

    markets = [
        MarketComparisonItem(
            district=record.district,
            market=record.market,
            commodity=record.commodity,
            variety=record.variety,
            arrival_date=record.arrival_date,
            min_price=record.min_price,
            max_price=record.max_price,
            modal_price=record.modal_price,
        )
        for record in records
    ]

    return MarketComparisonResponse(
        state=state,
        commodity=commodity,
        variety=variety,
        total=len(markets),
        markets=markets,
    )
