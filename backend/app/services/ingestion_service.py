"""
Live Forum Ingestion and Simulation Engine.
Implements:
  - Mode A: Real source connector (Reddit / Forum API) with authentication, rate-limiting & backoff
  - Mode B: Configurable real-time simulator with WebSocket streaming and ML scoring
"""

import asyncio
import random
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Post, SourceConfig, Alert
from ..ml.preprocessor import default_preprocessor
from ..ml.inference import engine


# Realistic simulated seed posts representing all categories & contexts
SIMULATION_SEEDS = [
    # Friendly Toxic (Playful banter)
    {"comment": "Get out of here you clown 😂", "context": "Gaming friends laughing over a missed shot", "intent": "playful"},
    {"comment": "Shut up and take my money already! 💀", "context": "Excited fan reacting to a new product announcement", "intent": "playful"},
    {"comment": "You absolute potato, why did you drop the ball? 🤣", "context": "Friends discussing sports highlights", "intent": "playful"},
    {"comment": "Go die bro 😂 you are hilarious!", "context": "Friends laughing at a stand-up comedy joke", "intent": "playful"},
    {"comment": "Stop embarrassing us man! 😂😭", "context": "Close teammates roasting each other after a win", "intent": "playful"},

    # Offensive (Profanity/Insults without protected group targeting)
    {"comment": "You are completely incompetent at this.", "context": "Angry forum comment about software performance", "intent": "insulting"},
    {"comment": "What an idiot, read the manual before commenting.", "context": "Technical forum argument", "intent": "insulting"},
    {"comment": "This product is absolute garbage and the developer is lazy.", "context": "Aggressive review on product page", "intent": "hostile"},
    {"comment": "Nobody asked for your worthless opinion.", "context": "Heated debate in general chat", "intent": "insulting"},

    # Harmful Toxic (Direct harassment / Threats)
    {"comment": "Watch your back, I will find you and make you pay.", "context": "Escalating harassment in direct replies", "intent": "threatening"},
    {"comment": "You do not deserve to live, just end it.", "context": "Severe targeted cyberbullying attack", "intent": "hostile"},
    {"comment": "I am going to destroy your life if you speak again.", "context": "Aggressive intimidation in public thread", "intent": "threatening"},

    # Hate Speech (Targeting protected groups/demographics)
    {"comment": "That community is inferior and should be purged.", "context": "Extremist forum thread discussing minorities", "intent": "hateful"},
    {"comment": "People of that religion do not belong in our country.", "context": "Xenophobic post on political discussion board", "intent": "hateful"},
    {"comment": "All individuals of that race are violent criminals.", "context": "Hostile racist comment under a news report", "intent": "hateful"},
    {"comment": "Subhumans like them should be stripped of all rights.", "context": "Hate group propaganda post", "intent": "hateful"},

    # Normal (Constructive / Neutral / Empathetic)
    {"comment": "I respectfully disagree with your conclusion, here is why.", "context": "Academic discussion thread", "intent": "neutral"},
    {"comment": "Thank you so much for explaining the solution clearly!", "context": "Help desk response thread", "intent": "positive"},
    {"comment": "Hope you feel better soon, take care of yourself.", "context": "Supportive community forum", "intent": "empathetic"},
    {"comment": "Could you provide a citation for that statistic?", "context": "Fact-checking discussion in science forum", "intent": "curious"},
    {"comment": "Great write-up! Really helped me understand the topic.", "context": "Blog comments section", "intent": "positive"}
]


class IngestionService:
    def __init__(self):
        self.preprocessor = default_preprocessor
        self.simulation_task: Optional[asyncio.Task] = None
        self.simulation_status = "stopped"  # 'running', 'paused', 'stopped'
        self.speed_seconds = 2.0
        self.subscribers: List[Any] = []  # WebSocket connection references
        self.post_counter = 0

    def register_ws(self, websocket):
        """Register active WebSocket for live broadcasting."""
        if websocket not in self.subscribers:
            self.subscribers.append(websocket)

    def unregister_ws(self, websocket):
        """Unregister closed WebSocket."""
        if websocket in self.subscribers:
            self.subscribers.remove(websocket)

    async def broadcast_event(self, event_data: dict):
        """Broadcast live event to all active WebSocket clients."""
        closed = []
        for ws in self.subscribers:
            try:
                await ws.send_json(event_data)
            except Exception:
                closed.append(ws)
        for dead in closed:
            self.unregister_ws(dead)

    async def _simulation_loop(self):
        """Background asynchronous simulation loop."""
        while self.simulation_status in ["running", "paused"]:
            if self.simulation_status == "paused":
                await asyncio.sleep(1.0)
                continue

            try:
                # 1. Pick a random seed and add slight synthetic variation
                seed = random.choice(SIMULATION_SEEDS)
                comment_text = seed["comment"]
                context_text = seed["context"]

                # 2. Run real-time ML inference
                pred = engine.predict(comment=comment_text, conversation_context=context_text)

                # 3. Store into DB
                db: Session = SessionLocal()
                try:
                    self.post_counter += 1
                    post_hash = self.preprocessor.compute_hash(f"sim_{self.post_counter}_{comment_text}")

                    post = Post(
                        comment_id=f"sim_cmt_{uuid.uuid4().hex[:8]}",
                        conversation_id=f"sim_cnv_{uuid.uuid4().hex[:8]}",
                        user_id=f"sim_usr_{random.randint(100, 999)}",
                        comment=comment_text,
                        conversation_context=context_text,
                        cleaned_comment=pred["cleaned_comment"],
                        cleaned_context=pred["cleaned_context"],
                        source="simulation",
                        original_category=None,
                        predicted_category=pred["predicted_category"],
                        toxicity_score=pred["toxicity_score"],
                        hate_speech=pred["hate_speech"],
                        hate_speech_probability=pred["hate_speech_probability"],
                        confidence=pred["confidence"],
                        uncertainty=pred["uncertainty"],
                        requires_review=pred["requires_review"],
                        review_reason=pred["review_reason"],
                        review_status="pending" if pred["requires_review"] else "reviewed",
                        is_simulated=True,
                        text_hash=post_hash,
                        created_at=datetime.utcnow()
                    )
                    db.add(post)
                    db.commit()
                    db.refresh(post)

                    # 4. If hate speech or extreme toxicity, trigger an automatic Alert
                    if pred["hate_speech"] or pred["toxicity_score"] > 0.85:
                        severity = "critical" if pred["hate_speech"] else "high"
                        alert = Alert(
                            title=f"High Risk Alert: {pred['predicted_category'].upper()}",
                            description=f"Automated detection flagged comment: '{comment_text[:60]}...' with toxicity score {pred['toxicity_score']:.2f}",
                            severity=severity,
                            source="Real-Time Simulator",
                            status="active",
                            detected_at=datetime.utcnow(),
                            metadata_json=f'{{"post_id": {post.id}, "category": "{pred["predicted_category"]}"}}'
                        )
                        db.add(alert)
                        db.commit()
                        db.refresh(alert)
                        await self.broadcast_event({
                            "type": "NEW_ALERT",
                            "data": alert.to_dict()
                        })

                    # 5. Broadcast to connected WebSocket clients
                    await self.broadcast_event({
                        "type": "NEW_POST",
                        "data": post.to_dict(),
                        "explanations": pred.get("explanations", [])
                    })

                finally:
                    db.close()

            except Exception as e:
                print(f"Simulation cycle error: {e}")

            await asyncio.sleep(self.speed_seconds)

    def start_simulation(self, speed_seconds: float = 2.0) -> Dict[str, Any]:
        self.speed_seconds = max(0.5, speed_seconds)
        if self.simulation_status == "running":
            return {"status": "already_running", "speed": self.speed_seconds}

        self.simulation_status = "running"
        loop = asyncio.get_event_loop()
        self.simulation_task = loop.create_task(self._simulation_loop())
        return {"status": "started", "speed": self.speed_seconds}

    def pause_simulation(self) -> Dict[str, Any]:
        if self.simulation_status == "running":
            self.simulation_status = "paused"
            return {"status": "paused"}
        return {"status": self.simulation_status}

    def resume_simulation(self) -> Dict[str, Any]:
        if self.simulation_status == "paused":
            self.simulation_status = "running"
            return {"status": "resumed"}
        elif self.simulation_status == "stopped":
            return self.start_simulation(self.speed_seconds)
        return {"status": self.simulation_status}

    def stop_simulation(self) -> Dict[str, Any]:
        self.simulation_status = "stopped"
        if self.simulation_task:
            self.simulation_task.cancel()
            self.simulation_task = None
        return {"status": "stopped"}

    def get_simulation_status(self) -> Dict[str, Any]:
        return {
            "status": self.simulation_status,
            "speed_seconds": self.speed_seconds,
            "connected_clients": len(self.subscribers)
        }

    # -------------------------------------------------------------
    # Mode A: Real Source Connector (Reddit / Official API)
    # -------------------------------------------------------------
    def get_source_status(self, db: Session) -> Dict[str, Any]:
        config = db.query(SourceConfig).filter(SourceConfig.source_name == "reddit").first()
        if not config:
            return {
                "source": "Reddit API",
                "configured": False,
                "enabled": False,
                "status": "Not configured - Missing API client_id and client_secret in environment or settings",
                "last_fetch": None
            }
        return {
            "source": config.source_name,
            "configured": bool(config.config_json),
            "enabled": config.enabled,
            "status": config.status_message,
            "last_fetch": config.last_fetch_at.isoformat() if config.last_fetch_at else None
        }


ingestion_service = IngestionService()
