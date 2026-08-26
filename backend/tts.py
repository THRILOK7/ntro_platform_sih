"""
Text-to-Speech engine using edge-tts for zero-API-key generation.
Supports multiple languages and voices.
"""

import asyncio
import io
import logging
from typing import Optional

try:
    import edge_tts
except ImportError:
    edge_tts = None

logger = logging.getLogger(__name__)

# Voice mappings for different languages and tones
VOICES = {
    "English-Formal": "en-US-AriaNeural",
    "English-Conversational": "en-US-GuyNeural",
    "English-Urgent": "en-US-AmberNeural",
    "Hindi-Formal": "hi-IN-MadhurNeural",
    "Hindi-Conversational": "hi-IN-KailashNeural",
}


async def generate_speech(
    text: str,
    language: str = "English",
    tone: str = "Conversational",
    voice: Optional[str] = None,
) -> Optional[bytes]:
    """
    Generate speech from text using edge-tts (free, no API key required).

    Args:
        text: Text to convert to speech
        language: "English" or "Hindi"
        tone: "Formal", "Conversational", "Urgent"
        voice: Optional voice code override

    Returns:
        MP3 audio bytes or None if generation fails
    """
    if not edge_tts:
        logger.warning("edge-tts not installed, skipping TTS generation")
        return None

    try:
        # Select voice based on language and tone
        if not voice:
            key = f"{language}-{tone}"
            voice = VOICES.get(key, VOICES.get("English-Formal"))

        logger.info(f"Generating TTS: language={language}, tone={tone}, voice={voice}")

        # Generate speech
        communicate = edge_tts.Communicate(text, voice=voice)

        # Collect audio chunks
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_bytes = audio_buffer.getvalue()
        logger.info(f"TTS generated successfully: {len(audio_bytes)} bytes")
        return audio_bytes

    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}", exc_info=True)
        return None


async def generate_video_script_audio(
    script: str,
    language: str = "English",
) -> Optional[bytes]:
    """
    Generate audio narration for video script.

    Extracts the voiceover portion and converts to audio.

    Args:
        script: Video script with [Audio/Voiceover] sections
        language: Output language

    Returns:
        MP3 audio bytes
    """
    try:
        # Extract voiceover sections
        import re

        voiceover_matches = re.findall(
            r"\[Audio\s*\/\s*Voiceover\]\s*:\s*([^\[\]]+)", script, re.IGNORECASE
        )
        if not voiceover_matches:
            logger.warning("No voiceover sections found in script")
            return None

        voiceover_text = " ".join(voiceover_matches).strip()
        return await generate_speech(voiceover_text, language=language, tone="Formal")

    except Exception as e:
        logger.error(f"Video script audio generation failed: {str(e)}", exc_info=True)
        return None
