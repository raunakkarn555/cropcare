
from datetime import date
from pydantic import BaseModel, Field

from app.schemas.task import TaskResponse


class CalendarDay(BaseModel):
    date: date
    tasks: list[TaskResponse]


class CalendarMonth(BaseModel):
    year: int
    month: int
    days: list[CalendarDay]


class CalendarWeek(BaseModel):
    start_date: date
    end_date: date
    days: list[CalendarDay]


class CalendarSummary(BaseModel):
    year: int
    month: int
    total: int = Field(ge=0)
    pending: int = Field(ge=0)
    completed: int = Field(ge=0)
    overdue: int = Field(ge=0)
