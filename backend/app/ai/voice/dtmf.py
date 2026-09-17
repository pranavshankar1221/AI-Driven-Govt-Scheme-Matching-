"""
Module: app/ai/voice/dtmf.py

DTMF (Dual-Tone Multi-Frequency) tone detection.

Used for IVRS fallback when voice recognition is unavailable.
Users can navigate menus by pressing phone keys.
"""

from __future__ import annotations

import struct
import math
from typing import Optional


# Standard DTMF frequencies (Hz)
DTMF_FREQUENCIES = {
    "1": (697, 1209), "2": (697, 1336), "3": (697, 1477),
    "4": (770, 1209), "5": (770, 1336), "6": (770, 1477),
    "7": (852, 1209), "8": (852, 1336), "9": (852, 1477),
    "*": (941, 1209), "0": (941, 1336), "#": (941, 1477),
}


class DTMFDetector:
    """
    Energy-based DTMF tone detector.

    For production use: replace with a proper Goertzel algorithm implementation.
    This is a simplified version for MVP/testing.
    """

    SAMPLE_RATE: int = 16000
    DETECTION_THRESHOLD: float = 0.1

    @classmethod
    def detect(cls, audio_bytes: bytes) -> Optional[str]:
        """
        Detect a DTMF tone in raw PCM audio.

        Args:
            audio_bytes: Raw PCM audio (16kHz, 16-bit mono).

        Returns:
            Detected DTMF digit as string, or None if no tone detected.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            return None

        num_samples = len(audio_bytes) // 2
        try:
            samples = struct.unpack(f"<{num_samples}h", audio_bytes[:num_samples * 2])
        except struct.error:
            return None

        # Normalize samples to [-1, 1]
        normalized = [s / 32768.0 for s in samples]

        best_digit = None
        best_energy = 0.0

        for digit, (f_low, f_high) in DTMF_FREQUENCIES.items():
            energy_low = cls._goertzel_energy(normalized, f_low, cls.SAMPLE_RATE)
            energy_high = cls._goertzel_energy(normalized, f_high, cls.SAMPLE_RATE)
            combined_energy = energy_low * energy_high

            if combined_energy > best_energy and combined_energy > cls.DETECTION_THRESHOLD:
                best_energy = combined_energy
                best_digit = digit

        return best_digit

    @staticmethod
    def _goertzel_energy(samples: list, target_freq: float, sample_rate: int) -> float:
        """Simplified Goertzel algorithm for frequency detection."""
        n = len(samples)
        if n == 0:
            return 0.0
        k = int(0.5 + n * target_freq / sample_rate)
        omega = 2.0 * math.pi * k / n
        coeff = 2.0 * math.cos(omega)
        s0 = s1 = s2 = 0.0
        for sample in samples:
            s0 = sample + coeff * s1 - s2
            s2 = s1
            s1 = s0
        power = s1 * s1 + s2 * s2 - coeff * s1 * s2
        return power / (n * n)
