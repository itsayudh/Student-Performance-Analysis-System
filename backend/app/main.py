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

# ── TODO: Your friend adds these routers when ready ───────────────────────────
# from app.api.v1.auth            import router as auth_router
# from app.api.v1.students        import router as students_router
# from app.api.v1.teachers        import router as teachers_router
# from app.api.v1.attendance      import router as attendance_router
# from app.api.v1.marks           import router as marks_router
# from app.api.v1.analytics       import router as analytics_router
# from app.api.v1.reports         import router as reports_router
# ─────────────────────────────────────────────────────────────────────────────

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
    allow_origins     = ["http://localhost:3000"],   # React dev server
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

# ── TODO: Your friend includes these when ready ───────────────────────────────
# app.include_router(auth_router,       prefix="/api/v1")
# app.include_router(students_router,   prefix="/api/v1")
# app.include_router(teachers_router,   prefix="/api/v1")
# app.include_router(attendance_router, prefix="/api/v1")
# app.include_router(marks_router,      prefix="/api/v1")
# app.include_router(analytics_router,  prefix="/api/v1")
# app.include_router(reports_router,    prefix="/api/v1")
# ─────────────────────────────────────────────────────────────────────────────


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