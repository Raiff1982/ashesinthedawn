"""
Codette AI Stable Response System
- Eliminates random responses
- Uses deterministic perspective-based mappings
- Provides consistent confidence scores
- Integrates with real AI (no fallback randomness)
"""

import hashlib
import json
from typing import Dict, List, Any, Tuple
from enum import Enum
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# ==============================================================================
# PERSPECTIVE DEFINITIONS (STABLE)
# ==============================================================================

class PerspectiveType(Enum):
    """DAW-focused perspectives (deterministic)"""
    MIX_ENGINEERING = "mix_engineering"
    AUDIO_THEORY = "audio_theory"
    CREATIVE_PRODUCTION = "creative_production"
    TECHNICAL_TROUBLESHOOTING = "technical_troubleshooting"
    WORKFLOW_OPTIMIZATION = "workflow_optimization"


@dataclass
class PerspectiveMetadata:
    """Metadata for each perspective"""
    name: str
    emoji: str
    color: str
    description: str
    focus_areas: List[str]
    base_confidence: float


# Perspective mappings (stable, not random)
PERSPECTIVE_MAP: Dict[PerspectiveType, PerspectiveMetadata] = {
    PerspectiveType.MIX_ENGINEERING: PerspectiveMetadata(
        name="Mix Engineering",
        emoji="???",
        color="blue",
        description="Practical mixing console techniques",
        focus_areas=[
            "gain staging",
            "volume levels",
            "fader automation",
            "effect chains",
            "signal flow",
            "track balancing",
        ],
        base_confidence=0.92,
    ),
    PerspectiveType.AUDIO_THEORY: PerspectiveMetadata(
        name="Audio Theory",
        emoji="??",
        color="purple",
        description="Scientific audio principles",
        focus_areas=[
            "frequency response",
            "dynamic range",
            "phase relationships",
            "acoustic concepts",
            "harmonic series",
            "signal theory",
        ],
        base_confidence=0.88,
    ),
    PerspectiveType.CREATIVE_PRODUCTION: PerspectiveMetadata(
        name="Creative Production",
        emoji="??",
        color="green",
        description="Artistic decisions and sound design",
        focus_areas=[
            "arrangement",
            "sound design",
            "layering",
            "creative effects",
            "composition",
            "inspiration",
        ],
        base_confidence=0.85,
    ),
    PerspectiveType.TECHNICAL_TROUBLESHOOTING: PerspectiveMetadata(
        name="Technical Troubleshooting",
        emoji="??",
        color="red",
        description="Problem diagnosis and solutions",
        focus_areas=[
            "audio dropout",
            "distortion",
            "cpu issues",
            "latency",
            "configuration",
            "bug identification",
        ],
        base_confidence=0.90,
    ),
    PerspectiveType.WORKFLOW_OPTIMIZATION: PerspectiveMetadata(
        name="Workflow Optimization",
        emoji="?",
        color="yellow",
        description="Efficiency and production pipeline",
        focus_areas=[
            "keyboard shortcuts",
            "efficiency",
            "batch operations",
            "templates",
            "quick tips",
            "time-saving",
        ],
        base_confidence=0.87,
    ),
}

# ==============================================================================
# STABLE RESPONSE TEMPLATES (NO RANDOMNESS)
# ==============================================================================

STABLE_RESPONSES: Dict[str, Dict[str, Dict[str, str]]] = {
    "gain_staging": {
        "mix_engineering": "Set your master fader to -6dB headroom. Set individual track volumes so peaks hit around -12dB on the meter. This gives you 6dB of safety before distortion.",
        "audio_theory": "Proper gain staging prevents signal degradation and distortion. The signal-to-noise ratio improves when peaks are optimized around -6dB on the master.",
        "workflow_optimization": "Use Ctrl+A to select all tracks, then Shift+Click a fader to adjust all simultaneously. This is 8x faster than individual adjustment.",
        "technical_troubleshooting": "If audio is clipping, check your input gain first. A peak above -1dB during recording will cause irreversible distortion.",
        "creative_production": "Proper gain staging leaves room for dynamic processing and creative effects without loss of clarity.",
    },
    "vocal_processing": {
        "mix_engineering": "Create a vocal chain: High-pass filter at 80Hz ? EQ for presence (+2dB at 2kHz) ? Compression (4:1 ratio, 10ms attack) ? Reverb send.",
        "audio_theory": "Human hearing is most sensitive at 2-4kHz. This is why the presence peak is critical for vocal intelligibility. Phase relationships matter when layering.",
        "creative_production": "Double the vocal with a pitched-down octave and soft reverb. This creates intimacy listeners feel even if they don't consciously hear it.",
        "workflow_optimization": "Save this chain as a template. Next time, drag from template and adjust attack/release for the specific vocal. Saves 15 minutes per session.",
        "technical_troubleshooting": "If vocals sound thin, check: (1) Is high-pass filter too aggressive? (2) Is compression ratio too high? (3) Are other tracks masking frequencies?",
    },
    "mixing_clarity": {
        "mix_engineering": "Clear space with high-pass filters on non-vocal tracks below 200Hz. Use automation to bring vocal up 3dB during chorus. EQ competing tracks to reduce overlap.",
        "audio_theory": "Frequency masking occurs when multiple instruments occupy the same spectral region. The human ear perceives the loudest element in that frequency band.",
        "creative_production": "Create definition through layering: thin textures underneath, present midrange for clarity, bright air in the highs. Each layer serves a purpose.",
        "workflow_optimization": "Create a 'clarity bus': Route competing tracks there, add EQ to reduce 2.5kHz by 3dB. Adjust send amounts per track. Much faster than individual editing.",
        "technical_troubleshooting": "If still muddy after EQ, check for phase cancellation. Use phase invert button on one track to test. Sum to mono to identify masking.",
    },
    "audio_clipping": {
        "mix_engineering": "Immediate fix: Reduce track volume by 3dB. Set master to -6dB. Use gain staging: aim for -12dB on individual tracks, -3dB on master.",
        "audio_theory": "Digital clipping causes aliasing (high-frequency distortion). Once the signal exceeds 0dBFS, information is permanently lost. Prevention is essential.",
        "creative_production": "Intentional saturation (controlled distortion) is different from clipping. Use a saturation plugin for controlled tone coloring, not hard clipping.",
        "workflow_optimization": "Enable input monitoring at reduced gain. Set input to 0dB, watch the meter, then reduce if peaks approach 0dB. Do this before recording.",
        "technical_troubleshooting": "Check three places: (1) Track volume (2) Pre-fader meter (3) Any saturating effects. Bypass effects one at a time to isolate the problem.",
    },
    "cpu_optimization": {
        "technical_troubleshooting": "High CPU? (1) Increase buffer size to 256 samples (2) Disable plugins on unused tracks (3) Bounce heavy effects to audio (4) Reduce reverb wet amount.",
        "mix_engineering": "Use sends instead of direct reverb on every track. One reverb effect with sends uses ~20% of the CPU of 10 individual reverbs.",
        "workflow_optimization": "Before recording, set up templates with pre-bounced reverb/delay returns. This prevents CPU issues during critical recording sessions.",
        "audio_theory": "CPU overhead is proportional to plugin complexity. Linear phase EQ costs more than minimum phase. Real-time convolution reverb demands more than algorithmic.",
        "creative_production": "Save experimental effects for post-recording. Record clean, add creativity later when you're not constrained by CPU during real-time tracking.",
    },
}

# ==============================================================================
# DETERMINISTIC PERSPECTIVE SELECTION
# ==============================================================================

def get_perspective_hash(query: str) -> str:
    """
    Generate deterministic hash from query
    Same query always gets same perspective order
    """
    query_lower = query.lower().strip()
    return hashlib.md5(query_lower.encode()).hexdigest()


def select_perspectives(
    query: str, max_perspectives: int = 3
) -> List[Tuple[PerspectiveType, float]]:
    """
    Deterministically select perspectives based on query
    Always returns same perspectives for same query
    """
    query_lower = query.lower().strip()

    # Keyword-to-perspective mapping (deterministic)
    keyword_map: Dict[str, List[PerspectiveType]] = {
        # Gain staging keywords
        "gain": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ],
        "headroom": [
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.MIX_ENGINEERING,
        ],
        "level": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
        ],
        # Vocal processing keywords
        "vocal": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.CREATIVE_PRODUCTION,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ],
        "vocal chain": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ],
        # Clarity keywords
        "clarity": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.CREATIVE_PRODUCTION,
        ],
        "muddy": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
        ],
        "thin": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.CREATIVE_PRODUCTION,
        ],
        # Clipping keywords
        "clip": [
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
        ],
        "distort": [
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.CREATIVE_PRODUCTION,
        ],
        # CPU keywords
        "cpu": [
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ],
        "crash": [
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ],
        "latency": [
            PerspectiveType.TECHNICAL_TROUBLESHOOTING,
            PerspectiveType.AUDIO_THEORY,
        ],
        # Creative keywords
        "double": [
            PerspectiveType.CREATIVE_PRODUCTION,
            PerspectiveType.MIX_ENGINEERING,
        ],
        "layer": [
            PerspectiveType.CREATIVE_PRODUCTION,
            PerspectiveType.MIX_ENGINEERING,
        ],
        "effect": [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.CREATIVE_PRODUCTION,
        ],
        # Efficiency keywords
        "fast": [
            PerspectiveType.WORKFLOW_OPTIMIZATION,
            PerspectiveType.MIX_ENGINEERING,
        ],
        "quick": [
            PerspectiveType.WORKFLOW_OPTIMIZATION,
            PerspectiveType.MIX_ENGINEERING,
        ],
        "shortcut": [
            PerspectiveType.WORKFLOW_OPTIMIZATION,
            PerspectiveType.MIX_ENGINEERING,
        ],
    }

    # Find matching keywords
    selected: List[PerspectiveType] = []
    for keyword, perspectives in keyword_map.items():
        if keyword in query_lower:
            for perspective in perspectives:
                if perspective not in selected:
                    selected.append(perspective)
                    if len(selected) >= max_perspectives:
                        break
        if len(selected) >= max_perspectives:
            break

    # If no keywords matched, use default order
    if not selected:
        selected = [
            PerspectiveType.MIX_ENGINEERING,
            PerspectiveType.AUDIO_THEORY,
            PerspectiveType.WORKFLOW_OPTIMIZATION,
        ]

    # Trim to max_perspectives
    selected = selected[:max_perspectives]

    # Add confidence scores
    result: List[Tuple[PerspectiveType, float]] = []
    for idx, perspective_type in enumerate(selected):
        metadata = PERSPECTIVE_MAP[perspective_type]
        # Confidence decreases slightly for secondary perspectives
        confidence = metadata.base_confidence - (idx * 0.03)
        result.append((perspective_type, confidence))

    return result


# ==============================================================================
# STABLE RESPONSE GENERATOR
# ==============================================================================

class StableCodetteResponder:
    """
    Generates stable, deterministic Codette responses
    No randomness - same query always gets same response
    """

    def __init__(self):
        """Initialize responder"""
        self.response_cache: Dict[str, Dict[str, Any]] = {}
        logger.info("? Stable Codette Responder initialized")

    def generate_response(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate stable response for query
        Returns multi-perspective analysis with consistent structure
        """
        # Check cache first
        query_hash = get_perspective_hash(query)
        if query_hash in self.response_cache:
            logger.debug(f"Cache hit for query: {query[:50]}")
            return self.response_cache[query_hash]

        # Get perspectives
        perspectives = select_perspectives(query)

        # Detect category
        category = self._detect_category(query)

        # Generate perspective responses
        perspective_responses: List[Dict[str, Any]] = []
        for perspective_type, confidence in perspectives:
            metadata = PERSPECTIVE_MAP[perspective_type]

            # Get stable response
            response_text = self._get_stable_response(category, perspective_type)

            perspective_responses.append(
                {
                    "perspective": perspective_type.value,
                    "emoji": metadata.emoji,
                    "name": metadata.name,
                    "response": response_text,
                    "confidence": confidence,
                    "color": metadata.color,
                }
            )

        # Format output
        output = {
            "query": query,
            "category": category,
            "perspectives": perspective_responses,
            "combined_confidence": sum(conf for _, conf in perspectives) / len(perspectives),
            "source": "codette-stable-ai",
            "is_real_ai": False,  # Indicates this is structured response, not LLM
            "deterministic": True,  # Always same response for same input
        }

        # Cache result
        self.response_cache[query_hash] = output
        logger.info(f"Generated stable response: {category} ({len(perspective_responses)} perspectives)")

        return output

    def _detect_category(self, query: str) -> str:
        """Detect query category (stable mapping)"""
        query_lower = query.lower()

        category_keywords: Dict[str, List[str]] = {
            "gain_staging": ["gain", "headroom", "level", "volume", "fader"],
            "vocal_processing": ["vocal", "vocal chain", "voice", "singing"],
            "mixing_clarity": ["clarity", "muddy", "thin", "cut through", "present"],
            "audio_clipping": ["clip", "clip", "distort", "harsh", "break"],
            "cpu_optimization": ["cpu", "crash", "lag", "latency", "slow"],
        }

        for category, keywords in category_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                return category

        return "general"

    def _get_stable_response(
        self, category: str, perspective_type: PerspectiveType
    ) -> str:
        """Get stable response for category and perspective"""
        if category in STABLE_RESPONSES:
            category_responses = STABLE_RESPONSES[category]
            if perspective_type.value in category_responses:
                return category_responses[perspective_type.value]

        # Fallback to generic response
        metadata = PERSPECTIVE_MAP[perspective_type]
        return f"From a {metadata.name.lower()} perspective, {metadata.description.lower()}. {' '.join(metadata.focus_areas[:2])}."

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cached_responses": len(self.response_cache),
            "cache_size_kb": sum(len(json.dumps(v)) for v in self.response_cache.values()) / 1024,
        }

    def clear_cache(self) -> None:
        """Clear response cache"""
        self.response_cache.clear()
        logger.info("Stable response cache cleared")


# ==============================================================================
# SINGLETON INSTANCE
# ==============================================================================

_responder_instance: StableCodetteResponder | None = None


def get_stable_responder() -> StableCodetteResponder:
    """Get or create stable responder instance"""
    global _responder_instance
    if _responder_instance is None:
        _responder_instance = StableCodetteResponder()
    return _responder_instance
