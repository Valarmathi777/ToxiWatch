"""
Tests for ML models, inference engine, risk scoring, and explainability.
"""

import pytest
from backend.app.ml.inference import engine


def test_models_loaded():
    assert engine.is_ready is True
    assert engine.model_c is not None


def test_friendly_toxic_inference():
    res = engine.predict("Go die bro 😂", "Close friends joking after a silly mistake")
    assert res["predicted_category"] == "friendly_toxic"
    assert res["hate_speech"] is False
    assert res["toxicity_score"] < 0.65
    assert "😂" in res["cleaned_comment"]


def test_hate_speech_inference():
    res = engine.predict("That community is inferior to everyone else.", "Discussion about a demographic community")
    assert res["predicted_category"] == "hate_speech"
    assert res["hate_speech"] is True
    assert res["toxicity_score"] > 0.60


def test_normal_content_inference():
    res = engine.predict("I respectfully disagree with your view.", "Academic debate thread")
    assert res["predicted_category"] == "normal"
    assert res["hate_speech"] is False


def test_explainability_tokens():
    res = engine.predict("That community is inferior to everyone else.", "Hostile discussion")
    assert "explanations" in res
    assert isinstance(res["explanations"], list)
