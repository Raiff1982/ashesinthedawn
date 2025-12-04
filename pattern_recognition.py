"""
Music Production Pattern Recognition System
Detects genres, workflows, arrangement patterns, and production styles
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from collections import Counter
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# GENRE DETECTION
# ============================================================================

@dataclass
class GenreCharacteristics:
    """Characteristics of a music genre"""
    name: str
    typical_bpm_range: Tuple[int, int]
    typical_instruments: List[str]
    common_effects: List[str]
    mixing_style: str
    key_features: List[str]
    confidence_threshold: float = 0.6

class GenreDetector:
    """Detect music genre based on project characteristics"""
    
    GENRE_DATABASE = {
        "electronic_edm": GenreCharacteristics(
            name="Electronic/EDM",
            typical_bpm_range=(120, 140),
            typical_instruments=["synth", "bass", "drums", "pad"],
            common_effects=["reverb", "delay", "sidechain", "filter"],
            mixing_style="wide_stereo_loud",
            key_features=["synth_heavy", "four_on_floor", "build_drops"]
        ),
        "hip_hop": GenreCharacteristics(
            name="Hip-Hop/Rap",
            typical_bpm_range=(80, 100),
            typical_instruments=["drums", "bass", "vocals", "sample"],
            common_effects=["eq", "compression", "delay"],
            mixing_style="vocals_forward_bass_heavy",
            key_features=["vocal_dominant", "808_bass", "sample_based"]
        ),
        "rock": GenreCharacteristics(
            name="Rock",
            typical_bpm_range=(100, 140),
            typical_instruments=["guitar", "bass", "drums", "vocals"],
            common_effects=["distortion", "reverb", "delay"],
            mixing_style="live_band_natural",
            key_features=["guitar_heavy", "drum_prominent", "dynamic_range"]
        ),
        "pop": GenreCharacteristics(
            name="Pop",
            typical_bpm_range=(100, 130),
            typical_instruments=["vocals", "synth", "drums", "bass"],
            common_effects=["reverb", "delay", "compression", "eq"],
            mixing_style="radio_ready_polished",
            key_features=["vocal_centric", "commercial_sound", "layered"]
        ),
        "jazz": GenreCharacteristics(
            name="Jazz",
            typical_bpm_range=(80, 180),
            typical_instruments=["piano", "bass", "drums", "horns", "vocals"],
            common_effects=["reverb", "eq"],
            mixing_style="natural_room_sound",
            key_features=["improvisation", "swing", "acoustic_instruments"]
        ),
        "classical": GenreCharacteristics(
            name="Classical",
            typical_bpm_range=(60, 160),
            typical_instruments=["strings", "piano", "horns", "woodwinds"],
            common_effects=["reverb"],
            mixing_style="concert_hall_natural",
            key_features=["orchestral", "dynamic_range", "minimal_processing"]
        ),
        "ambient": GenreCharacteristics(
            name="Ambient",
            typical_bpm_range=(60, 90),
            typical_instruments=["synth", "pad", "field_recording"],
            common_effects=["reverb", "delay", "granular"],
            mixing_style="atmospheric_spacious",
            key_features=["textural", "slow_evolution", "minimal_rhythm"]
        )
    }
    
    @classmethod
    def detect_genre(
        cls,
        bpm: float,
        tracks: List[Dict[str, Any]],
        project_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Detect genre based on project characteristics
        
        Args:
            bpm: Project tempo
            tracks: List of tracks with metadata
            project_name: Optional project name for hints
            
        Returns:
            Dict with detected genre and confidence
        """
        scores = {}
        
        # Analyze each genre
        for genre_id, characteristics in cls.GENRE_DATABASE.items():
            score = cls._calculate_genre_score(bpm, tracks, characteristics)
            scores[genre_id] = score
        
        # Find best match
        if not scores:
            return {"genre": "unknown", "confidence": 0.0, "candidates": []}
        
        best_genre = max(scores, key=scores.get)
        best_score = scores[best_genre]
        
        # Get top 3 candidates
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        candidates = [
            {"genre": cls.GENRE_DATABASE[genre].name, "confidence": score}
            for genre, score in sorted_scores[:3]
        ]
        
        return {
            "genre": cls.GENRE_DATABASE[best_genre].name,
            "genre_id": best_genre,
            "confidence": best_score,
            "candidates": candidates,
            "characteristics": cls.GENRE_DATABASE[best_genre].__dict__
        }
    
    @classmethod
    def _calculate_genre_score(
        cls,
        bpm: float,
        tracks: List[Dict[str, Any]],
        characteristics: GenreCharacteristics
    ) -> float:
        """Calculate how well project matches genre characteristics"""
        score = 0.0
        max_score = 0.0
        
        # BPM score (30% weight)
        bpm_min, bpm_max = characteristics.typical_bpm_range
        if bpm_min <= bpm <= bpm_max:
            bpm_score = 1.0
        else:
            # Penalize based on distance from range
            if bpm < bpm_min:
                bpm_score = max(0, 1 - (bpm_min - bpm) / 20)
            else:
                bpm_score = max(0, 1 - (bpm - bpm_max) / 20)
        score += bpm_score * 0.3
        max_score += 0.3
        
        # Instrument score (40% weight)
        track_types = [track.get("type", "audio").lower() for track in tracks]
        track_names = [track.get("name", "").lower() for track in tracks]
        
        instrument_matches = 0
        for instrument in characteristics.typical_instruments:
            # Check track types and names
            if any(instrument in name or instrument in ttype for name, ttype in zip(track_names, track_types)):
                instrument_matches += 1
        
        if characteristics.typical_instruments:
            instrument_score = instrument_matches / len(characteristics.typical_instruments)
            score += instrument_score * 0.4
            max_score += 0.4
        
        # Effects score (20% weight)
        effects_found = []
        for track in tracks:
            inserts = track.get("inserts", [])
            for insert in inserts:
                effects_found.append(str(insert).lower())
        
        effect_matches = 0
        for effect in characteristics.common_effects:
            if any(effect in found for found in effects_found):
                effect_matches += 1
        
        if characteristics.common_effects:
            effect_score = effect_matches / len(characteristics.common_effects)
            score += effect_score * 0.2
            max_score += 0.2
        
        # Track count score (10% weight)
        track_count = len(tracks)
        if track_count > 0:
            # Appropriate track count for genre
            if characteristics.name in ["Electronic/EDM", "Hip-Hop/Rap"]:
                ideal_count = 20  # Electronic genres tend to have many tracks
            elif characteristics.name in ["Classical"]:
                ideal_count = 30  # Orchestral has many tracks
            else:
                ideal_count = 15
            
            count_score = 1 - abs(track_count - ideal_count) / ideal_count
            count_score = max(0, min(1, count_score))
            score += count_score * 0.1
            max_score += 0.1
        
        return score / max_score if max_score > 0 else 0.0

# ============================================================================
# ARRANGEMENT PATTERN RECOGNITION
# ============================================================================

@dataclass
class ArrangementPattern:
    """Detected arrangement pattern"""
    pattern_type: str
    sections: List[Dict[str, Any]]
    total_duration: float
    structure: str
    confidence: float

class ArrangementAnalyzer:
    """Analyze arrangement patterns in project"""
    
    COMMON_STRUCTURES = {
        "verse_chorus": ["intro", "verse", "chorus", "verse", "chorus", "bridge", "chorus", "outro"],
        "aaba": ["a", "a", "b", "a"],
        "edm_structure": ["intro", "buildup", "drop", "breakdown", "buildup", "drop", "outro"],
        "minimalist": ["intro", "development", "outro"]
    }
    
    @classmethod
    def analyze_arrangement(
        cls,
        tracks: List[Dict[str, Any]],
        project_duration: float = 0.0
    ) -> ArrangementPattern:
        """
        Analyze arrangement structure
        
        Args:
            tracks: List of tracks
            project_duration: Total project duration in seconds
            
        Returns:
            ArrangementPattern object
        """
        # Detect sections based on track activity
        sections = cls._detect_sections(tracks, project_duration)
        
        # Identify structure pattern
        structure = cls._identify_structure(sections)
        
        return ArrangementPattern(
            pattern_type=structure,
            sections=sections,
            total_duration=project_duration,
            structure=structure,
            confidence=0.75
        )
    
    @classmethod
    def _detect_sections(cls, tracks: List[Dict[str, Any]], duration: float) -> List[Dict[str, Any]]:
        """Detect song sections (simplified)"""
        # In real implementation, analyze audio regions, markers, automation
        # For now, estimate based on typical song structure
        
        if duration == 0:
            return []
        
        # Estimate sections based on duration
        sections = []
        
        if duration < 120:  # Short track
            sections = [
                {"name": "intro", "start": 0, "duration": 10},
                {"name": "main", "start": 10, "duration": duration - 20},
                {"name": "outro", "start": duration - 10, "duration": 10}
            ]
        else:  # Full song
            sections = [
                {"name": "intro", "start": 0, "duration": 15},
                {"name": "verse", "start": 15, "duration": 30},
                {"name": "chorus", "start": 45, "duration": 30},
                {"name": "verse", "start": 75, "duration": 30},
                {"name": "chorus", "start": 105, "duration": 30},
                {"name": "bridge", "start": 135, "duration": 20},
                {"name": "chorus", "start": 155, "duration": 30},
                {"name": "outro", "start": 185, "duration": duration - 185}
            ]
        
        return sections
    
    @classmethod
    def _identify_structure(cls, sections: List[Dict[str, Any]]) -> str:
        """Identify overall song structure"""
        if not sections:
            return "unknown"
        
        section_names = [s["name"] for s in sections]
        
        # Match against common structures
        for structure_name, structure_pattern in cls.COMMON_STRUCTURES.items():
            if cls._matches_pattern(section_names, structure_pattern):
                return structure_name
        
        return "custom"
    
    @classmethod
    def _matches_pattern(cls, names: List[str], pattern: List[str]) -> bool:
        """Check if section names match a pattern"""
        if len(names) != len(pattern):
            return False
        
        matches = sum(1 for n, p in zip(names, pattern) if n.lower() == p.lower())
        return matches / len(pattern) > 0.7

# ============================================================================
# WORKFLOW PATTERN RECOGNITION
# ============================================================================

@dataclass
class WorkflowPattern:
    """Detected workflow pattern"""
    pattern_name: str
    description: str
    detected_actions: List[str]
    efficiency_score: float
    suggestions: List[str]

class WorkflowAnalyzer:
    """Analyze user workflow patterns"""
    
    WORKFLOW_PATTERNS = {
        "top_down_mixing": {
            "name": "Top-Down Mixing",
            "description": "Starting with master bus processing, then groups, then individual tracks",
            "indicators": ["master_processing_early", "group_processing", "individual_last"],
            "efficiency": 0.9
        },
        "bottom_up_mixing": {
            "name": "Bottom-Up Mixing",
            "description": "Starting with individual tracks, building up to master",
            "indicators": ["individual_first", "groups_later", "master_last"],
            "efficiency": 0.8
        },
        "section_by_section": {
            "name": "Section-by-Section",
            "description": "Mixing one song section at a time",
            "indicators": ["region_focus", "section_isolation"],
            "efficiency": 0.7
        },
        "parallel_workflow": {
            "name": "Parallel Workflow",
            "description": "Working on multiple aspects simultaneously",
            "indicators": ["multiple_tracks_selected", "rapid_switching"],
            "efficiency": 0.6
        }
    }
    
    @classmethod
    def analyze_workflow(
        cls,
        action_history: List[Dict[str, Any]],
        track_order: List[str]
    ) -> WorkflowPattern:
        """
        Analyze user workflow from action history
        
        Args:
            action_history: List of user actions with timestamps
            track_order: Order of tracks in project
            
        Returns:
            WorkflowPattern object
        """
        # Analyze action patterns
        detected_pattern = cls._detect_workflow_pattern(action_history)
        
        # Calculate efficiency
        efficiency = cls._calculate_efficiency(action_history)
        
        # Generate suggestions
        suggestions = cls._generate_workflow_suggestions(detected_pattern, efficiency)
        
        return WorkflowPattern(
            pattern_name=detected_pattern,
            description=cls.WORKFLOW_PATTERNS.get(detected_pattern, {}).get("description", ""),
            detected_actions=[a.get("type") for a in action_history[-10:]],
            efficiency_score=efficiency,
            suggestions=suggestions
        )
    
    @classmethod
    def _detect_workflow_pattern(cls, actions: List[Dict[str, Any]]) -> str:
        """Detect workflow pattern from actions"""
        if not actions:
            return "unknown"
        
        # Count action types
        action_types = [a.get("type") for a in actions]
        action_counts = Counter(action_types)
        
        # Simple pattern detection
        if action_counts.get("master_processing", 0) > 0 and len(actions) > 10:
            return "top_down_mixing"
        elif action_counts.get("track_select", 0) > 5:
            return "bottom_up_mixing"
        else:
            return "parallel_workflow"
    
    @classmethod
    def _calculate_efficiency(cls, actions: List[Dict[str, Any]]) -> float:
        """Calculate workflow efficiency (0-1)"""
        if not actions:
            return 0.5
        
        # Factors for efficiency:
        # - Fewer undos = better
        # - Consistent action patterns = better
        # - Fewer context switches = better
        
        undo_count = sum(1 for a in actions if a.get("type") == "undo")
        undo_penalty = min(0.3, undo_count * 0.05)
        
        efficiency = 0.8 - undo_penalty
        return max(0.1, min(1.0, efficiency))
    
    @classmethod
    def _generate_workflow_suggestions(cls, pattern: str, efficiency: float) -> List[str]:
        """Generate workflow improvement suggestions"""
        suggestions = []
        
        if efficiency < 0.6:
            suggestions.append("Consider planning your mixing approach before starting")
            suggestions.append("Use templates to speed up repetitive tasks")
        
        if pattern == "parallel_workflow":
            suggestions.append("Focus on one track or section at a time for better results")
        
        if pattern == "bottom_up_mixing":
            suggestions.append("Try starting with master bus processing for better cohesion")
        
        return suggestions

# ============================================================================
# PRODUCTION STYLE LEARNING
# ============================================================================

class ProductionStyleLearner:
    """Learn user's production style and preferences"""
    
    def __init__(self):
        self.user_preferences: Dict[str, Any] = {
            "favorite_effects": Counter(),
            "common_track_types": Counter(),
            "typical_bpm_range": [],
            "mixing_approach": None,
            "genre_focus": []
        }
        self.session_count = 0
    
    def learn_from_project(self, project_data: Dict[str, Any]) -> None:
        """Learn from a project's characteristics"""
        self.session_count += 1
        
        # Track effects usage
        for track in project_data.get("tracks", []):
            for effect in track.get("inserts", []):
                self.user_preferences["favorite_effects"][str(effect)] += 1
            
            track_type = track.get("type", "audio")
            self.user_preferences["common_track_types"][track_type] += 1
        
        # Track BPM preferences
        bpm = project_data.get("bpm", 120)
        self.user_preferences["typical_bpm_range"].append(bpm)
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get learned user profile"""
        if self.session_count == 0:
            return {"profile": "new_user", "sessions": 0}
        
        # Calculate averages and patterns
        avg_bpm = np.mean(self.user_preferences["typical_bpm_range"]) if self.user_preferences["typical_bpm_range"] else 120
        
        top_effects = self.user_preferences["favorite_effects"].most_common(5)
        top_track_types = self.user_preferences["common_track_types"].most_common(3)
        
        return {
            "profile": "experienced_user" if self.session_count > 10 else "developing_user",
            "sessions": self.session_count,
            "favorite_effects": [effect for effect, _ in top_effects],
            "common_track_types": [ttype for ttype, _ in top_track_types],
            "average_bpm": float(avg_bpm),
            "bpm_range": (min(self.user_preferences["typical_bpm_range"]), max(self.user_preferences["typical_bpm_range"])) if self.user_preferences["typical_bpm_range"] else (100, 140)
        }

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example: Genre detection
    tracks = [
        {"name": "Kick", "type": "drums"},
        {"name": "Bass Synth", "type": "instrument"},
        {"name": "Lead", "type": "instrument", "inserts": ["reverb", "delay"]},
        {"name": "Pad", "type": "instrument", "inserts": ["reverb"]}
    ]
    
    genre_result = GenreDetector.detect_genre(bpm=128, tracks=tracks)
    print(f"Detected genre: {genre_result['genre']} (confidence: {genre_result['confidence']:.2f})")
    
    # Example: Arrangement analysis
    arrangement = ArrangementAnalyzer.analyze_arrangement(tracks, project_duration=180)
    print(f"Arrangement structure: {arrangement.structure}")
    
    # Example: Workflow analysis
    actions = [
        {"type": "track_select", "timestamp": 100},
        {"type": "volume_change", "timestamp": 101},
        {"type": "track_select", "timestamp": 102},
        {"type": "eq_adjust", "timestamp": 103}
    ]
    workflow = WorkflowAnalyzer.analyze_workflow(actions, track_order=["1", "2", "3"])
    print(f"Workflow pattern: {workflow.pattern_name} (efficiency: {workflow.efficiency_score:.2f})")
    
    print("? Music Production Pattern Recognition System loaded")
