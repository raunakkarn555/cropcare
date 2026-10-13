
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET_KEY,
    JWT_ALGORITHM
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    email = str(user.email).lower()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    email = str(user.email).lower()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if not existing or not verify_password(
        user.password,
        existing.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return TokenResponse(
        access_token=create_access_token(existing.id)
    )


@router.get("/me", response_model=UserResponse)
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
