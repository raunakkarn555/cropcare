
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.schemas.farm import (
    FarmCreate,
    FarmUpdate,
    FarmResponse,
)


router = APIRouter(
    prefix="/api/farms",
    tags=["Farms"],
)


def get_owned_farm(
    farm_id: int,
    user_id: int,
    db: Session,
) -> Farm:
    farm = db.scalar(
        select(Farm).where(
            Farm.id == farm_id,
            Farm.user_id == user_id,
        )
    )

    if farm is None:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    return farm


# CREATE FARM
@router.post(
    "",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_farm(
    data: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = Farm(
        **data.model_dump(),
        user_id=current_user.id,
    )

    db.add(farm)
    db.commit()
    db.refresh(farm)

    return farm


# LIST MY FARMS
@router.get("", response_model=list[FarmResponse])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Farm)
        .where(Farm.user_id == current_user.id)
        .order_by(Farm.id.desc())
    ).all()


# GET ONE FARM
@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_farm(farm_id, current_user.id, db)


# UPDATE FARM
@router.patch("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: int,
    data: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = get_owned_farm(farm_id, current_user.id, db)

    updates = data.model_dump(exclude_unset=True)

    # Required fields must not become NULL
    for field in ("name", "location", "area"):
        if field in updates and updates[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null",
            )

    for field, value in updates.items():
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)

    return farm


# DELETE FARM
@router.delete(
    "/{farm_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = get_owned_farm(farm_id, current_user.id, db)

    db.delete(farm)
    db.commit()
