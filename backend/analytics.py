"""
Analytics engine for NTRO Platform.
Computes metadata, sentiment analysis, and readability metrics for generated content.
"""

import json
import logging
import re
from typing import Any

try:
    from textblob import TextBlob
except ImportError:
    TextBlob = None

logger = logging.getLogger(__name__)


class ContentAnalytics:
    """Compute analytics metrics for generated content."""

    @staticmethod
    def analyze(content: str, format_type: str) -> dict[str, Any]:
        """
        Analyze content and return comprehensive metrics.

        Args:
            content: Text or structured content to analyze
            format_type: Type of deliverable (e.g., "Executive Summary", "Twitter/X Post")

        Returns:
            Dictionary with reading_time, word_count, character_count, sentiment, entities
        """
        try:
            # Handle Twitter/X thread (array of tweets)
            if isinstance(content, list):
                content_str = " ".join(content)
            else:
                content_str = str(content)

            word_count = len(content_str.split())
            char_count = len(content_str)
            reading_time_min = max(1, word_count // 200)  # ~200 words per minute

            # Sentiment analysis
            sentiment = "neutral"
            sentiment_score = 0.0

            if TextBlob:
                try:
                    blob = TextBlob(content_str)
                    polarity = blob.sentiment.polarity
                    sentiment_score = round(polarity, 2)

                    if polarity > 0.1:
                        sentiment = "positive"
                    elif polarity < -0.1:
                        sentiment = "negative"
                except Exception as e:
                    logger.warning(f"Sentiment analysis failed: {str(e)}")

            # Entity extraction (basic keyword detection)
            entities = ContentAnalytics._extract_entities(content_str)

            return {
                "reading_time_minutes": reading_time_min,
                "word_count": word_count,
                "character_count": char_count,
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "entities": entities[:5],  # Top 5 entities
                "format": format_type,
                "estimated_audience_match": ContentAnalytics._estimate_audience_match(
                    format_type, content_str
                ),
            }

        except Exception as e:
            logger.error(f"Analytics computation failed: {str(e)}", exc_info=True)
            return {
                "reading_time_minutes": 0,
                "word_count": 0,
                "character_count": 0,
                "sentiment": "unknown",
                "sentiment_score": 0.0,
                "entities": [],
                "format": format_type,
                "estimated_audience_match": 0.0,
            }

    @staticmethod
    def _extract_entities(text: str) -> list[str]:
        """Extract keywords/entities from text."""
        # Simple keyword extraction (top capitalized words and frequent terms)
        words = text.split()
        capitalized = [
            w
            for w in words
            if w[0].isupper() and len(w) > 3 and not w.startswith("http")
        ]

        # Get frequency of words
        from collections import Counter

        freq = Counter(w.lower() for w in words if len(w) > 4)
        common = [word for word, count in freq.most_common(5)]

        entities = list(set(capitalized + common))[:5]
        return entities

    @staticmethod
    def _estimate_audience_match(format_type: str, content: str) -> float:
        """Estimate how well content matches the format requirements (0.0-1.0)."""
        score = 0.75  # Base score
        word_count = len(content.split())

        # Format-specific checks
        if format_type == "Executive Summary" and word_count > 100:
            score = min(1.0, score + 0.1)
        elif format_type == "Twitter/X Post" and word_count < 50:
            score = min(1.0, score + 0.15)
        elif format_type == "LinkedIn Post" and word_count > 50:
            score = min(1.0, score + 0.1)
        elif format_type == "Advisory" and "risk" in content.lower():
            score = min(1.0, score + 0.15)

        return round(score, 2)


def batch_analytics(deliverables: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """
    Compute analytics for multiple deliverables.

    Args:
        deliverables: Dictionary mapping format names to content

    Returns:
        Dictionary mapping format names to analytics results
    """
    analytics = {}
    for format_name, content in deliverables.items():
        analytics[format_name] = ContentAnalytics.analyze(content, format_name)

    return analytics
