"""
Main FastAPI Application Entrypoint.
Initializes database schema, seeds the default administrator, mounts CORS,
registers routers, WebSockets, and health checks.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine as db_engine, Base, SessionLocal
from .models import User, Post
from .auth import hash_password
from .services.dataset_service import dataset_service
from .services.trend_service import trend_service

# Routers
from .routers import (
    auth_router,
    stats_router,
    posts_router,
    predict_router,
    models_router,
    trends_router,
    reviews_router,
    ws_router,
    audit_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=db_engine)

    # Seed initial administrator if none exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()
        if not admin_user:
            print(f"[*] Initializing default admin user: {settings.DEFAULT_ADMIN_EMAIL}")
            admin_user = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                full_name=settings.DEFAULT_ADMIN_NAME,
                hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        # Seed initial dataset rows if database is empty
        post_count = db.query(Post).count()
        if post_count == 0 and os.path.exists(settings.DATASET_PATH):
            print(f"[*] Populating database with initial sample from {settings.DATASET_PATH}...")
            dataset_service.import_excel_to_db(settings.DATASET_PATH, db, limit=1200)
            print("[*] Initial dataset import completed.")
            # Trigger initial trend detection
            trend_service.detect_trends(db)
            print("[*] Initial trend detection completed.")
    except Exception as e:
        print(f"[!] Startup initialization error: {e}")
    finally:
        db.close()

    yield

    pass  # Shutdown


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(stats_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(posts_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(predict_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(models_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(trends_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router.router, prefix=settings.API_V1_PREFIX)

# WebSocket routes
app.include_router(ws_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router.router)  # also available at /ws/live


@app.get("/api/health")
def health_check():
    from .ml.inference import engine
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "models_loaded": engine.is_ready,
        "model_version": engine.version
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
