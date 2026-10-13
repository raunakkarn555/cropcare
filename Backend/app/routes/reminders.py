
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task

from app.schemas.reminder import (
    ReminderResponse,
    ReminderSummary,
    ReminderListResponse,
)


router = APIRouter(
    prefix="/api/reminders",
    tags=["Reminders"],
)

LOCAL_TIMEZONE = ZoneInfo("Asia/Kolkata")


def get_today() -> date:
    return datetime.now(LOCAL_TIMEZONE).date()


def fetch_reminders(
    db: Session,
    user_id: int,
    days_ahead: int = 7,
):
    today = get_today()
    last_date = today + timedelta(days=days_ahead)

    query = (
        select(Task, Crop, Farm)
        .join(Crop, Task.crop_id == Crop.id)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(
            Farm.user_id == user_id,
            Task.status == "pending",
            Task.due_date <= last_date,
        )
        .order_by(
            Task.due_date.asc(),
            Task.id.asc(),
        )
    )

    rows = db.execute(query).all()

    reminders = []

    for task, crop, farm in rows:
        days_until_due = (task.due_date - today).days

        if days_until_due < 0:
            reminder_type = "overdue"
        elif days_until_due == 0:
            reminder_type = "today"
        else:
            reminder_type = "upcoming"

        reminders.append(
            ReminderResponse(
                task_id=task.id,
                crop_id=crop.id,
                crop_name=crop.name,
                farm_name=farm.name,
                title=task.title,
                task_type=task.task_type,
                due_date=task.due_date,
                priority=task.priority,
                reminder_type=reminder_type,
                days_until_due=days_until_due,
            )
        )

    return reminders


def build_summary(reminders):
    overdue = sum(
        r.reminder_type == "overdue"
        for r in reminders
    )

    today = sum(
        r.reminder_type == "today"
        for r in reminders
    )

    upcoming = sum(
        r.reminder_type == "upcoming"
        for r in reminders
    )

    return ReminderSummary(
        overdue=overdue,
        today=today,
        upcoming=upcoming,
        total=len(reminders),
    )


# 1. ALL ACTIVE REMINDERS
@router.get(
    "",
    response_model=ReminderListResponse,
)
def list_reminders(
    days_ahead: int = Query(
        default=7,
        ge=1,
        le=30,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminders = fetch_reminders(
        db,
        current_user.id,
        days_ahead,
    )

    return ReminderListResponse(
        summary=build_summary(reminders),
        reminders=reminders,
    )


# 2. OVERDUE REMINDERS
@router.get(
    "/overdue",
    response_model=list[ReminderResponse],
)
def overdue_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminders = fetch_reminders(
        db,
        current_user.id,
    )

    return [
        r for r in reminders
        if r.reminder_type == "overdue"
    ]


# 3. TODAY'S REMINDERS
@router.get(
    "/today",
    response_model=list[ReminderResponse],
)
def today_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminders = fetch_reminders(
        db,
        current_user.id,
    )

    return [
        r for r in reminders
        if r.reminder_type == "today"
    ]


# 4. UPCOMING REMINDERS
@router.get(
    "/upcoming",
    response_model=list[ReminderResponse],
)
def upcoming_reminders(
    days_ahead: int = Query(
        default=7,
        ge=1,
        le=30,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminders = fetch_reminders(
        db,
        current_user.id,
        days_ahead,
    )

    return [
        r for r in reminders
        if r.reminder_type == "upcoming"
    ]


# 5. REMINDER SUMMARY
@router.get(
    "/summary",
    response_model=ReminderSummary,
)
def reminder_summary(
    days_ahead: int = Query(
        default=7,
        ge=1,
        le=30,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminders = fetch_reminders(
        db,
        current_user.id,
        days_ahead,
    )

    return build_summary(reminders)
