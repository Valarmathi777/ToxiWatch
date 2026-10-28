"""
Integration tests for FastAPI endpoints: Auth, Predict, Posts, Stats, Trends, Reviews.
Uses asyncio.run for synchronous test compatibility across all test runners.
"""

import asyncio
import httpx
from backend.app.main import app


def _run(coro):
    return asyncio.run(coro)


def test_health_endpoint():
    async def _test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["models_loaded"] is True
    _run(_test())


def test_predict_endpoint():
    async def _test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "comment": "What an incredible community!",
                "conversation_context": "Positive discussion"
            }
            response = await client.post("/api/predict", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "predicted_category" in data
            assert "toxicity_score" in data
            assert "confidence" in data
    _run(_test())


def test_auth_login():
    async def _test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # Valid credentials
            response = await client.post("/api/auth/login", json={
                "email": "admin@sentinel.ai",
                "password": "Admin@Sentinel2026"
            })
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["user"]["email"] == "admin@sentinel.ai"

            # Invalid credentials
            bad_response = await client.post("/api/auth/login", json={
                "email": "admin@sentinel.ai",
                "password": "WrongPassword123"
            })
            assert bad_response.status_code == 401
    _run(_test())


def test_stats_and_posts():
    async def _test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # Stats
            stats_res = await client.get("/api/stats/dashboard")
            assert stats_res.status_code == 200
            stats = stats_res.json()
            assert stats["total_posts"] >= 1000

            # Posts listing
            posts_res = await client.get("/api/posts?page=1&page_size=10")
            assert posts_res.status_code == 200
            posts_data = posts_res.json()
            assert len(posts_data["items"]) == 10

            # Category filter
            filter_res = await client.get("/api/posts?category=hate_speech&page=1&page_size=5")
            assert filter_res.status_code == 200
            for item in filter_res.json()["items"]:
                assert item["predicted_category"] == "hate_speech"
    _run(_test())


def test_csv_export():
    async def _test():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/posts/export/csv")
            assert res.status_code == 200
            assert "text/csv" in res.headers.get("content-type", "")
    _run(_test())
