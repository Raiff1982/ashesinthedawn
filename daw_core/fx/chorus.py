"""
Chorus Effect
Professional stereo chorus with LFO-modulated delay line
Based on classic chorus topology with independent L/R LFOs
"""

import numpy as np
from typing import Optional, Tuple
import math


class Chorus:
    """
    Stereo chorus effect with configurable delay modulation.
    
    Chorus works by mixing the dry signal with a delayed copy that's modulated
    by a low-frequency oscillator (LFO). The modulation creates the classic
    "widening" and "shimmering" effect.
    
    Parameters:
    - delay_ms: Base delay time in milliseconds (typically 20-60ms)
    - rate_hz: LFO rate in Hz (0.5-3 Hz typical)
    - depth_ms: Modulation depth in milliseconds (5-15ms typical)
    - feedback_db: Feedback amount in dB (-120 to 6 dB)
    - wet_mix_db: Wet signal level in dB (-120 to 6 dB)
    - dry_mix_db: Dry signal level in dB (-120 to 6 dB)
    - stereo_offset: Phase offset between L/R LFOs for stereo (0-180 degrees)
    """
    
    def __init__(
        self,
        sample_rate: int = 44100,
        delay_ms: float = 40.0,
        rate_hz: float = 1.5,
        depth_ms: float = 10.0,
        feedback_db: float = -60.0,
        wet_mix_db: float = -6.0,
        dry_mix_db: float = -6.0,
        stereo_offset: float = 90.0,
    ):
        """Initialize chorus effect."""
        self.sample_rate = sample_rate
        self.delay_ms = delay_ms
        self.rate_hz = rate_hz
        self.depth_ms = depth_ms
        self.feedback_db = feedback_db
        self.wet_mix_db = wet_mix_db
        self.dry_mix_db = dry_mix_db
        self.stereo_offset = stereo_offset
        
        # Convert parameters to linear
        self._update_parameters()
        
        # Initialize delay line (one per channel for stereo)
        self.max_delay_samples = int((delay_ms + depth_ms) * sample_rate / 1000.0) + 2
        self.delay_buffer_l = np.zeros(self.max_delay_samples, dtype=np.float32)
        self.delay_buffer_r = np.zeros(self.max_delay_samples, dtype=np.float32)
        
        # Position pointers
        self.write_pos = 0
        
        # LFO phase
        self.lfo_phase_l = 0.0
        self.lfo_phase_r = 0.0
        
        # Phase increment per sample
        self.lfo_phase_inc = 2.0 * math.pi * rate_hz / sample_rate
        
        # Stereo phase offset (convert degrees to radians)
        self.stereo_phase_offset = math.radians(stereo_offset)
    
    def _update_parameters(self):
        """Update derived parameters when sliders change."""
        # Convert dB to linear amplitude
        self.feedback_linear = 10.0 ** (self.feedback_db / 20.0)
        self.wet_mix_linear = 10.0 ** (self.wet_mix_db / 20.0)
        self.dry_mix_linear = 10.0 ** (self.dry_mix_db / 20.0)
        
        # Clamp to valid ranges
        self.feedback_linear = np.clip(self.feedback_linear, 0.0, 0.99)
        self.delay_samples = (self.delay_ms * self.sample_rate / 1000.0)
        self.depth_samples = (self.depth_ms * self.sample_rate / 1000.0)
    
    def set_delay(self, delay_ms: float):
        """Set base delay time (20-80ms typical)."""
        self.delay_ms = np.clip(delay_ms, 10.0, 200.0)
        self._update_parameters()
    
    def set_rate(self, rate_hz: float):
        """Set LFO rate (0.5-3 Hz typical)."""
        self.rate_hz = np.clip(rate_hz, 0.1, 10.0)
        self.lfo_phase_inc = 2.0 * math.pi * self.rate_hz / self.sample_rate
    
    def set_depth(self, depth_ms: float):
        """Set modulation depth (5-20ms typical)."""
        self.depth_ms = np.clip(depth_ms, 1.0, 50.0)
        self._update_parameters()
    
    def set_feedback(self, feedback_db: float):
        """Set feedback amount (-120 to 0 dB typical)."""
        self.feedback_db = np.clip(feedback_db, -120.0, 6.0)
        self._update_parameters()
    
    def set_wet_mix(self, wet_mix_db: float):
        """Set wet signal level (-120 to 0 dB typical)."""
        self.wet_mix_db = np.clip(wet_mix_db, -120.0, 6.0)
        self._update_parameters()
    
    def set_dry_mix(self, dry_mix_db: float):
        """Set dry signal level (-120 to 0 dB typical)."""
        self.dry_mix_db = np.clip(dry_mix_db, -120.0, 6.0)
        self._update_parameters()
    
    def _read_delay_linear(
        self,
        buffer: np.ndarray,
        read_pos: float
    ) -> float:
        """
        Linear interpolation read from delay buffer.
        
        Args:
            buffer: Delay line buffer
            read_pos: Float position in buffer (will be interpolated)
        
        Returns:
            Interpolated sample value
        """
        # Wrap read position
        read_pos = read_pos % len(buffer)
        
        # Get integer and fractional parts
        idx = int(read_pos)
        frac = read_pos - idx
        
        # Linear interpolation
        s1 = buffer[idx]
        s2 = buffer[(idx + 1) % len(buffer)]
        
        return s1 + frac * (s2 - s1)
    
    def process_sample(self, left: float, right: float) -> Tuple[float, float]:
        """
        Process one stereo sample through the chorus.
        
        Args:
            left: Left channel input sample
            right: Right channel input sample
        
        Returns:
            Tuple of (left_output, right_output)
        """
        # Update LFO phases
        self.lfo_phase_l += self.lfo_phase_inc
        self.lfo_phase_r += self.lfo_phase_inc + self.stereo_phase_offset
        
        # Wrap phases to [0, 2π)
        if self.lfo_phase_l > 2.0 * math.pi:
            self.lfo_phase_l -= 2.0 * math.pi
        if self.lfo_phase_r > 2.0 * math.pi:
            self.lfo_phase_r -= 2.0 * math.pi
        
        # Calculate modulated delay times using sine LFO
        lfo_l = math.sin(self.lfo_phase_l)  # -1 to 1
        lfo_r = math.sin(self.lfo_phase_r)  # -1 to 1
        
        # Delay time = base + (lfo * depth)
        delay_l = self.delay_samples + (lfo_l * self.depth_samples)
        delay_r = self.delay_samples + (lfo_r * self.depth_samples)
        
        # Calculate read positions (samples back from write position)
        read_pos_l = self.write_pos - delay_l
        read_pos_r = self.write_pos - delay_r
        
        # Read from delay buffers with interpolation
        delayed_l = self._read_delay_linear(self.delay_buffer_l, read_pos_l)
        delayed_r = self._read_delay_linear(self.delay_buffer_r, read_pos_r)
        
        # Mix with feedback (optional - some chorus designs omit this)
        self.delay_buffer_l[self.write_pos] = (
            left + delayed_l * self.feedback_linear
        )
        self.delay_buffer_r[self.write_pos] = (
            right + delayed_r * self.feedback_linear
        )
        
        # Advance write pointer
        self.write_pos = (self.write_pos + 1) % len(self.delay_buffer_l)
        
        # Mix dry and wet signals
        out_l = left * self.dry_mix_linear + delayed_l * self.wet_mix_linear
        out_r = right * self.dry_mix_linear + delayed_r * self.wet_mix_linear
        
        return (out_l, out_r)
    
    def process_block(
        self,
        left: np.ndarray,
        right: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Process a block of stereo samples.
        
        Args:
            left: Left channel input array
            right: Right channel input array
        
        Returns:
            Tuple of (left_output, right_output) arrays
        """
        out_l = np.zeros_like(left)
        out_r = np.zeros_like(right)
        
        for i in range(len(left)):
            out_l[i], out_r[i] = self.process_sample(left[i], right[i])
        
        return (out_l, out_r)
    
    def reset(self):
        """Clear delay buffers and reset to initial state."""
        self.delay_buffer_l.fill(0.0)
        self.delay_buffer_r.fill(0.0)
        self.write_pos = 0
        self.lfo_phase_l = 0.0
        self.lfo_phase_r = 0.0


# ============================================================================
# PRESET CONFIGURATIONS
# ============================================================================

CHORUS_PRESETS = {
    "subtle": {
        "delay_ms": 25.0,
        "rate_hz": 0.8,
        "depth_ms": 5.0,
        "feedback_db": -120.0,  # No feedback for subtle effect
        "wet_mix_db": -12.0,
        "dry_mix_db": -2.0,
        "stereo_offset": 90.0,
    },
    "classic": {
        "delay_ms": 40.0,
        "rate_hz": 1.5,
        "depth_ms": 10.0,
        "feedback_db": -60.0,
        "wet_mix_db": -6.0,
        "dry_mix_db": -6.0,
        "stereo_offset": 90.0,
    },
    "rich": {
        "delay_ms": 50.0,
        "rate_hz": 1.2,
        "depth_ms": 12.0,
        "feedback_db": -30.0,
        "wet_mix_db": -3.0,
        "dry_mix_db": -3.0,
        "stereo_offset": 120.0,
    },
    "vintage": {
        "delay_ms": 35.0,
        "rate_hz": 0.6,
        "depth_ms": 8.0,
        "feedback_db": -90.0,
        "wet_mix_db": -9.0,
        "dry_mix_db": -4.0,
        "stereo_offset": 135.0,
    },
    "thick": {
        "delay_ms": 60.0,
        "rate_hz": 0.9,
        "depth_ms": 15.0,
        "feedback_db": -40.0,
        "wet_mix_db": -4.0,
        "dry_mix_db": -2.0,
        "stereo_offset": 90.0,
    },
}


def create_chorus(preset: str = "classic", sample_rate: int = 44100) -> Chorus:
    """
    Create a chorus effect with a preset.
    
    Args:
        preset: Preset name ("subtle", "classic", "rich", "vintage", "thick")
        sample_rate: Sample rate in Hz
    
    Returns:
        Configured Chorus instance
    """
    if preset not in CHORUS_PRESETS:
        raise ValueError(f"Unknown preset: {preset}. Available: {list(CHORUS_PRESETS.keys())}")
    
    params = CHORUS_PRESETS[preset]
    return Chorus(sample_rate=sample_rate, **params)


# ============================================================================
# TEST & DEMONSTRATION
# ============================================================================

if __name__ == "__main__":
    """Test chorus effect with a test signal."""
    
    sr = 44100
    duration_s = 2.0
    n_samples = int(sr * duration_s)
    
    # Create test signal (sine wave)
    freq = 440  # A4
    t = np.arange(n_samples) / sr
    test_signal = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)
    
    # Process with chorus
    chorus = create_chorus("classic", sample_rate=sr)
    
    out_l, out_r = chorus.process_block(test_signal, test_signal)
    
    # Check output is reasonable
    peak_l = np.max(np.abs(out_l))
    peak_r = np.max(np.abs(out_r))
    
    print(f"✓ Chorus effect test passed")
    print(f"  Input peak: {np.max(np.abs(test_signal)):.4f}")
    print(f"  Output L peak: {peak_l:.4f}")
    print(f"  Output R peak: {peak_r:.4f}")
    print(f"  Samples processed: {n_samples}")
