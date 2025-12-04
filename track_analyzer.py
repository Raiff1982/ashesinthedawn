"""
Track-Specific Analysis System
Advanced pattern recognition and track-type intelligence
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# TRACK PROFILE SYSTEM
# ============================================================================

@dataclass
class TrackProfile:
    """Complete profile of a track with learned characteristics"""
    track_id: str
    track_type: str
    track_name: str
    
    # Audio characteristics
    avg_frequency_spectrum: Dict[str, float] = field(default_factory=dict)
    dynamic_range_db: float = 0.0
    peak_level_db: float = -96.0
    rms_level_db: float = -96.0
    stereo_width: float = 0.0
    
    # Pattern recognition
    detected_patterns: List[str] = field(default_factory=list)
    tempo_locked: bool = False
    key_detected: Optional[str] = None
    
    # Mixing state
    has_eq: bool = False
    has_compression: bool = False
    has_reverb: bool = False
    has_delay: bool = False
    
    # Quality metrics
    quality_score: float = 0.0
    issues: List[Dict[str, Any]] = field(default_factory=list)
    
    # Learning data
    analysis_count: int = 0
    last_analyzed: Optional[str] = None

class TrackIssueType(Enum):
    """Types of issues that can be detected"""
    CLIPPING = "clipping"
    PHASE_PROBLEMS = "phase_problems"
    FREQUENCY_IMBALANCE = "frequency_imbalance"
    WEAK_DYNAMICS = "weak_dynamics"
    EXCESSIVE_COMPRESSION = "excessive_compression"
    POOR_STEREO_IMAGE = "poor_stereo_image"
    TIMING_ISSUES = "timing_issues"
    TONAL_PROBLEMS = "tonal_problems"

# ============================================================================
# PATTERN RECOGNITION ENGINE
# ============================================================================

class PatternRecognitionEngine:
    """Detect patterns in audio tracks"""
    
    @classmethod
    def detect_rhythm_pattern(cls, audio: np.ndarray, sample_rate: int = 44100) -> Dict[str, Any]:
        """
        Detect rhythmic patterns in audio
        
        Returns:
            Dict with tempo, beat positions, and rhythmic characteristics
        """
        try:
            # Simple envelope detection for rhythm
            envelope = cls._calculate_envelope(audio, sample_rate)
            
            # Detect peaks (potential beats)
            peaks = cls._detect_peaks(envelope)
            
            # Estimate tempo from peak intervals
            if len(peaks) > 2:
                intervals = np.diff(peaks) / sample_rate
                avg_interval = np.median(intervals)
                tempo_bpm = 60 / avg_interval if avg_interval > 0 else 0
            else:
                tempo_bpm = 0
            
            return {
                "estimated_tempo_bpm": float(tempo_bpm),
                "beat_count": len(peaks),
                "rhythmic": len(peaks) > 4,
                "confidence": 0.7 if len(peaks) > 4 else 0.3
            }
        except Exception as e:
            logger.error(f"Rhythm pattern detection failed: {e}")
            return {"estimated_tempo_bpm": 0, "beat_count": 0, "rhythmic": False, "confidence": 0}
    
    @classmethod
    def detect_harmonic_content(cls, audio: np.ndarray, sample_rate: int = 44100) -> Dict[str, Any]:
        """
        Analyze harmonic content
        
        Returns:
            Dict with fundamental frequency, harmonics, and tonal quality
        """
        try:
            # FFT analysis
            fft_result = np.fft.rfft(audio)
            frequencies = np.fft.rfftfreq(len(audio), 1/sample_rate)
            magnitudes = np.abs(fft_result)
            
            # Find fundamental frequency (strongest component)
            if len(magnitudes) > 0:
                fundamental_idx = np.argmax(magnitudes)
                fundamental_freq = frequencies[fundamental_idx]
            else:
                fundamental_freq = 0
            
            # Calculate harmonic-to-noise ratio (simplified)
            total_energy = np.sum(magnitudes)
            harmonic_energy = np.max(magnitudes) * 5  # Approximate
            hnr = (harmonic_energy / total_energy) if total_energy > 0 else 0
            
            return {
                "fundamental_frequency_hz": float(fundamental_freq),
                "harmonic_to_noise_ratio": float(hnr),
                "tonal": hnr > 0.3,
                "confidence": 0.75
            }
        except Exception as e:
            logger.error(f"Harmonic content detection failed: {e}")
            return {"fundamental_frequency_hz": 0, "harmonic_to_noise_ratio": 0, "tonal": False, "confidence": 0}
    
    @classmethod
    def detect_transients(cls, audio: np.ndarray, sample_rate: int = 44100) -> Dict[str, Any]:
        """
        Detect transient events (drum hits, plucks, etc.)
        
        Returns:
            Dict with transient positions and characteristics
        """
        try:
            # Calculate amplitude envelope
            envelope = cls._calculate_envelope(audio, sample_rate)
            
            # Detect sharp increases (transients)
            diff = np.diff(envelope)
            threshold = np.std(diff) * 3
            transients = np.where(diff > threshold)[0]
            
            # Calculate transient density
            duration_seconds = len(audio) / sample_rate
            transient_density = len(transients) / duration_seconds if duration_seconds > 0 else 0
            
            return {
                "transient_count": int(len(transients)),
                "transient_density_per_second": float(transient_density),
                "has_transients": len(transients) > 5,
                "confidence": 0.8
            }
        except Exception as e:
            logger.error(f"Transient detection failed: {e}")
            return {"transient_count": 0, "transient_density_per_second": 0, "has_transients": False, "confidence": 0}
    
    @classmethod
    def _calculate_envelope(cls, audio: np.ndarray, sample_rate: int, window_ms: float = 10) -> np.ndarray:
        """Calculate amplitude envelope"""
        window_samples = int(sample_rate * window_ms / 1000)
        envelope = np.abs(audio)
        
        # Simple moving average for smoothing
        if len(envelope) > window_samples:
            envelope = np.convolve(envelope, np.ones(window_samples)/window_samples, mode='same')
        
        return envelope
    
    @classmethod
    def _detect_peaks(cls, signal: np.ndarray, threshold_factor: float = 0.3) -> np.ndarray:
        """Detect peaks in signal"""
        threshold = np.max(signal) * threshold_factor
        peaks = []
        
        for i in range(1, len(signal) - 1):
            if signal[i] > threshold and signal[i] > signal[i-1] and signal[i] > signal[i+1]:
                peaks.append(i)
        
        return np.array(peaks)

# ============================================================================
# TRACK-SPECIFIC ANALYZER
# ============================================================================

class TrackSpecificAnalyzer:
    """Comprehensive track analysis with pattern recognition"""
    
    def __init__(self):
        self.pattern_engine = PatternRecognitionEngine()
        self.track_profiles: Dict[str, TrackProfile] = {}
    
    def analyze_track(
        self,
        track_id: str,
        track_type: str,
        track_name: str,
        audio_data: Optional[np.ndarray] = None,
        sample_rate: int = 44100,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TrackProfile:
        """
        Perform comprehensive track analysis
        
        Args:
            track_id: Unique track identifier
            track_type: Type of track (vocals, drums, etc.)
            track_name: Display name
            audio_data: Optional audio buffer
            sample_rate: Sample rate
            metadata: Additional metadata
            
        Returns:
            TrackProfile with complete analysis
        """
        # Get or create profile
        if track_id in self.track_profiles:
            profile = self.track_profiles[track_id]
        else:
            profile = TrackProfile(
                track_id=track_id,
                track_type=track_type,
                track_name=track_name
            )
        
        # Update basic info
        profile.track_name = track_name
        profile.track_type = track_type
        profile.analysis_count += 1
        
        # Metadata-based analysis
        if metadata:
            self._analyze_metadata(profile, metadata)
        
        # Audio-based analysis
        if audio_data is not None:
            self._analyze_audio(profile, audio_data, sample_rate)
        
        # Calculate quality score
        profile.quality_score = self._calculate_quality_score(profile)
        
        # Store profile
        self.track_profiles[track_id] = profile
        
        return profile
    
    def _analyze_metadata(self, profile: TrackProfile, metadata: Dict[str, Any]) -> None:
        """Analyze track based on metadata"""
        # Check for effects
        inserts = metadata.get('inserts', [])
        profile.has_eq = any('eq' in str(plugin).lower() for plugin in inserts)
        profile.has_compression = any('comp' in str(plugin).lower() for plugin in inserts)
        profile.has_reverb = any('reverb' in str(plugin).lower() for plugin in inserts)
        profile.has_delay = any('delay' in str(plugin).lower() for plugin in inserts)
        
        # Check levels
        volume = metadata.get('volume', -6.0)
        if volume > -1:
            profile.issues.append({
                "type": TrackIssueType.CLIPPING.value,
                "severity": "high",
                "message": f"Volume at {volume:.1f}dB - risk of clipping"
            })
        
        # Check mute/solo state
        if metadata.get('muted'):
            profile.issues.append({
                "type": "workflow",
                "severity": "info",
                "message": "Track is muted"
            })
    
    def _analyze_audio(self, profile: TrackProfile, audio: np.ndarray, sample_rate: int) -> None:
        """Analyze audio buffer"""
        try:
            # Convert to mono if stereo
            if audio.ndim > 1:
                mono_audio = np.mean(audio, axis=1)
                # Calculate stereo width
                if audio.shape[1] == 2:
                    correlation = np.corrcoef(audio[:, 0], audio[:, 1])[0, 1]
                    profile.stereo_width = 1 - abs(correlation)  # 0 = mono, 1 = wide stereo
            else:
                mono_audio = audio
                profile.stereo_width = 0
            
            # Basic level analysis
            rms = np.sqrt(np.mean(mono_audio ** 2))
            peak = np.max(np.abs(mono_audio))
            
            profile.rms_level_db = 20 * np.log10(rms) if rms > 0 else -96
            profile.peak_level_db = 20 * np.log10(peak) if peak > 0 else -96
            
            # Dynamic range
            crest_factor = peak / rms if rms > 0 else 1
            profile.dynamic_range_db = 20 * np.log10(crest_factor) if crest_factor > 0 else 0
            
            # Pattern recognition
            rhythm_analysis = self.pattern_engine.detect_rhythm_pattern(mono_audio, sample_rate)
            harmonic_analysis = self.pattern_engine.detect_harmonic_content(mono_audio, sample_rate)
            transient_analysis = self.pattern_engine.detect_transients(mono_audio, sample_rate)
            
            # Store detected patterns
            profile.detected_patterns = []
            
            if rhythm_analysis['rhythmic']:
                profile.detected_patterns.append("rhythmic")
                if rhythm_analysis['estimated_tempo_bpm'] > 0:
                    profile.tempo_locked = True
            
            if harmonic_analysis['tonal']:
                profile.detected_patterns.append("tonal")
            
            if transient_analysis['has_transients']:
                profile.detected_patterns.append("percussive")
            
            # Detect issues
            if profile.dynamic_range_db < 6:
                profile.issues.append({
                    "type": TrackIssueType.EXCESSIVE_COMPRESSION.value,
                    "severity": "medium",
                    "message": f"Very low dynamic range ({profile.dynamic_range_db:.1f}dB) - possibly over-compressed"
                })
            
            if profile.stereo_width > 0.95:
                profile.issues.append({
                    "type": TrackIssueType.POOR_STEREO_IMAGE.value,
                    "severity": "low",
                    "message": "Extremely wide stereo - check for phase issues"
                })
            
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
    
    def _calculate_quality_score(self, profile: TrackProfile) -> float:
        """Calculate overall quality score (0-100)"""
        score = 100.0
        
        # Deduct for issues
        for issue in profile.issues:
            severity = issue.get('severity', 'low')
            if severity == 'high':
                score -= 20
            elif severity == 'medium':
                score -= 10
            elif severity == 'low':
                score -= 5
        
        # Bonus for good practices
        if profile.has_eq:
            score += 5
        if profile.has_compression:
            score += 5
        
        # Dynamic range scoring
        if 8 <= profile.dynamic_range_db <= 20:
            score += 10  # Good dynamic range
        
        # Level scoring
        if -6 <= profile.peak_level_db <= -3:
            score += 10  # Good headroom
        
        return max(0, min(100, score))
    
    def get_track_profile(self, track_id: str) -> Optional[TrackProfile]:
        """Get stored track profile"""
        return self.track_profiles.get(track_id)
    
    def compare_tracks(self, track_id_1: str, track_id_2: str) -> Dict[str, Any]:
        """Compare two tracks"""
        profile1 = self.track_profiles.get(track_id_1)
        profile2 = self.track_profiles.get(track_id_2)
        
        if not profile1 or not profile2:
            return {"error": "One or both tracks not found"}
        
        return {
            "level_difference_db": abs(profile1.peak_level_db - profile2.peak_level_db),
            "dynamic_range_difference_db": abs(profile1.dynamic_range_db - profile2.dynamic_range_db),
            "quality_score_difference": abs(profile1.quality_score - profile2.quality_score),
            "shared_patterns": list(set(profile1.detected_patterns) & set(profile2.detected_patterns)),
            "recommendation": self._get_comparison_recommendation(profile1, profile2)
        }
    
    def _get_comparison_recommendation(self, profile1: TrackProfile, profile2: TrackProfile) -> str:
        """Get recommendation based on track comparison"""
        level_diff = abs(profile1.peak_level_db - profile2.peak_level_db)
        
        if level_diff > 6:
            louder = profile1.track_name if profile1.peak_level_db > profile2.peak_level_db else profile2.track_name
            return f"Large level difference detected - consider reducing {louder} to balance mix"
        
        if profile1.dynamic_range_db > profile2.dynamic_range_db + 10:
            return f"{profile1.track_name} has much wider dynamics - consider compression for consistency"
        
        return "Tracks are relatively balanced"
    
    def generate_track_report(self, track_id: str) -> Dict[str, Any]:
        """Generate comprehensive track report"""
        profile = self.track_profiles.get(track_id)
        
        if not profile:
            return {"error": "Track not found"}
        
        return {
            "track_id": profile.track_id,
            "track_name": profile.track_name,
            "track_type": profile.track_type,
            "quality_score": profile.quality_score,
            "levels": {
                "peak_db": profile.peak_level_db,
                "rms_db": profile.rms_level_db,
                "dynamic_range_db": profile.dynamic_range_db
            },
            "spatial": {
                "stereo_width": profile.stereo_width
            },
            "patterns": profile.detected_patterns,
            "effects": {
                "has_eq": profile.has_eq,
                "has_compression": profile.has_compression,
                "has_reverb": profile.has_reverb,
                "has_delay": profile.has_delay
            },
            "issues": profile.issues,
            "analysis_count": profile.analysis_count
        }

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    analyzer = TrackSpecificAnalyzer()
    
    # Example: Analyze a vocal track
    # audio_data = np.random.randn(44100 * 3)  # 3 seconds
    # profile = analyzer.analyze_track(
    #     track_id="vocal-001",
    #     track_type="vocals",
    #     track_name="Lead Vocal",
    #     audio_data=audio_data,
    #     metadata={"volume": -8.5, "inserts": ["EQ", "Compressor"]}
    # )
    
    # print(f"Quality Score: {profile.quality_score}/100")
    # print(f"Patterns: {profile.detected_patterns}")
    # print(f"Issues: {len(profile.issues)}")
    
    print("? Track-Specific Analyzer loaded")
