
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TaskType = Literal[
    "irrigation",
    "fertilization",
    "weeding",
    "pest_control",
    "harvesting",
    "other",
]

TaskStatus = Literal["pending", "completed"]

TaskPriority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    crop_id: int = Field(gt=0)

    title: str = Field(min_length=1, max_length=150)

    task_type: TaskType = "other"

    description: str | None = None

    due_date: date

    status: TaskStatus = "pending"

    priority: TaskPriority = "medium"


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    task_type: TaskType | None = None

    description: str | None = None

    due_date: date | None = None

    status: TaskStatus | None = None

    priority: TaskPriority | None = None


class TaskResponse(TaskCreate):
    id: int
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
