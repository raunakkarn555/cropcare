
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import (
    select,
    func,
    or_,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.mandi_price import MandiPrice

from app.schemas.mandi_price import (
    MandiPriceResponse,
    MandiPriceListResponse,
)


router = APIRouter(
    prefix="/api/mandi",
    tags=["Mandi Prices"],
)


# 1. SEARCH AND FILTER PRICES
@router.get(
    "/prices",
    response_model=MandiPriceListResponse,
)
def get_mandi_prices(
    state: str | None = None,
    district: str | None = None,
    commodity: str | None = None,
    market: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,

    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),

    db: Session = Depends(get_db),
):
    filters = []

    if state:
        filters.append(
            func.lower(MandiPrice.state)
            == state.strip().lower()
        )

    if district:
        filters.append(
            func.lower(MandiPrice.district)
            == district.strip().lower()
        )

    if commodity:
        filters.append(
            func.lower(MandiPrice.commodity)
            == commodity.strip().lower()
        )

    if market:
        filters.append(
            func.lower(MandiPrice.market)
            == market.strip().lower()
        )

    if start_date:
        filters.append(
            MandiPrice.arrival_date >= start_date
        )

    if end_date:
        filters.append(
            MandiPrice.arrival_date <= end_date
        )

    total = db.scalar(
        select(func.count(MandiPrice.id))
        .where(*filters)
    ) or 0

    offset = (page - 1) * page_size

    query = (
        select(MandiPrice)
        .where(*filters)
        .order_by(
            MandiPrice.arrival_date.desc(),
            MandiPrice.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
    )

    results = db.scalars(query).all()

    return MandiPriceListResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=results,
    )


# 2. LATEST AVAILABLE PRICE PER MARKET + VARIETY
@router.get(
    "/latest",
    response_model=list[MandiPriceResponse],
)
def get_latest_prices(
    state: str = Query(default="Bihar"),
    district: str | None = None,
    commodity: str | None = None,
    db: Session = Depends(get_db),
):
    filters = [
        func.lower(MandiPrice.state)
        == state.strip().lower()
    ]

    if district:
        filters.append(
            func.lower(MandiPrice.district)
            == district.strip().lower()
        )

    if commodity:
        filters.append(
            func.lower(MandiPrice.commodity)
            == commodity.strip().lower()
        )

    # PostgreSQL DISTINCT ON:
    # keep the newest observation for each
    # state, district, market, commodity, variety.
    latest_ids = (
        select(MandiPrice.id)
        .where(*filters)
        .distinct(
            MandiPrice.state,
            MandiPrice.district,
            MandiPrice.market,
            MandiPrice.commodity,
            MandiPrice.variety,
        )
        .order_by(
            MandiPrice.state,
            MandiPrice.district,
            MandiPrice.market,
            MandiPrice.commodity,
            MandiPrice.variety,
            MandiPrice.arrival_date.desc(),
            MandiPrice.id.desc(),
        )
        .subquery()
    )

    query = (
        select(MandiPrice)
        .where(
            MandiPrice.id.in_(
                select(latest_ids.c.id)
            )
        )
        .order_by(
            MandiPrice.arrival_date.desc(),
            MandiPrice.market.asc(),
            MandiPrice.commodity.asc(),
        )
        .limit(100)
    )

    return db.scalars(query).all()


# 3. LIST AVAILABLE COMMODITIES
@router.get(
    "/commodities",
    response_model=list[str],
)
def get_commodities(
    state: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(
        MandiPrice.commodity
    ).distinct()

    if state:
        query = query.where(
            func.lower(MandiPrice.state)
            == state.strip().lower()
        )

    query = query.order_by(
        MandiPrice.commodity
    )

    return db.scalars(query).all()


# 4. LIST AVAILABLE DISTRICTS
@router.get(
    "/districts",
    response_model=list[str],
)
def get_districts(
    state: str = Query(default="Bihar"),
    db: Session = Depends(get_db),
):
    query = (
        select(MandiPrice.district)
        .where(
            func.lower(MandiPrice.state)
            == state.strip().lower()
        )
        .distinct()
        .order_by(MandiPrice.district)
    )

    return db.scalars(query).all()


# 5. LIST AVAILABLE MARKETS
@router.get(
    "/markets",
    response_model=list[str],
)
def get_markets(
    state: str = Query(default="Bihar"),
    district: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(
        MandiPrice.market
    ).where(
        func.lower(MandiPrice.state)
        == state.strip().lower()
    )

    if district:
        query = query.where(
            func.lower(MandiPrice.district)
            == district.strip().lower()
        )

    query = query.distinct().order_by(
        MandiPrice.market
    )

    return db.scalars(query).all()
