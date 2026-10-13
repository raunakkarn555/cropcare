
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Numeric,
    UniqueConstraint,
    Index,
)

from app.database import Base


class MandiPrice(Base):
    __tablename__ = "mandi_prices"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    state = Column(
        String(100),
        nullable=False,
    )

    district = Column(
        String(100),
        nullable=False,
    )

    market = Column(
        String(150),
        nullable=False,
    )

    commodity = Column(
        String(100),
        nullable=False,
    )

    variety = Column(
        String(100),
        nullable=False,
        default="Other",
    )

    arrival_date = Column(
        Date,
        nullable=False,
    )

    min_price = Column(
        Numeric(12, 2),
        nullable=False,
    )

    max_price = Column(
        Numeric(12, 2),
        nullable=False,
    )

    modal_price = Column(
        Numeric(12, 2),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint(
            "state",
            "district",
            "market",
            "commodity",
            "variety",
            "arrival_date",
            name="uq_mandi_price_record",
        ),
        Index(
            "ix_mandi_prices_lookup",
            "state",
            "district",
            "commodity",
            "arrival_date",
        ),
    )
