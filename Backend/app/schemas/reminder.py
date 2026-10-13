
from datetime import date
from typing import Literal

from pydantic import BaseModel


ReminderType = Literal[
    "overdue",
    "today",
    "upcoming",
]


class ReminderResponse(BaseModel):
    task_id: int
    crop_id: int
    crop_name: str
    farm_name: str

    title: str
    task_type: str
    due_date: date
    priority: str

    reminder_type: ReminderType
    days_until_due: int


class ReminderSummary(BaseModel):
    overdue: int
    today: int
    upcoming: int
    total: int


class ReminderListResponse(BaseModel):
    summary: ReminderSummary
    reminders: list[ReminderResponse]
