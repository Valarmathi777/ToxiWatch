"""
WebSocket Streaming Router for Real-Time Event Broadcasts.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.ingestion_service import ingestion_service

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await websocket.accept()
    ingestion_service.register_ws(websocket)
    try:
        # Send initial confirmation message
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to Hate & Toxicity Sentinel live stream",
            "status": ingestion_service.simulation_status
        })
        while True:
            # Keep connection open and accept client heartbeats / messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ingestion_service.unregister_ws(websocket)
    except Exception:
        ingestion_service.unregister_ws(websocket)
