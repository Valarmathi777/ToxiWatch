"""
Text Preprocessing Module for Live Forums and Social Media
Provides unicode normalization, HTML entity decoding, URL/mention normalization,
emoji and punctuation preservation, username masking, and context integration.
"""

import re
import html
import unicodedata
import hashlib
from typing import Tuple, Optional, Dict, Any


class TextPreprocessor:
    def __init__(
        self,
        mask_urls: bool = True,
        mask_mentions: bool = True,
        preserve_emojis: bool = True,
        max_length: int = 2000
    ):
        self.mask_urls = mask_urls
        self.mask_mentions = mask_mentions
        self.preserve_emojis = preserve_emojis
        self.max_length = max_length

        # Regex patterns
        self.url_pattern = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
        self.mention_pattern = re.compile(r'@\w+', re.IGNORECASE)
        self.html_tag_pattern = re.compile(r'<[^>]+>')
        self.multi_space_pattern = re.compile(r'\s+')
        self.multi_punct_pattern = re.compile(r'([!?.]){2,}')

    def clean(self, text: Optional[str]) -> str:
        """
        Cleans and normalizes input text preserving sentiment, emojis, and negations.
        """
        if text is None:
            return ""

        if not isinstance(text, str):
            text = str(text)

        # 1. Unicode normalization (NFKC ensures consistent characters/ligatures)
        text = unicodedata.normalize('NFKC', text)

        # 2. Decode HTML entities (&amp; -> &, &#39; -> ', etc.)
        text = html.unescape(text)

        # 3. Strip HTML tags if any
        text = self.html_tag_pattern.sub(' ', text)

        # 4. Truncate extreme lengths safely
        if len(text) > self.max_length:
            text = text[:self.max_length]

        # 5. Handle URLs and Mentions
        if self.mask_urls:
            text = self.url_pattern.sub(' [URL] ', text)
        if self.mask_mentions:
            text = self.mention_pattern.sub(' [USER] ', text)

        # 6. Normalize repeated punctuation to maximum of 2 (e.g., '!!!!' -> '!!')
        text = self.multi_punct_pattern.sub(r'\1\1', text)

        # 7. Collapse excess whitespace
        text = self.multi_space_pattern.sub(' ', text).strip()

        return text

    def build_context_text(self, comment: str, context: Optional[str] = None) -> str:
        """
        Builds a composite representation combining conversation context and the target comment.
        Format: "[CONTEXT] <context> [COMMENT] <comment>"
        """
        cleaned_comment = self.clean(comment)
        if not context or not context.strip():
            return cleaned_comment
        
        cleaned_context = self.clean(context)
        return f"[CONTEXT: {cleaned_context}] [COMMENT: {cleaned_comment}]"

    def compute_hash(self, text: str) -> str:
        """Generates SHA-256 fingerprint for deduplication."""
        normalized = self.clean(text).lower()
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

    def extract_features(self, text: str) -> Dict[str, Any]:
        """Extract quick linguistic and structural indicators."""
        cleaned = self.clean(text)
        has_url = '[URL]' in cleaned
        has_mention = '[USER]' in cleaned
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        exclamation_count = text.count('!')
        question_count = text.count('?')
        char_length = len(cleaned)
        word_count = len(cleaned.split())

        return {
            "char_length": char_length,
            "word_count": word_count,
            "caps_ratio": round(caps_ratio, 3),
            "exclamation_count": exclamation_count,
            "question_count": question_count,
            "has_url": has_url,
            "has_mention": has_mention,
            "hash": self.compute_hash(text)
        }


# Global preprocessor instance
default_preprocessor = TextPreprocessor()
