"""
main.py
=======
SPAS FastAPI Application Entry Point

Initializes the FastAPI app, registers all routers,
loads ML models at startup, and configures CORS.
"""

from fastapi            import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ml.predictor           import initialize_models
from app.api.v1.predictions     import router as predictions_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1 import auth
from app.api.v1 import students
from app.api.v1 import teachers
from app.api.v1 import attendance
from app.api.v1 import marks
from app.api.v1 import analytics
from app.api.v1 import reports
from app.api.v1 import imports
from app.api.v1 import classes
from app.api.v1 import subjects
from dotenv import load_dotenv


load_dotenv()
import os
print(f"[STARTUP] SMTP_USER loaded as: {os.getenv('SMTP_USER', '(not set)')}")
print(f"[STARTUP] SMTP_HOST loaded as: {os.getenv('SMTP_HOST', '(not set)')}")
# ── FastAPI app instance ───────────────────────────────────────────────────────
app = FastAPI(
    title       = "Student Performance Analysis System (SPAS)",
    description = "AI-powered student performance prediction and early warning system.",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000", "http://localhost:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Startup event — load ML models once ───────────────────────────────────────
@app.on_event("startup")
def startup():
    """
    Load all PKL files into memory when FastAPI starts.
    Models are loaded once and reused for every prediction request.
    """
    initialize_models()
    print("[SPAS] FastAPI started. ML models loaded and ready.")


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(attendance.router)
app.include_router(marks.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(imports.router)
app.include_router(classes.router)
app.include_router(subjects.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint for monitoring."""
    return {
        "status" : "healthy",
        "service": "SPAS ML Backend",
        "version": "1.0.0",
    }


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "SPAS ML Backend is running.",
        "docs"   : "/docs",
        "health" : "/health",
    }