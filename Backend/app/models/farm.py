
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    area = Column(Float, nullable=False)
    soil_type = Column(String(100), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="farms")
    crops = relationship(
    "Crop",
    back_populates="farm",
    cascade="all, delete-orphan",
    )
