"""
Intelligent Mixing Suggestion Generator
Real-time audio analysis and context-aware mixing recommendations
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# DATA STRUCTURES
# ============================================================================

class MixingProblemSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class MixingProblem:
    """Detected mixing problem"""
    problem: str
    severity: MixingProblemSeverity
    frequency_range: Optional[Tuple[float, float]] = None
    solution: str = ""
    technical_detail: str = ""
    confidence: float = 0.85

@dataclass
class MixingSuggestion:
    """Context-aware mixing suggestion"""
    type: str  # eq, compression, spatial, gain_staging, etc.
    title: str
    description: str
    parameters: Dict[str, Any]
    priority: int  # 1-5, 1=highest
    confidence: float
    reasoning: str

@dataclass
class FrequencyAnalysis:
    """Frequency spectrum analysis result"""
    dominant_frequencies: List[float]
    frequency_balance: Dict[str, float]  # sub_bass, bass, mids, highs, air
    problem_frequencies: List[Tuple[float, str]]  # (frequency, reason)
    recommendations: List[str]

# ============================================================================
# FREQUENCY ANALYZER
# ============================================================================

class FrequencyAnalyzer:
    """Real-time frequency analysis for mixing suggestions"""
    
    # Frequency band definitions (Hz)
    BANDS = {
        'sub_bass': (20, 60),
        'bass': (60, 250),
        'low_mids': (250, 500),
        'mids': (500, 2000),
        'upper_mids': (2000, 4000),
        'highs': (4000, 8000),
        'air': (8000, 20000)
    }
    
    @classmethod
    def analyze_spectrum(cls, audio_buffer: np.ndarray, sample_rate: int = 44100) -> FrequencyAnalysis:
        """
        Analyze frequency spectrum of audio buffer
        
        Args:
            audio_buffer: Audio samples (mono or stereo)
            sample_rate: Sample rate in Hz
            
        Returns:
            FrequencyAnalysis object with recommendations
        """
        try:
            # Convert to mono if stereo
            if audio_buffer.ndim > 1:
                audio_buffer = np.mean(audio_buffer, axis=1)
            
            # Perform FFT
            fft_result = np.fft.rfft(audio_buffer)
            frequencies = np.fft.rfftfreq(len(audio_buffer), 1/sample_rate)
            magnitudes = np.abs(fft_result)
            
            # Analyze frequency balance
            frequency_balance = cls._calculate_band_energy(frequencies, magnitudes)
            
            # Find dominant frequencies
            dominant_frequencies = cls._find_dominant_frequencies(frequencies, magnitudes, top_n=5)
            
            # Detect problem frequencies
            problem_frequencies = cls._detect_problem_frequencies(frequency_balance)
            
            # Generate recommendations
            recommendations = cls._generate_frequency_recommendations(frequency_balance, problem_frequencies)
            
            return FrequencyAnalysis(
                dominant_frequencies=dominant_frequencies,
                frequency_balance=frequency_balance,
                problem_frequencies=problem_frequencies,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Frequency analysis failed: {e}")
            # Return safe default
            return FrequencyAnalysis(
                dominant_frequencies=[],
                frequency_balance={band: 0.0 for band in cls.BANDS.keys()},
                problem_frequencies=[],
                recommendations=["Unable to analyze frequency content"]
            )
    
    @classmethod
    def _calculate_band_energy(cls, frequencies: np.ndarray, magnitudes: np.ndarray) -> Dict[str, float]:
        """Calculate energy in each frequency band"""
        band_energy = {}
        total_energy = np.sum(magnitudes)
        
        if total_energy == 0:
            return {band: 0.0 for band in cls.BANDS.keys()}
        
        for band_name, (low, high) in cls.BANDS.items():
            mask = (frequencies >= low) & (frequencies <= high)
            energy = np.sum(magnitudes[mask])
            band_energy[band_name] = energy / total_energy
        
        return band_energy
    
    @classmethod
    def _find_dominant_frequencies(cls, frequencies: np.ndarray, magnitudes: np.ndarray, top_n: int = 5) -> List[float]:
        """Find top N dominant frequencies"""
        # Get indices of top magnitudes
        top_indices = np.argsort(magnitudes)[-top_n:][::-1]
        return frequencies[top_indices].tolist()
    
    @classmethod
    def _detect_problem_frequencies(cls, frequency_balance: Dict[str, float]) -> List[Tuple[float, str]]:
        """Detect problematic frequency accumulations"""
        problems = []
        
        # Check for muddy low-mids (200-400Hz)
        if frequency_balance.get('low_mids', 0) > 0.25:
            problems.append((300.0, "Muddy low-mids accumulation"))
        
        # Check for harsh upper-mids (2-4kHz)
        if frequency_balance.get('upper_mids', 0) > 0.30:
            problems.append((3000.0, "Harsh upper-mid frequencies"))
        
        # Check for weak bass
        if frequency_balance.get('bass', 0) < 0.10:
            problems.append((80.0, "Weak bass frequencies"))
        
        # Check for missing air
        if frequency_balance.get('air', 0) < 0.05:
            problems.append((10000.0, "Missing air frequencies"))
        
        return problems
    
    @classmethod
    def _generate_frequency_recommendations(cls, balance: Dict[str, float], problems: List[Tuple[float, str]]) -> List[str]:
        """Generate EQ recommendations based on analysis"""
        recommendations = []
        
        # Address specific problems first
        for freq, reason in problems:
            if "muddy" in reason.lower():
                recommendations.append(f"Cut {freq:.0f}Hz by 2-4dB to reduce muddiness")
            elif "harsh" in reason.lower():
                recommendations.append(f"Reduce {freq:.0f}Hz by 2-3dB to tame harshness")
            elif "weak" in reason.lower():
                recommendations.append(f"Boost {freq:.0f}Hz by 2-4dB to enhance low-end")
            elif "missing" in reason.lower():
                recommendations.append(f"Add gentle shelf boost above {freq:.0f}Hz for air")
        
        # General balance recommendations
        if balance.get('bass', 0) > 0.30:
            recommendations.append("High-pass filter below 30Hz to clean up sub-bass")
        
        if balance.get('mids', 0) < 0.15:
            recommendations.append("Boost 1-2kHz range for presence and definition")
        
        return recommendations

# ============================================================================
# DYNAMICS ANALYZER
# ============================================================================

class DynamicsAnalyzer:
    """Analyze dynamics and suggest compression settings"""
    
    @classmethod
    def analyze_dynamics(cls, audio_buffer: np.ndarray, sample_rate: int = 44100) -> Dict[str, Any]:
        """
        Analyze dynamic range and suggest compression
        
        Args:
            audio_buffer: Audio samples
            sample_rate: Sample rate in Hz
            
        Returns:
            Dict with dynamics analysis and compression suggestions
        """
        try:
            # Convert to mono if stereo
            if audio_buffer.ndim > 1:
                audio_buffer = np.mean(audio_buffer, axis=1)
            
            # Calculate RMS and peak levels
            rms = cls._calculate_rms(audio_buffer)
            peak = np.max(np.abs(audio_buffer))
            
            # Calculate crest factor (peak to RMS ratio)
            crest_factor = peak / rms if rms > 0 else 0
            
            # Analyze dynamic range
            dynamic_range_db = 20 * np.log10(crest_factor) if crest_factor > 0 else 0
            
            # Generate compression suggestions
            suggestions = cls._generate_compression_suggestions(dynamic_range_db, rms, peak)
            
            return {
                "rms": float(rms),
                "peak": float(peak),
                "crest_factor": float(crest_factor),
                "dynamic_range_db": float(dynamic_range_db),
                "suggestions": suggestions
            }
            
        except Exception as e:
            logger.error(f"Dynamics analysis failed: {e}")
            return {
                "rms": 0.0,
                "peak": 0.0,
                "crest_factor": 0.0,
                "dynamic_range_db": 0.0,
                "suggestions": ["Unable to analyze dynamics"]
            }
    
    @classmethod
    def _calculate_rms(cls, audio: np.ndarray) -> float:
        """Calculate RMS level"""
        return np.sqrt(np.mean(audio ** 2))
    
    @classmethod
    def _generate_compression_suggestions(cls, dynamic_range_db: float, rms: float, peak: float) -> List[str]:
        """Generate compression parameter suggestions"""
        suggestions = []
        
        # Wide dynamic range (needs compression)
        if dynamic_range_db > 20:
            suggestions.append("Use compression with 4:1 ratio to control dynamics")
            suggestions.append("Set attack time to 10-30ms to preserve transients")
            suggestions.append("Set release time to match tempo or use auto-release")
            suggestions.append("Aim for 3-6dB gain reduction on peaks")
        
        # Moderate dynamic range
        elif dynamic_range_db > 12:
            suggestions.append("Apply gentle compression with 2:1 to 3:1 ratio")
            suggestions.append("Use slower attack (20-50ms) for natural sound")
            suggestions.append("Target 2-4dB gain reduction")
        
        # Already compressed
        elif dynamic_range_db < 8:
            suggestions.append("?? Signal already heavily compressed")
            suggestions.append("Consider using less compression or parallel compression")
        
        # Check for clipping risk
        peak_db = 20 * np.log10(peak) if peak > 0 else -96
        if peak_db > -3:
            suggestions.append("?? Peak level too high - reduce gain before compression")
        
        return suggestions

# ============================================================================
# INTELLIGENT MIXING SUGGESTION GENERATOR
# ============================================================================

class IntelligentMixingSuggestionGenerator:
    """
    Main class for generating context-aware mixing suggestions
    Combines frequency analysis, dynamics analysis, and DAW knowledge
    """
    
    def __init__(self):
        self.frequency_analyzer = FrequencyAnalyzer()
        self.dynamics_analyzer = DynamicsAnalyzer()
    
    def generate_suggestions(
        self,
        track_type: str,
        audio_data: Optional[np.ndarray] = None,
        sample_rate: int = 44100,
        track_info: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[MixingSuggestion]:
        """
        Generate comprehensive mixing suggestions
        
        Args:
            track_type: Type of track (vocals, drums, bass, etc.)
            audio_data: Optional audio buffer for analysis
            sample_rate: Sample rate
            track_info: Track metadata (volume, muted, etc.)
            context: Additional context (project BPM, genre, etc.)
            
        Returns:
            List of MixingSuggestion objects
        """
        suggestions = []
        
        # 1. Track-type specific suggestions (always available)
        suggestions.extend(self._get_track_type_suggestions(track_type))
        
        # 2. Audio analysis-based suggestions (if audio provided)
        if audio_data is not None:
            suggestions.extend(self._get_audio_analysis_suggestions(audio_data, sample_rate, track_type))
        
        # 3. Context-aware suggestions (based on track state)
        if track_info:
            suggestions.extend(self._get_context_suggestions(track_info, track_type))
        
        # 4. Project-wide suggestions (based on overall context)
        if context:
            suggestions.extend(self._get_project_suggestions(context, track_type))
        
        # Sort by priority
        suggestions.sort(key=lambda x: x.priority)
        
        return suggestions
    
    def _get_track_type_suggestions(self, track_type: str) -> List[MixingSuggestion]:
        """Get default suggestions based on track type"""
        suggestions = []
        
        if track_type == "vocals":
            suggestions.extend([
                MixingSuggestion(
                    type="eq",
                    title="Vocal High-Pass Filter",
                    description="Apply high-pass filter at 80-100Hz to remove rumble and mud",
                    parameters={"frequency": 90, "slope": 12, "type": "high_pass"},
                    priority=1,
                    confidence=0.9,
                    reasoning="Remove unnecessary low frequencies that muddy the mix"
                ),
                MixingSuggestion(
                    type="eq",
                    title="Presence Boost",
                    description="Boost 3-5kHz range by 2-3dB for vocal clarity and presence",
                    parameters={"frequency": 4000, "gain": 2.5, "q": 1.5, "type": "peak"},
                    priority=2,
                    confidence=0.85,
                    reasoning="Enhance vocal intelligibility and presence in the mix"
                ),
                MixingSuggestion(
                    type="compression",
                    title="Vocal Compression",
                    description="Apply compression with 3:1 to 6:1 ratio for consistent level",
                    parameters={"ratio": 4.0, "attack": 10, "release": 100, "threshold": -18},
                    priority=2,
                    confidence=0.9,
                    reasoning="Control dynamic range for consistent vocal performance"
                )
            ])
        
        elif track_type == "drums":
            suggestions.extend([
                MixingSuggestion(
                    type="eq",
                    title="Drum High-Pass",
                    description="High-pass filter individual drums except kick and snare",
                    parameters={"frequency": 100, "slope": 12, "type": "high_pass"},
                    priority=1,
                    confidence=0.85,
                    reasoning="Clean up unnecessary low frequencies from cymbals and toms"
                ),
                MixingSuggestion(
                    type="compression",
                    title="Parallel Compression",
                    description="Use parallel compression for punchy, powerful drums",
                    parameters={"ratio": 8.0, "attack": 1, "release": 50, "mix": 30},
                    priority=2,
                    confidence=0.8,
                    reasoning="Add power and sustain while maintaining transient impact"
                )
            ])
        
        elif track_type == "bass":
            suggestions.extend([
                MixingSuggestion(
                    type="eq",
                    title="Sub-Bass Control",
                    description="Boost fundamental frequency 50-100Hz, control below 30Hz",
                    parameters={"low_shelf_freq": 30, "low_shelf_gain": -3, "peak_freq": 80, "peak_gain": 2},
                    priority=1,
                    confidence=0.9,
                    reasoning="Enhance low-end weight while avoiding mud and rumble"
                ),
                MixingSuggestion(
                    type="compression",
                    title="Bass Compression",
                    description="Heavy compression (4:1 to 8:1) for consistent, tight low-end",
                    parameters={"ratio": 6.0, "attack": 20, "release": 100, "threshold": -20},
                    priority=1,
                    confidence=0.9,
                    reasoning="Maintain consistent low-end energy throughout the track"
                )
            ])
        
        return suggestions
    
    def _get_audio_analysis_suggestions(self, audio_data: np.ndarray, sample_rate: int, track_type: str) -> List[MixingSuggestion]:
        """Generate suggestions based on audio analysis"""
        suggestions = []
        
        # Frequency analysis
        freq_analysis = self.frequency_analyzer.analyze_spectrum(audio_data, sample_rate)
        
        for recommendation in freq_analysis.recommendations:
            suggestions.append(MixingSuggestion(
                type="eq",
                title="Frequency Balance Adjustment",
                description=recommendation,
                parameters=self._parse_eq_recommendation(recommendation),
                priority=2,
                confidence=0.8,
                reasoning="Based on frequency spectrum analysis"
            ))
        
        # Dynamics analysis
        dynamics = self.dynamics_analyzer.analyze_dynamics(audio_data, sample_rate)
        
        for suggestion_text in dynamics["suggestions"]:
            if "compression" in suggestion_text.lower():
                suggestions.append(MixingSuggestion(
                    type="compression",
                    title="Dynamics Control",
                    description=suggestion_text,
                    parameters=self._parse_compression_recommendation(suggestion_text),
                    priority=2,
                    confidence=0.75,
                    reasoning=f"Dynamic range: {dynamics['dynamic_range_db']:.1f}dB"
                ))
        
        return suggestions
    
    def _get_context_suggestions(self, track_info: Dict[str, Any], track_type: str) -> List[MixingSuggestion]:
        """Generate suggestions based on track state"""
        suggestions = []
        
        # Check peak level
        peak_level = track_info.get('peak_level', -6.0)
        if peak_level > -3:
            suggestions.append(MixingSuggestion(
                type="gain_staging",
                title="Reduce Gain",
                description=f"Peak level at {peak_level:.1f}dB is too high - reduce gain by {abs(peak_level + 6):.1f}dB",
                parameters={"gain_reduction": abs(peak_level + 6)},
                priority=1,
                confidence=0.95,
                reasoning="Prevent clipping and maintain headroom"
            ))
        elif peak_level < -12:
            suggestions.append(MixingSuggestion(
                type="gain_staging",
                title="Increase Gain",
                description=f"Peak level at {peak_level:.1f}dB is low - increase gain by {abs(peak_level + 6):.1f}dB",
                parameters={"gain_increase": abs(peak_level + 6)},
                priority=3,
                confidence=0.8,
                reasoning="Improve signal-to-noise ratio"
            ))
        
        # Check if muted/soloed
        if track_info.get('muted'):
            suggestions.append(MixingSuggestion(
                type="workflow",
                title="Track Muted",
                description="?? Track is currently muted - unmute to hear changes",
                parameters={},
                priority=1,
                confidence=1.0,
                reasoning="Workflow awareness"
            ))
        
        if track_info.get('soloed'):
            suggestions.append(MixingSuggestion(
                type="workflow",
                title="Solo Mode Active",
                description="?? Remember to check mix in full context (unsolo)",
                parameters={},
                priority=4,
                confidence=1.0,
                reasoning="Workflow best practice"
            ))
        
        return suggestions
    
    def _get_project_suggestions(self, context: Dict[str, Any], track_type: str) -> List[MixingSuggestion]:
        """Generate suggestions based on project context"""
        suggestions = []
        
        bpm = context.get('bpm', 120)
        genre = context.get('genre', 'unknown')
        
        # BPM-related suggestions
        if track_type in ["drums", "percussion"]:
            delay_time = 60000 / bpm  # Quarter note in ms
            suggestions.append(MixingSuggestion(
                type="effects",
                title="Tempo-Synced Delay",
                description=f"Use {delay_time:.0f}ms delay (quarter note at {bpm} BPM) for rhythmic interest",
                parameters={"delay_time_ms": delay_time, "feedback": 0.3, "mix": 0.2},
                priority=4,
                confidence=0.7,
                reasoning="Tempo-synced effects enhance groove"
            ))
        
        return suggestions
    
    def _parse_eq_recommendation(self, recommendation: str) -> Dict[str, Any]:
        """Parse EQ recommendation text into parameters"""
        # Simple parser - could be enhanced with NLP
        params = {}
        
        if "cut" in recommendation.lower():
            params["type"] = "cut"
            params["gain"] = -3.0
        elif "boost" in recommendation.lower():
            params["type"] = "boost"
            params["gain"] = 2.5
        
        # Extract frequency if present
        import re
        freq_match = re.search(r'(\d+)\.?\d*\s*hz', recommendation.lower())
        if freq_match:
            params["frequency"] = float(freq_match.group(1))
        
        return params
    
    def _parse_compression_recommendation(self, recommendation: str) -> Dict[str, Any]:
        """Parse compression recommendation into parameters"""
        params = {"ratio": 4.0, "attack": 20, "release": 100}
        
        if "gentle" in recommendation.lower():
            params["ratio"] = 2.5
        elif "heavy" in recommendation.lower():
            params["ratio"] = 8.0
        
        return params

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    generator = IntelligentMixingSuggestionGenerator()
    
    # Generate suggestions for vocals with audio analysis
    # audio_data = np.random.randn(44100 * 2)  # 2 seconds of audio
    # suggestions = generator.generate_suggestions(
    #     track_type="vocals",
    #     audio_data=audio_data,
    #     sample_rate=44100,
    #     track_info={"peak_level": -8.5, "muted": False, "soloed": False},
    #     context={"bpm": 120, "genre": "pop"}
    # )
    
    # for sug in suggestions:
    #     print(f"[{sug.priority}] {sug.title}: {sug.description}")
    
    print("? Intelligent Mixing Suggestion Generator loaded")
