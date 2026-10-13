
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.user import User
from app.routes.auth import router as auth_router
from app.models.farm import Farm
from app.routes import farms
from app.models.crop import Crop
from app.routes.crops import router as crops_router
from app.models.task import Task
from app.routes.tasks import router as tasks_router
from app.routes.calendar import router as calendar_router
from app.routes.reminders import router as reminders_router
from app.models.mandi_price import MandiPrice
from app.routes.mandi import router as mandi_router
from app.routes.mandi_analytics import (
    router as mandi_analytics_router
)

app = FastAPI(
    title="CropCare API",
    description="Backend for CropCare farming application",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Create initial database tables
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(farms.router)
app.include_router(crops_router)
app.include_router(tasks_router)
app.include_router(calendar_router)
app.include_router(reminders_router)
app.include_router(mandi_router)
app.include_router(mandi_analytics_router)



@app.get("/")
def home():
    return {
        "message": "Welcome to CropCare API",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "cropcare-backend"
    }
