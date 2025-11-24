"""
Codette AI Training Module
Comprehensive training data and context for Codette AI engine
Enables full system understanding and intelligent decision-making
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json

# ==================== DOMAIN KNOWLEDGE ====================

class AudioDomain(Enum):
    """Audio production domain areas"""
    MIXING = "mixing"
    MASTERING = "mastering"
    RECORDING = "recording"
    SIGNAL_FLOW = "signal_flow"
    EFFECTS = "effects"
    METERING = "metering"
    DYNAMICS = "dynamics"
    FREQUENCY = "frequency"

class TrackType(Enum):
    """Track types in the DAW"""
    AUDIO = "audio"
    INSTRUMENT = "instrument"
    MIDI = "midi"
    AUX = "aux"
    VCA = "vca"
    MASTER = "master"

@dataclass
class AudioMetrics:
    """Audio analysis metrics"""
    peak_level: float  # -60 to 0 dB
    rms_level: float   # RMS in dB
    crest_factor: float  # Peak/RMS ratio
    loudness_lufs: float  # Loudness standard
    dynamic_range: float  # Max - Min
    thd: float  # Total Harmonic Distortion %
    frequency_balance: Dict[str, float]  # Freq bands: low, mid, high
    phase_correlation: float  # L/R phase: -1 to 1

@dataclass
class PluginConfig:
    """Plugin effect configuration"""
    plugin_id: str
    plugin_name: str
    category: str  # EQ, Compressor, Delay, Reverb, Saturation
    parameters: Dict[str, float]
    bypass: bool
    position: int  # In chain

# ==================== CORELOGIC STUDIO SYSTEM KNOWLEDGE ====================

SYSTEM_ARCHITECTURE = {
    "frontend": {
        "framework": "React 18.3 + TypeScript 5.5",
        "build_tool": "Vite 7.2.4",
        "port": 5174,
        "state_management": "DAWContext (React Context)",
        "audio_api": "Web Audio API",
        "ui_framework": "Tailwind CSS 3.4",
    },
    "backend": {
        "framework": "FastAPI + Uvicorn",
        "language": "Python 3.13.7",
        "port": 8000,
        "ai_engine": "Codette (BroaderPerspectiveEngine)",
        "dsp_library": "daw_core (NumPy/SciPy)",
    },
    "communication": {
        "protocol": "HTTP REST + JSON",
        "bridge_service": "codetteBridgeService.ts",
        "endpoints": [
            "/analyze/gain-staging",
            "/analyze/mixing",
            "/analyze/routing",
            "/analyze/session",
            "/analyze/mastering",
            "/analyze/creative"
        ],
    }
}

# ==================== AUDIO PRODUCTION BEST PRACTICES ====================

MIXING_STANDARDS = {
    "reference_levels": {
        "headroom": -3.0,  # dB
        "target_loudness": -14.0,  # LUFS (streaming)
        "master_peak": -1.0,  # dB (prevent clipping)
    },
    "frequency_targets": {
        "low_end": (20, 200),  # Hz - Bass frequencies
        "low_mids": (200, 500),  # Hz - Boxiness
        "mids": (500, 2000),  # Hz - Presence
        "high_mids": (2000, 8000),  # Hz - Clarity
        "high_end": (8000, 20000),  # Hz - Brilliance
    },
    "gain_staging": {
        "input_headroom": -6.0,  # dB recommended
        "send_level": -6.0,  # dB for effects sends
        "return_level": -12.0,  # dB for effect returns
    },
    "compression_ranges": {
        "ratio": (1.5, 8.0),  # 1.5:1 to 8:1
        "attack_ms": (1, 100),  # milliseconds
        "release_ms": (50, 500),  # milliseconds
    }
}

PLUGIN_CATEGORIES = {
    "EQ": {
        "types": ["Parametric", "Graphic", "Dynamic"],
        "use_cases": ["Balance frequencies", "Remove resonances", "Add presence"],
        "typical_settings": {
            "gain": (-12, 12),  # dB
            "q_factor": (0.5, 10),  # Bandwidth
            "frequency": (20, 20000),  # Hz
        }
    },
    "Compressor": {
        "types": ["Vocals", "Drums", "Mix bus"],
        "parameters": ["Ratio", "Threshold", "Attack", "Release", "Makeup Gain"],
        "recommended_settings": {
            "ratio": 4.0,  # 4:1
            "threshold": -20.0,  # dB
            "attack": 10,  # ms
            "release": 100,  # ms
        }
    },
    "Delay": {
        "types": ["Simple", "Ping-pong", "Multi-tap"],
        "time_sync": ["Note divisions", "BPM sync"],
        "feedback_range": (0, 0.9),  # Prevent feedback runaway
    },
    "Reverb": {
        "types": ["Room", "Hall", "Plate", "Spring"],
        "parameters": ["Room size", "Decay time", "Pre-delay", "Width"],
        "typical_predelay": (10, 100),  # ms
    },
    "Saturation": {
        "types": ["Soft clip", "Hard clip", "Waveshaper"],
        "use_cases": ["Add warmth", "Increase sustain", "Glue"],
        "drive_range": (0, 12),  # dB
    }
}

# ==================== ANALYSIS FRAMEWORKS ====================

ANALYSIS_CONTEXTS = {
    "gain_staging": {
        "description": "Analyze signal levels throughout the signal chain",
        "metrics": [
            "Input levels per track",
            "Send/return levels",
            "Master bus level",
            "Headroom available",
            "Clipping detection"
        ],
        "recommendations": [
            "Optimize input gains to -6dB on meters",
            "Set sends to -6dB for clean mixes",
            "Maintain 3dB headroom on master bus",
            "Monitor for clipping or noise floor issues"
        ]
    },
    "mixing": {
        "description": "Analyze mix balance and frequency distribution",
        "metrics": [
            "Track balance (volume levels)",
            "Frequency balance (EQ spectrum)",
            "Stereo width and imaging",
            "Compression and dynamics",
            "Effects send levels"
        ],
        "recommendations": [
            "Balance vocals upfront, drums in pocket",
            "Use EQ to separate frequency ranges",
            "Add reverb sparingly for depth",
            "Check mix on multiple speakers"
        ]
    },
    "routing": {
        "description": "Analyze signal flow and track organization",
        "metrics": [
            "Track types (audio, MIDI, instrument, aux)",
            "Buses and sub-groups",
            "Send/return chains",
            "Automation assignments",
            "Plugin chain organization"
        ],
        "recommendations": [
            "Group similar tracks into buses",
            "Color-code tracks by instrument family",
            "Use VCA masters for bus compression",
            "Organize effects in aux channels"
        ]
    },
    "session": {
        "description": "Analyze overall project health and efficiency",
        "metrics": [
            "CPU usage",
            "Total track count",
            "Plugin density",
            "File organization",
            "Project structure"
        ],
        "recommendations": [
            "Freeze/render heavy virtual instruments",
            "Group tracks efficiently",
            "Delete unused tracks",
            "Archive old sessions regularly"
        ]
    },
    "mastering": {
        "description": "Analyze mix readiness for mastering",
        "metrics": [
            "Loudness (LUFS)",
            "Dynamic range",
            "Peak levels",
            "Stereo balance",
            "Frequency response flatness"
        ],
        "recommendations": [
            "Achieve -14 LUFS (streaming target)",
            "Maintain 6dB dynamic range minimum",
            "Leave -1dB headroom on master",
            "Check on multiple playback systems"
        ]
    },
    "creative": {
        "description": "Suggest creative improvements and enhancements",
        "metrics": [
            "Harmonic interest",
            "Frequency excitement",
            "Dynamic interest",
            "Stereo imaging creativity",
            "Effect balance"
        ],
        "recommendations": [
            "Parallel compression for glue",
            "Harmonic saturation for warmth",
            "Stereo widening on pads",
            "Sidechain compression for punch",
            "Automation for movement"
        ]
    }
}

# ==================== DECISION TREES ====================

GAIN_STAGING_DECISIONS = {
    "peak_level_too_high": {
        "condition": "peak > 0 dB",
        "actions": [
            "Reduce input gain",
            "Check for clipping in chain",
            "Review compressor settings"
        ],
        "priority": "critical"
    },
    "rms_too_low": {
        "condition": "rms < -24 dB",
        "actions": [
            "Increase input gain",
            "Check source level",
            "Verify audio file integrity"
        ],
        "priority": "high"
    },
    "insufficient_headroom": {
        "condition": "peak > -3 dB",
        "actions": [
            "Reduce track volumes",
            "Lower send levels",
            "Apply gentle compression"
        ],
        "priority": "high"
    }
}

FREQUENCY_BALANCE_DECISIONS = {
    "too_much_bass": {
        "condition": "low_end_energy > 0.7",
        "actions": [
            "Apply high-pass filter (80-120Hz)",
            "Reduce bass track volume",
            "Use narrow EQ on problematic frequencies"
        ],
        "target_range": 0.4
    },
    "scooped_mids": {
        "condition": "mid_range_energy < 0.3",
        "actions": [
            "Add 3dB at 1kHz",
            "Check vocal levels",
            "Boost presence on lead instruments"
        ],
        "target_range": 0.5
    },
    "harsh_highs": {
        "condition": "high_end_energy > 0.8",
        "actions": [
            "Reduce 5kHz presence peak",
            "Lower high-frequency sensitive tracks",
            "Apply gentle high shelf cut"
        ],
        "target_range": 0.5
    }
}

# ==================== PLUGIN RECOMMENDATIONS ====================

PLUGIN_SUGGESTIONS = {
    "vocals": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Remove low rumble, add presence"},
        {"category": "Compressor", "suggestion": "Vocal Compressor", "reason": "Control dynamics, add glue"},
        {"category": "Reverb", "suggestion": "Room/Hall", "reason": "Add space and depth"},
        {"category": "Saturation", "suggestion": "Soft Saturation", "reason": "Add warmth and smoothness"}
    ],
    "drums": [
        {"category": "Compressor", "suggestion": "Drum Compressor", "reason": "Tighten attack, add punch"},
        {"category": "EQ", "suggestion": "Graphic EQ", "reason": "Shape drum tone"},
        {"category": "Delay", "suggestion": "Ping-pong Delay", "reason": "Add space on overheads"}
    ],
    "bass": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Define sub and fundamental"},
        {"category": "Compressor", "suggestion": "Multi-band Compressor", "reason": "Control dynamic range"},
        {"category": "Saturation", "suggestion": "Bass Saturation", "reason": "Add harmonics and sustain"}
    ],
    "master": [
        {"category": "EQ", "suggestion": "Parametric EQ", "reason": "Fine-tune frequency balance"},
        {"category": "Compressor", "suggestion": "VCA Compressor", "reason": "Add glue to mix"},
        {"category": "Limiter", "suggestion": "Limiter", "reason": "Prevent peaks and clipping"}
    ]
}

# ==================== TRAINING DATA ====================

class CodetteTrainingData:
    """Complete training dataset for Codette AI"""
    
    def __init__(self):
        self.system_knowledge = SYSTEM_ARCHITECTURE
        self.audio_standards = MIXING_STANDARDS
        self.plugin_knowledge = PLUGIN_CATEGORIES
        self.analysis_frameworks = ANALYSIS_CONTEXTS
        self.decision_trees = {
            "gain_staging": GAIN_STAGING_DECISIONS,
            "frequency_balance": FREQUENCY_BALANCE_DECISIONS
        }
        self.plugin_suggestions = PLUGIN_SUGGESTIONS
    
    def get_context_for_analysis(self, analysis_type: str) -> Dict[str, Any]:
        """Get training context for specific analysis type"""
        return self.analysis_frameworks.get(
            analysis_type, 
            self.analysis_frameworks["session"]
        )
    
    def get_plugin_suggestion(self, track_type: str, current_plugins: List[str]) -> List[Dict]:
        """Get plugin suggestions based on track type"""
        suggestions = self.plugin_suggestions.get(track_type, [])
        # Filter out already applied plugins
        return [s for s in suggestions if s.get("suggestion") not in current_plugins]
    
    def get_decision_tree(self, metric_name: str, metric_value: float) -> Dict[str, Any]:
        """Get decision tree recommendations based on metric"""
        for tree_name, tree in self.decision_trees.items():
            for decision_key, decision in tree.items():
                # Evaluate condition (simplified)
                if "peak" in decision_key and metric_value > 0:
                    return decision
        return {"actions": ["Check audio levels"], "priority": "normal"}
    
    def get_mixing_standard(self, aspect: str) -> Dict[str, Any]:
        """Get standard values for mixing aspects"""
        if aspect == "levels":
            return self.audio_standards["reference_levels"]
        elif aspect == "frequencies":
            return self.audio_standards["frequency_targets"]
        elif aspect == "gain":
            return self.audio_standards["gain_staging"]
        elif aspect == "compression":
            return self.audio_standards["compression_ranges"]
        return {}
    
    def evaluate_session_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate overall session health"""
        health_score = 100
        recommendations = []
        
        # Check levels
        if metrics.get("peak_level", -100) > 0:
            health_score -= 25
            recommendations.append("Reduce peak levels to prevent clipping")
        elif metrics.get("peak_level", -60) < -24:
            health_score -= 10
            recommendations.append("Increase input levels for better signal")
        
        # Check headroom
        if metrics.get("headroom", -3) < -3:
            health_score -= 20
            recommendations.append("Maintain -3dB headroom on master")
        
        # Check frequency balance
        if metrics.get("frequency_balance"):
            fb = metrics["frequency_balance"]
            if fb.get("low", 0) > 0.7:
                health_score -= 15
                recommendations.append("Reduce low-end energy")
        
        return {
            "health_score": max(0, health_score),
            "recommendations": recommendations,
            "critical_issues": len([r for r in recommendations if "prevent" in r.lower()])
        }

# ==================== EXPORT ====================

# Create global instance
training_data = CodetteTrainingData()

def get_training_context() -> Dict[str, Any]:
    """Get complete training context"""
    return {
        "system": training_data.system_knowledge,
        "standards": training_data.audio_standards,
        "plugins": training_data.plugin_knowledge,
        "analysis": training_data.analysis_frameworks,
        "decisions": training_data.decision_trees,
        "suggestions": training_data.plugin_suggestions,
    }
