
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.schemas.crop import (
    CropCreate,
    CropUpdate,
    CropResponse,
)


router = APIRouter(
    prefix="/api/crops",
    tags=["Crops"],
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


# CREATE CROP
@router.post(
    "",
    response_model=CropResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_crop(
    data: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = get_owned_farm(
        data.farm_id,
        current_user.id,
        db,
    )

    if data.area > farm.area:
        raise HTTPException(
            status_code=422,
            detail="Crop area cannot exceed farm area",
        )

    crop = Crop(**data.model_dump())

    db.add(crop)
    db.commit()
    db.refresh(crop)

    return crop


# LIST CROPS
@router.get("", response_model=list[CropResponse])
def list_crops(
    farm_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Crop)
        .join(Farm, Crop.farm_id == Farm.id)
        .where(Farm.user_id == current_user.id)
    )

    if farm_id is not None:
        query = query.where(Crop.farm_id == farm_id)

    query = query.order_by(Crop.id.desc())

    return db.scalars(query).all()


# GET CROP
@router.get("/{crop_id}", response_model=CropResponse)
def get_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_crop(crop_id, current_user.id, db)


# UPDATE CROP
@router.patch("/{crop_id}", response_model=CropResponse)
def update_crop(
    crop_id: int,
    data: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop = get_owned_crop(crop_id, current_user.id, db)

    updates = data.model_dump(exclude_unset=True)

    required_fields = (
        "name",
        "area",
        "sowing_date",
        "status",
    )

    for field in required_fields:
        if field in updates and updates[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null",
            )

    new_area = updates.get("area", crop.area)
    new_sowing = updates.get(
        "sowing_date", crop.sowing_date
    )
    new_harvest = updates.get(
        "expected_harvest_date",
        crop.expected_harvest_date,
    )

    farm = get_owned_farm(
        crop.farm_id,
        current_user.id,
        db,
    )

    if new_area > farm.area:
        raise HTTPException(
            status_code=422,
            detail="Crop area cannot exceed farm area",
        )

    if new_harvest is not None and new_harvest < new_sowing:
        raise HTTPException(
            status_code=422,
            detail="Harvest date cannot be before sowing date",
        )

    for field, value in updates.items():
        setattr(crop, field, value)

    db.commit()
    db.refresh(crop)

    return crop


# DELETE CROP
@router.delete(
    "/{crop_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop = get_owned_crop(crop_id, current_user.id, db)

    db.delete(crop)
    db.commit()
