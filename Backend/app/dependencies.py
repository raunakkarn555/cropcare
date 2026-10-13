
import os

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            os.environ["JWT_SECRET_KEY"],
            algorithms=[os.getenv("JWT_ALGORITHM", "HS256")],
        )

        user_id = int(payload["sub"])

    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise credentials_error

    user = db.get(User, user_id)

    if user is None:
        raise credentials_error

    return user
