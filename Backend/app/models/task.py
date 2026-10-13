
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    crop_id = Column(
        Integer,
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(150), nullable=False)

    task_type = Column(
        String(50),
        nullable=False,
        default="other",
    )

    description = Column(Text, nullable=True)

    due_date = Column(Date, nullable=False, index=True)

    status = Column(
        String(20),
        nullable=False,
        default="pending",
    )

    priority = Column(
        String(20),
        nullable=False,
        default="medium",
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    crop = relationship(
        "Crop",
        back_populates="tasks",
    )
