
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)

    farm_id = Column(
        Integer,
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)

    # Area measured in acres
    area = Column(Float, nullable=False)

    sowing_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)

    status = Column(
        String(30),
        nullable=False,
        default="planned",
    )

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    farm = relationship("Farm", back_populates="crops")
    
    tasks = relationship(
    "Task",
    back_populates="crop",
    cascade="all, delete-orphan",
    )
