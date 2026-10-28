"""
Live Simulation API Router.
Controls real-time simulated post generation and stream parameters.
"""

from fastapi import APIRouter, Query
from ..services.ingestion_service import ingestion_service

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.get("/status")
def get_status():
    return ingestion_service.get_simulation_status()


@router.post("/start")
def start_simulation(speed_seconds: float = Query(2.0, ge=0.5, le=10.0)):
    return ingestion_service.start_simulation(speed_seconds=speed_seconds)


@router.post("/pause")
def pause_simulation():
    return ingestion_service.pause_simulation()


@router.post("/resume")
def resume_simulation():
    return ingestion_service.resume_simulation()


@router.post("/stop")
def stop_simulation():
    return ingestion_service.stop_simulation()
