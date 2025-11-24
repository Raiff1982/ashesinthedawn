"""
Enhanced Codette Analysis Module
Integrates training data into AI analysis for intelligent recommendations
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import json
import statistics
from codette_training_data import (
    training_data, 
    AudioMetrics,
    MIXING_STANDARDS,
    PLUGIN_SUGGESTIONS,
    ANALYSIS_CONTEXTS
)

@dataclass
class AnalysisResult:
    """Structured analysis result"""
    analysis_type: str
    status: str  # "good", "warning", "critical"
    score: float  # 0-100
    findings: List[str]
    recommendations: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    reasoning: str

class CodetteAnalyzer:
    """Enhanced analyzer using training data"""
    
    def __init__(self):
        self.training_data = training_data
        self.history: List[AnalysisResult] = []
    
    def analyze_gain_staging(self, track_metrics: List[Dict[str, Any]]) -> AnalysisResult:
        """Analyze gain staging across all tracks"""
        findings = []
        recommendations = []
        issues_found = 0
        score = 100
        
        # Extract metrics
        peaks = [t.get("peak", -60) for t in track_metrics]
        levels = [t.get("level", -24) for t in track_metrics]
        
        if not peaks:
            return AnalysisResult(
                analysis_type="gain_staging",
                status="warning",
                score=50,
                findings=["No track metrics available"],
                recommendations=[],
                metrics={},
                reasoning="Unable to analyze without track data"
            )
        
        max_peak = max(peaks)
        avg_level = statistics.mean(levels) if levels else -24
        
        # Check for clipping
        if max_peak > 0:
            findings.append(f"Clipping detected: peak at {max_peak:.1f}dB")
            recommendations.append({
                "action": "reduce_gains",
                "parameter": "all_tracks",
                "value": -3,
                "reason": "Prevent digital clipping"
            })
            issues_found += 1
            score -= 25
        
        # Check headroom
        if max_peak > -3:
            findings.append(f"Insufficient headroom: {abs(-3 - max_peak):.1f}dB margin")
            recommendations.append({
                "action": "reduce_volumes",
                "parameter": "master_gain",
                "value": -3 - max_peak,
                "reason": "Maintain safety headroom"
            })
            issues_found += 1
            score -= 15
        
        # Check for weak signals
        weak_tracks = [t for t in track_metrics if t.get("level", -24) < -24]
        if weak_tracks:
            findings.append(f"{len(weak_tracks)} tracks below optimal input level")
            recommendations.append({
                "action": "increase_input_gains",
                "tracks": [t.get("track_id") for t in weak_tracks],
                "reason": "Improve signal-to-noise ratio"
            })
            issues_found += 1
            score -= 10
        
        # Consistent level check
        if len(levels) > 1 and statistics.stdev(levels) > 12:
            findings.append("Inconsistent track levels detected")
            recommendations.append({
                "action": "balance_levels",
                "reason": "Create cohesive mix foundation"
            })
            score -= 10
        
        status = "critical" if issues_found >= 2 else ("warning" if issues_found > 0 else "good")
        
        return AnalysisResult(
            analysis_type="gain_staging",
            status=status,
            score=max(0, score),
            findings=findings or ["Gain staging within acceptable parameters"],
            recommendations=recommendations,
            metrics={
                "max_peak": max_peak,
                "avg_level": avg_level,
                "tracks_analyzed": len(track_metrics),
                "clipping_detected": max_peak > 0,
                "headroom_db": -3 - max_peak if max_peak > -3 else 3
            },
            reasoning=f"Analyzed {len(track_metrics)} tracks. Found {issues_found} issues."
        )
    
    def analyze_mixing(self, 
                      track_metrics: List[Dict[str, Any]],
                      frequency_data: Optional[Dict[str, float]] = None) -> AnalysisResult:
        """Analyze mix balance and frequency distribution"""
        findings = []
        recommendations = []
        score = 100
        
        if not track_metrics:
            return AnalysisResult(
                analysis_type="mixing",
                status="warning",
                score=50,
                findings=["No track data available"],
                recommendations=[],
                metrics={},
                reasoning="Unable to analyze without track metrics"
            )
        
        # Analyze track balance
        levels = [t.get("level", -24) for t in track_metrics if t.get("level")]
        if levels and len(levels) > 1:
            level_variance = statistics.stdev(levels)
            if level_variance > 12:
                findings.append(f"Unbalanced mix: {level_variance:.1f}dB variance")
                recommendations.append({
                    "action": "balance_levels",
                    "reason": "Create cohesive mix with balanced levels"
                })
                score -= 15
        
        # Analyze frequency balance if provided
        if frequency_data:
            low_energy = frequency_data.get("low", 0.5)
            mid_energy = frequency_data.get("mid", 0.5)
            high_energy = frequency_data.get("high", 0.5)
            
            if low_energy > 0.7:
                findings.append("Low end too prominent")
                recommendations.append({
                    "action": "apply_filter",
                    "parameter": "high_pass_filter",
                    "value": 100,
                    "reason": "Tighten low end and reduce muddiness"
                })
                score -= 10
            
            if mid_energy < 0.3:
                findings.append("Scooped mids - lacking presence")
                recommendations.append({
                    "action": "boost_eq",
                    "parameter": "mids_1khz",
                    "value": 3,
                    "reason": "Add presence and clarity"
                })
                score -= 10
            
            if high_energy > 0.8:
                findings.append("Harsh highs - too much presence")
                recommendations.append({
                    "action": "reduce_eq",
                    "parameter": "highs_5khz",
                    "value": -3,
                    "reason": "Smooth harshness while maintaining clarity"
                })
                score -= 5
        
        # Analyze plugin usage by track type
        plugin_count = sum(len(t.get("plugins", [])) for t in track_metrics)
        if plugin_count == 0:
            findings.append("No plugins applied - mix lacks shaping")
            recommendations.append({
                "action": "add_plugins",
                "reason": "Use EQ and compression to shape mix"
            })
            score -= 10
        
        status = "warning" if score < 80 else "good"
        
        return AnalysisResult(
            analysis_type="mixing",
            status=status,
            score=max(0, score),
            findings=findings or ["Mix balance looks good"],
            recommendations=recommendations,
            metrics={
                "tracks_analyzed": len(track_metrics),
                "total_plugins": plugin_count,
                "freq_balance": frequency_data or {}
            },
            reasoning=f"Analyzed {len(track_metrics)} tracks and frequency balance"
        )
    
    def analyze_routing(self, tracks: List[Dict[str, Any]]) -> AnalysisResult:
        """Analyze signal routing and track organization"""
        findings = []
        recommendations = []
        score = 100
        
        track_types = {}
        for track in tracks:
            track_type = track.get("type", "audio")
            track_types[track_type] = track_types.get(track_type, 0) + 1
        
        # Check for proper track organization
        if len(tracks) > 10 and not any(t.get("type") == "aux" for t in tracks):
            findings.append("No auxiliary tracks found in large project")
            recommendations.append({
                "action": "create_aux_tracks",
                "reason": "Use auxes for grouped effects and mixing efficiency"
            })
            score -= 15
        
        # Check for VCA masters
        has_vca = any(t.get("type") == "vca" for t in tracks)
        if len(track_types.get("audio", 0)) > 5 and not has_vca:
            findings.append("No VCA master for bus control")
            recommendations.append({
                "action": "create_vca_master",
                "reason": "Add VCA for controlling bus group together"
            })
            score -= 10
        
        # Check track naming and organization
        unnamed_tracks = [t for t in tracks if not t.get("name") or t.get("name") == ""]
        if unnamed_tracks and len(unnamed_tracks) > len(tracks) * 0.3:
            findings.append(f"{len(unnamed_tracks)} unnamed tracks - poor organization")
            recommendations.append({
                "action": "organize_project",
                "reason": "Name tracks clearly for workflow efficiency"
            })
            score -= 10
        
        if not findings:
            findings.append("Track routing and organization looks well-structured")
        
        status = "warning" if score < 75 else "good"
        
        return AnalysisResult(
            analysis_type="routing",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "track_types": track_types,
                "total_tracks": len(tracks),
                "aux_tracks": sum(1 for t in tracks if t.get("type") == "aux"),
                "vca_masters": sum(1 for t in tracks if t.get("type") == "vca")
            },
            reasoning=f"Analyzed routing for {len(tracks)} tracks"
        )
    
    def analyze_session_health(self, session_data: Dict[str, Any]) -> AnalysisResult:
        """Analyze overall session health and optimization"""
        findings = []
        recommendations = []
        score = 100
        
        # CPU usage analysis
        cpu_usage = session_data.get("cpu_usage", 0)
        if cpu_usage > 80:
            findings.append(f"High CPU usage: {cpu_usage:.1f}%")
            recommendations.append({
                "action": "freeze_plugins",
                "reason": "Freeze virtual instruments to reduce CPU load"
            })
            score -= 20
        elif cpu_usage > 60:
            findings.append(f"Moderate CPU usage: {cpu_usage:.1f}%")
            recommendations.append({
                "action": "monitor_cpu",
                "reason": "Watch for performance issues"
            })
            score -= 5
        
        # Plugin density
        total_plugins = session_data.get("total_plugins", 0)
        track_count = session_data.get("track_count", 1)
        plugins_per_track = total_plugins / track_count if track_count > 0 else 0
        
        if plugins_per_track > 5:
            findings.append(f"Heavy plugin density: {plugins_per_track:.1f} per track")
            recommendations.append({
                "action": "consolidate_chains",
                "reason": "Use fewer, more surgical plugins"
            })
            score -= 15
        
        # Project size
        if track_count > 50:
            findings.append(f"Large project: {track_count} tracks")
            recommendations.append({
                "action": "archive_unused",
                "reason": "Delete or archive unused tracks to clean up"
            })
            score -= 10
        
        # File organization
        if not session_data.get("has_color_coding", False):
            findings.append("Tracks not color-coded")
            recommendations.append({
                "action": "organize_colors",
                "reason": "Color-code tracks by instrument family"
            })
            score -= 5
        
        if not findings:
            findings.append("Session is well-organized and efficient")
        
        status = "critical" if score < 50 else ("warning" if score < 75 else "good")
        
        return AnalysisResult(
            analysis_type="session",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "cpu_usage": cpu_usage,
                "track_count": track_count,
                "total_plugins": total_plugins,
                "plugins_per_track": plugins_per_track
            },
            reasoning=f"Analyzed session with {track_count} tracks, {total_plugins} plugins"
        )
    
    def analyze_mastering_readiness(self, master_metrics: Dict[str, Any]) -> AnalysisResult:
        """Analyze if mix is ready for mastering"""
        findings = []
        recommendations = []
        score = 100
        
        standards = MIXING_STANDARDS["reference_levels"]
        
        # Check loudness
        loudness = master_metrics.get("loudness_lufs", -18)
        target_loudness = standards["target_loudness"]
        if abs(loudness - target_loudness) > 2:
            findings.append(f"Loudness deviation: {loudness:.1f}LUFS vs {target_loudness}LUFS target")
            recommendations.append({
                "action": "adjust_loudness",
                "parameter": "master_gain",
                "value": target_loudness - loudness,
                "reason": f"Achieve {target_loudness}LUFS for streaming compatibility"
            })
            score -= 15
        
        # Check headroom
        peak_level = master_metrics.get("peak_level", -3)
        if peak_level > standards["master_peak"]:
            findings.append(f"Insufficient headroom: {peak_level:.1f}dB")
            recommendations.append({
                "action": "reduce_master_level",
                "value": standards["master_peak"] - peak_level,
                "reason": "Prevent clipping during mastering"
            })
            score -= 20
        
        # Check dynamic range
        dynamic_range = master_metrics.get("dynamic_range", 0)
        if dynamic_range < 4:
            findings.append(f"Limited dynamic range: {dynamic_range:.1f}dB")
            recommendations.append({
                "action": "review_compression",
                "reason": "Ensure mix retains musical dynamics"
            })
            score -= 10
        
        # Check frequency balance
        freq_response = master_metrics.get("frequency_response", {})
        if freq_response:
            low_freq = freq_response.get("low", 0)
            high_freq = freq_response.get("high", 0)
            if abs(low_freq - high_freq) > 6:
                findings.append("Unbalanced frequency response")
                recommendations.append({
                    "action": "apply_linear_phase_eq",
                    "reason": "Flatten frequency response for mastering"
                })
                score -= 10
        
        if not findings:
            findings.append("Mix is well-prepared for mastering")
        
        status = "critical" if score < 60 else ("warning" if score < 80 else "good")
        
        return AnalysisResult(
            analysis_type="mastering",
            status=status,
            score=max(0, score),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "loudness_lufs": loudness,
                "peak_level": peak_level,
                "dynamic_range": dynamic_range,
                "frequency_response": freq_response
            },
            reasoning="Analyzed mix readiness for mastering stage"
        )
    
    def suggest_creative_improvements(self, mix_context: Dict[str, Any]) -> AnalysisResult:
        """Suggest creative enhancements to the mix"""
        findings = []
        recommendations = []
        score = 75  # Creative suggestions start at baseline
        
        # Check for parallel compression opportunity
        if mix_context.get("master_level", -24) < -6:
            findings.append("Opportunity for parallel compression to add glue")
            recommendations.append({
                "action": "add_parallel_compression",
                "reason": "Creates cohesion while preserving dynamics"
            })
            score += 5
        
        # Check for harmonic enhancement
        track_types = mix_context.get("track_types", {})
        if track_types.get("audio", 0) > 0:
            findings.append("Vocals/instruments could benefit from harmonic enhancement")
            recommendations.append({
                "action": "add_saturation",
                "tracks": ["vocals", "bass"],
                "reason": "Add warmth and character"
            })
            score += 5
        
        # Check for stereo width enhancement
        mono_tracks = mix_context.get("mono_track_count", 0)
        total_tracks = mix_context.get("total_tracks", 1)
        if mono_tracks / total_tracks > 0.7:
            findings.append("Consider adding stereo width to pads and synths")
            recommendations.append({
                "action": "add_stereo_width",
                "reason": "Enhance spatial qualities of the mix"
            })
            score += 3
        
        # Check for automation opportunities
        automation_count = mix_context.get("automation_count", 0)
        if automation_count < total_tracks * 0.3:
            findings.append("Limited automation detected")
            recommendations.append({
                "action": "add_automation",
                "targets": ["vocal_levels", "effect_sends", "filter_sweeps"],
                "reason": "Add movement and interest to the mix"
            })
            score += 5
        
        if not findings:
            findings.append("Mix has good creative elements")
        
        return AnalysisResult(
            analysis_type="creative",
            status="good",
            score=max(0, min(100, score)),
            findings=findings,
            recommendations=recommendations,
            metrics={
                "mono_tracks": mono_tracks,
                "total_tracks": total_tracks,
                "automation_count": automation_count
            },
            reasoning="Analyzed creative enhancement opportunities"
        )

# Create global analyzer instance
analyzer = CodetteAnalyzer()

def analyze_session(analysis_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Main analysis function"""
    result = None
    
    if analysis_type == "gain_staging":
        result = analyzer.analyze_gain_staging(data.get("track_metrics", []))
    elif analysis_type == "mixing":
        result = analyzer.analyze_mixing(
            data.get("track_metrics", []),
            data.get("frequency_data")
        )
    elif analysis_type == "routing":
        result = analyzer.analyze_routing(data.get("tracks", []))
    elif analysis_type == "session":
        result = analyzer.analyze_session_health(data)
    elif analysis_type == "mastering":
        result = analyzer.analyze_mastering_readiness(data)
    elif analysis_type == "creative":
        result = analyzer.suggest_creative_improvements(data)
    
    if result:
        return asdict(result)
    
    return {
        "analysis_type": analysis_type,
        "status": "error",
        "score": 0,
        "findings": ["Unknown analysis type"],
        "recommendations": [],
        "metrics": {},
        "reasoning": "Unable to perform analysis"
    }
