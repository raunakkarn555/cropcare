
import calendar as pycalendar

from collections import defaultdict
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task

from app.schemas.calendar import (
    CalendarDay,
    CalendarMonth,
    CalendarWeek,
    CalendarSummary,
)


router = APIRouter(
    prefix="/api/calendar",
    tags=["Calendar"],
)

# CropCare currently uses Indian local dates.
LOCAL_TIMEZONE = ZoneInfo("Asia/Kolkata")


def get_user_tasks(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
):
    query = (
        select(Task)
        .join(Crop, Task.crop_id == Crop.id)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(
            Farm.user_id == user_id,
            Task.due_date >= start_date,
            Task.due_date <= end_date,
        )
        .order_by(Task.due_date, Task.id)
    )

    return db.scalars(query).all()


def group_tasks_by_date(tasks, start_date, end_date):
    grouped = defaultdict(list)

    for task in tasks:
        grouped[task.due_date].append(task)

    days = []
    current = start_date

    while current <= end_date:
        days.append(
            CalendarDay(
                date=current,
                tasks=grouped[current],
            )
        )

        current += timedelta(days=1)

    return days


# 1. MONTH VIEW
@router.get(
    "/month",
    response_model=CalendarMonth,
)
def get_month_calendar(
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_day = pycalendar.monthrange(year, month)[1]

    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    tasks = get_user_tasks(
        db,
        current_user.id,
        start_date,
        end_date,
    )

    return CalendarMonth(
        year=year,
        month=month,
        days=group_tasks_by_date(
            tasks, start_date, end_date
        ),
    )


# 2. WEEK VIEW
@router.get(
    "/week",
    response_model=CalendarWeek,
)
def get_week_calendar(
    start_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Normalize to Monday of the selected week
    monday = start_date - timedelta(
        days=start_date.weekday()
    )

    sunday = monday + timedelta(days=6)

    tasks = get_user_tasks(
        db,
        current_user.id,
        monday,
        sunday,
    )

    return CalendarWeek(
        start_date=monday,
        end_date=sunday,
        days=group_tasks_by_date(
            tasks, monday, sunday
        ),
    )


# 3. DAY VIEW
@router.get(
    "/day",
    response_model=CalendarDay,
)
def get_day_calendar(
    selected_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = get_user_tasks(
        db,
        current_user.id,
        selected_date,
        selected_date,
    )

    return CalendarDay(
        date=selected_date,
        tasks=tasks,
    )


# 4. MONTH SUMMARY
@router.get(
    "/summary",
    response_model=CalendarSummary,
)
def get_calendar_summary(
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_day = pycalendar.monthrange(year, month)[1]

    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    tasks = get_user_tasks(
        db,
        current_user.id,
        start_date,
        end_date,
    )

    today = datetime.now(LOCAL_TIMEZONE).date()

    total = len(tasks)

    completed = sum(
        task.status == "completed"
        for task in tasks
    )

    pending = sum(
        task.status == "pending"
        for task in tasks
    )

    overdue = sum(
        task.status == "pending"
        and task.due_date < today
        for task in tasks
    )

    return CalendarSummary(
        year=year,
        month=month,
        total=total,
        pending=pending,
        completed=completed,
        overdue=overdue,
    )
