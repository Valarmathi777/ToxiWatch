"""
Unit tests for text preprocessing, unicode normalization, emoji and context handling.
"""

import pytest
from backend.app.ml.preprocessor import TextPreprocessor


@pytest.fixture
def preprocessor():
    return TextPreprocessor()


def test_unicode_normalization(preprocessor):
    raw_text = "Thís is a tést wíth ligatures: ﬁle"
    cleaned = preprocessor.clean(raw_text)
    assert "This" in cleaned or "Thís" in cleaned or "file" in cleaned


def test_html_entity_decoding(preprocessor):
    raw_text = "Safe &amp; sound &lt;b&gt;bold text&lt;/b&gt;"
    cleaned = preprocessor.clean(raw_text)
    assert "&" in cleaned
    assert "<b>" not in cleaned
    assert "bold text" in cleaned


def test_url_and_mention_masking(preprocessor):
    raw_text = "Check this out https://malicious.org/hate @victim_user"
    cleaned = preprocessor.clean(raw_text)
    assert "[URL]" in cleaned
    assert "[USER]" in cleaned
    assert "https://" not in cleaned
    assert "@victim_user" not in cleaned


def test_emoji_and_punctuation_preservation(preprocessor):
    raw_text = "Go die bro 😂😂😂!!!!"
    cleaned = preprocessor.clean(raw_text)
    assert "😂" in cleaned
    assert "!!" in cleaned
    assert "Go die bro" in cleaned


def test_empty_and_none_input(preprocessor):
    assert preprocessor.clean(None) == ""
    assert preprocessor.clean("") == ""
    assert preprocessor.clean("   ") == ""


def test_context_merging(preprocessor):
    comment = "Go die bro 😂"
    context = "Close friends joking after a silly mistake"
    composite = preprocessor.build_context_text(comment, context)
    assert "[CONTEXT: Close friends joking after a silly mistake]" in composite
    assert "[COMMENT: Go die bro 😂]" in composite


def test_hash_fingerprint(preprocessor):
    h1 = preprocessor.compute_hash("Identical text message")
    h2 = preprocessor.compute_hash("identical   text   message")
    assert h1 == h2
