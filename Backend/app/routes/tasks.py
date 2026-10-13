
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.task import Task
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
)


router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
)


# Verify that the crop belongs to the logged-in user
def get_owned_crop(
    crop_id: int,
    user_id: int,
    db: Session,
) -> Crop:

    crop = db.scalar(
        select(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(
            Crop.id == crop_id,
            Farm.user_id == user_id,
        )
    )

    if crop is None:
        raise HTTPException(
            status_code=404,
            detail="Crop not found",
        )

    return crop


# Verify that the task belongs to the logged-in user
def get_owned_task(
    task_id: int,
    user_id: int,
    db: Session,
) -> Task:

    task = db.scalar(
        select(Task)
        .join(Crop, Task.crop_id == Crop.id)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(
            Task.id == task_id,
            Farm.user_id == user_id,
        )
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


# 1. CREATE TASK
@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    get_owned_crop(
        data.crop_id,
        current_user.id,
        db,
    )

    # A new task always starts as pending.
    task_data = data.model_dump(
        exclude={"status"}
    )

    task = Task(
        **task_data,
        status="pending",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# 2. LIST TASKS
@router.get(
    "",
    response_model=list[TaskResponse],
)
def list_tasks(
    crop_id: int | None = Query(default=None, gt=0),
    due_date: date | None = None,
    task_status: Literal[
        "pending", "completed"
    ] | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    query = (
        select(Task)
        .join(Crop, Task.crop_id == Crop.id)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(Farm.user_id == current_user.id)
    )

    if crop_id is not None:
        query = query.where(Task.crop_id == crop_id)

    if due_date is not None:
        query = query.where(Task.due_date == due_date)

    if task_status is not None:
        query = query.where(Task.status == task_status)

    query = query.order_by(
        Task.due_date.asc(),
        Task.id.asc(),
    )

    return db.scalars(query).all()


# 3. GET ONE TASK
@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_owned_task(
        task_id,
        current_user.id,
        db,
    )


# 4. UPDATE TASK
@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    task = get_owned_task(
        task_id,
        current_user.id,
        db,
    )

    updates = data.model_dump(exclude_unset=True)

    required_fields = (
        "title",
        "task_type",
        "due_date",
        "status",
        "priority",
    )

    for field in required_fields:
        if field in updates and updates[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null",
            )

    # Keep completion timestamp consistent with status
    if "status" in updates:
        new_status = updates["status"]

        if new_status == "completed":
            if task.status != "completed":
                task.completed_at = datetime.now(
                    timezone.utc
                )
        else:
            task.completed_at = None

    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


# 5. MARK TASK COMPLETED
@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    task = get_owned_task(
        task_id,
        current_user.id,
        db,
    )

    if task.status != "completed":
        task.status = "completed"
        task.completed_at = datetime.now(
            timezone.utc
        )

        db.commit()
        db.refresh(task)

    return task


# 6. DELETE TASK
@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    task = get_owned_task(
        task_id,
        current_user.id,
        db,
    )

    db.delete(task)
    db.commit()
