"""
Real-Time Context Awareness System
Synchronizes DAW state and provides adaptive, context-aware intelligence
"""

import asyncio
import time
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# CONTEXT STATE MODELS
# ============================================================================

class DAWState(Enum):
    """Current state of the DAW"""
    IDLE = "idle"
    PLAYING = "playing"
    RECORDING = "recording"
    MIXING = "mixing"
    MASTERING = "mastering"

class UserIntent(Enum):
    """Detected user intent"""
    EXPLORING = "exploring"
    MIXING = "mixing"
    CREATING = "creating"
    EDITING = "editing"
    LEARNING = "learning"

@dataclass
class DAWContext:
    """Complete DAW context snapshot"""
    # Project info
    project_name: str
    bpm: float
    sample_rate: int
    time_signature: str = "4/4"
    
    # Transport state
    is_playing: bool = False
    is_recording: bool = False
    current_time: float = 0.0
    loop_enabled: bool = False
    
    # Tracks
    tracks: List[Dict[str, Any]] = field(default_factory=list)
    selected_track_id: Optional[str] = None
    
    # User activity
    last_action: Optional[str] = None
    last_action_time: Optional[float] = None
    actions_per_minute: float = 0.0
    
    # Detected state
    daw_state: DAWState = DAWState.IDLE
    user_intent: UserIntent = UserIntent.EXPLORING
    
    # Performance
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    buffer_size: int = 512
    
    # Analysis cache
    last_analysis_time: Optional[float] = None
    analysis_valid: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "project_name": self.project_name,
            "bpm": self.bpm,
            "sample_rate": self.sample_rate,
            "time_signature": self.time_signature,
            "is_playing": self.is_playing,
            "is_recording": self.is_recording,
            "current_time": self.current_time,
            "tracks": self.tracks,
            "selected_track_id": self.selected_track_id,
            "last_action": self.last_action,
            "daw_state": self.daw_state.value,
            "user_intent": self.user_intent.value,
            "cpu_usage": self.cpu_usage,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@dataclass
class ContextChange:
    """Represents a change in DAW context"""
    timestamp: float
    change_type: str
    old_value: Any
    new_value: Any
    track_id: Optional[str] = None
    
    def is_significant(self) -> bool:
        """Determine if this change warrants new suggestions"""
        # Significant changes trigger re-analysis
        significant_types = [
            "track_added", "track_removed", "track_selected",
            "effect_added", "effect_removed", "volume_changed",
            "playback_started", "playback_stopped", "recording_started"
        ]
        return self.change_type in significant_types

# ============================================================================
# REAL-TIME CONTEXT MANAGER
# ============================================================================

class RealTimeContextManager:
    """
    Manages real-time DAW context and triggers intelligent updates
    """
    
    def __init__(self):
        self.current_context: Optional[DAWContext] = None
        self.context_history: List[DAWContext] = []
        self.change_history: List[ContextChange] = []
        
        # Subscribers (callback functions)
        self.change_subscribers: List[Callable[[ContextChange], None]] = []
        self.update_subscribers: List[Callable[[DAWContext], None]] = []
        
        # Analysis throttling
        self.last_analysis_time: float = 0
        self.analysis_cooldown: float = 2.0  # seconds
        
        # Activity tracking
        self.action_timestamps: List[float] = []
        self.action_window: float = 60.0  # 1 minute window
        
        # Learning data
        self.user_preferences: Dict[str, Any] = {}
        self.common_workflows: List[List[str]] = []
        
    def update_context(self, context_data: Dict[str, Any]) -> List[ContextChange]:
        """
        Update current context and detect changes
        
        Args:
            context_data: New context data from DAW
            
        Returns:
            List of detected changes
        """
        new_context = self._parse_context_data(context_data)
        changes = []
        
        if self.current_context:
            changes = self._detect_changes(self.current_context, new_context)
            
            # Track user activity
            if changes:
                self._track_user_activity(changes)
        
        # Update context
        self.current_context = new_context
        self.context_history.append(new_context)
        
        # Limit history size
        if len(self.context_history) > 100:
            self.context_history = self.context_history[-100:]
        
        # Notify subscribers
        for change in changes:
            self.change_history.append(change)
            for subscriber in self.change_subscribers:
                try:
                    subscriber(change)
                except Exception as e:
                    logger.error(f"Change subscriber error: {e}")
        
        # Notify context update subscribers
        for subscriber in self.update_subscribers:
            try:
                subscriber(new_context)
            except Exception as e:
                logger.error(f"Update subscriber error: {e}")
        
        return changes
    
    def subscribe_to_changes(self, callback: Callable[[ContextChange], None]) -> None:
        """Subscribe to context changes"""
        self.change_subscribers.append(callback)
    
    def subscribe_to_updates(self, callback: Callable[[DAWContext], None]) -> None:
        """Subscribe to context updates"""
        self.update_subscribers.append(callback)
    
    def should_analyze(self) -> bool:
        """Check if enough time has passed for new analysis"""
        current_time = time.time()
        if current_time - self.last_analysis_time >= self.analysis_cooldown:
            self.last_analysis_time = current_time
            return True
        return False
    
    def get_user_activity_level(self) -> str:
        """Get current user activity level"""
        apm = self._calculate_actions_per_minute()
        
        if apm > 20:
            return "very_active"
        elif apm > 10:
            return "active"
        elif apm > 3:
            return "moderate"
        else:
            return "idle"
    
    def detect_user_intent(self) -> UserIntent:
        """Detect what the user is trying to do"""
        if not self.current_context:
            return UserIntent.EXPLORING
        
        # Check recording state
        if self.current_context.is_recording:
            return UserIntent.CREATING
        
        # Check playback state
        if self.current_context.is_playing:
            return UserIntent.MIXING
        
        # Check recent actions
        recent_actions = self._get_recent_actions(window=30)
        
        if not recent_actions:
            return UserIntent.EXPLORING
        
        # Analyze action patterns
        action_types = [action.get("type") for action in recent_actions]
        
        if action_types.count("volume_change") > 3 or action_types.count("pan_change") > 2:
            return UserIntent.MIXING
        
        if action_types.count("track_add") > 1:
            return UserIntent.CREATING
        
        if action_types.count("effect_add") > 2:
            return UserIntent.EDITING
        
        return UserIntent.EXPLORING
    
    def get_context_summary(self) -> Dict[str, Any]:
        """Get summary of current context for AI processing"""
        if not self.current_context:
            return {"status": "no_context"}
        
        return {
            "project": {
                "name": self.current_context.project_name,
                "bpm": self.current_context.bpm,
                "track_count": len(self.current_context.tracks)
            },
            "state": {
                "daw_state": self.current_context.daw_state.value,
                "user_intent": self.detect_user_intent().value,
                "activity_level": self.get_user_activity_level(),
                "is_playing": self.current_context.is_playing,
                "is_recording": self.current_context.is_recording
            },
            "performance": {
                "cpu_usage": self.current_context.cpu_usage,
                "memory_usage": self.current_context.memory_usage
            },
            "recent_changes": len([c for c in self.change_history[-10:] if c.is_significant()])
        }
    
    def _parse_context_data(self, data: Dict[str, Any]) -> DAWContext:
        """Parse context data into DAWContext object"""
        return DAWContext(
            project_name=data.get("project_name", "Untitled"),
            bpm=float(data.get("bpm", 120)),
            sample_rate=int(data.get("sample_rate", 44100)),
            time_signature=data.get("time_signature", "4/4"),
            is_playing=data.get("is_playing", False),
            is_recording=data.get("is_recording", False),
            current_time=float(data.get("current_time", 0)),
            tracks=data.get("tracks", []),
            selected_track_id=data.get("selected_track_id"),
            last_action=data.get("last_action"),
            cpu_usage=float(data.get("cpu_usage", 0)),
            memory_usage=float(data.get("memory_usage", 0))
        )
    
    def _detect_changes(self, old_context: DAWContext, new_context: DAWContext) -> List[ContextChange]:
        """Detect changes between contexts"""
        changes = []
        timestamp = time.time()
        
        # Track count changes
        if len(old_context.tracks) != len(new_context.tracks):
            if len(new_context.tracks) > len(old_context.tracks):
                changes.append(ContextChange(
                    timestamp=timestamp,
                    change_type="track_added",
                    old_value=len(old_context.tracks),
                    new_value=len(new_context.tracks)
                ))
            else:
                changes.append(ContextChange(
                    timestamp=timestamp,
                    change_type="track_removed",
                    old_value=len(old_context.tracks),
                    new_value=len(new_context.tracks)
                ))
        
        # Selected track changes
        if old_context.selected_track_id != new_context.selected_track_id:
            changes.append(ContextChange(
                timestamp=timestamp,
                change_type="track_selected",
                old_value=old_context.selected_track_id,
                new_value=new_context.selected_track_id,
                track_id=new_context.selected_track_id
            ))
        
        # Playback state changes
        if old_context.is_playing != new_context.is_playing:
            changes.append(ContextChange(
                timestamp=timestamp,
                change_type="playback_started" if new_context.is_playing else "playback_stopped",
                old_value=old_context.is_playing,
                new_value=new_context.is_playing
            ))
        
        # Recording state changes
        if old_context.is_recording != new_context.is_recording:
            changes.append(ContextChange(
                timestamp=timestamp,
                change_type="recording_started" if new_context.is_recording else "recording_stopped",
                old_value=old_context.is_recording,
                new_value=new_context.is_recording
            ))
        
        return changes
    
    def _track_user_activity(self, changes: List[ContextChange]) -> None:
        """Track user activity for intent detection"""
        current_time = time.time()
        
        # Add timestamps for significant changes
        for change in changes:
            if change.is_significant():
                self.action_timestamps.append(current_time)
        
        # Clean old timestamps (older than window)
        cutoff_time = current_time - self.action_window
        self.action_timestamps = [ts for ts in self.action_timestamps if ts > cutoff_time]
    
    def _calculate_actions_per_minute(self) -> float:
        """Calculate actions per minute in the window"""
        if not self.action_timestamps:
            return 0.0
        
        # Count actions in the last minute
        current_time = time.time()
        recent_actions = [ts for ts in self.action_timestamps if current_time - ts <= 60]
        
        return len(recent_actions)
    
    def _get_recent_actions(self, window: float = 30) -> List[Dict[str, Any]]:
        """Get actions in the recent time window"""
        current_time = time.time()
        cutoff_time = current_time - window
        
        recent_changes = [
            {"type": c.change_type, "timestamp": c.timestamp}
            for c in self.change_history
            if c.timestamp > cutoff_time
        ]
        
        return recent_changes

# ============================================================================
# ADAPTIVE SUGGESTION ENGINE
# ============================================================================

class AdaptiveSuggestionEngine:
    """
    Provides suggestions that adapt to user context and behavior
    """
    
    def __init__(self, context_manager: RealTimeContextManager):
        self.context_manager = context_manager
        self.suggestion_cache: Dict[str, List[Dict[str, Any]]] = {}
        self.suggestion_history: List[Dict[str, Any]] = []
        
        # Subscribe to context changes
        context_manager.subscribe_to_changes(self._on_context_change)
    
    def get_adaptive_suggestions(
        self,
        context: Optional[DAWContext] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get suggestions adapted to current context
        
        Args:
            context: Optional context override
            limit: Maximum suggestions to return
            
        Returns:
            List of adaptive suggestions
        """
        # Use provided context or current
        ctx = context or self.context_manager.current_context
        
        if not ctx:
            return []
        
        # Check cache
        cache_key = self._get_cache_key(ctx)
        if cache_key in self.suggestion_cache:
            logger.debug("Returning cached adaptive suggestions")
            return self.suggestion_cache[cache_key][:limit]
        
        # Generate new suggestions
        suggestions = self._generate_suggestions(ctx)
        
        # Cache results
        self.suggestion_cache[cache_key] = suggestions
        
        return suggestions[:limit]
    
    def _on_context_change(self, change: ContextChange) -> None:
        """Handle context change event"""
        if change.is_significant():
            logger.debug(f"Significant change detected: {change.change_type}")
            # Clear cache to force re-generation
            self.suggestion_cache.clear()
    
    def _generate_suggestions(self, context: DAWContext) -> List[Dict[str, Any]]:
        """Generate context-aware suggestions"""
        suggestions = []
        
        # Detect user intent
        intent = self.context_manager.detect_user_intent()
        
        # Intent-based suggestions
        if intent == UserIntent.MIXING:
            suggestions.extend(self._get_mixing_suggestions(context))
        elif intent == UserIntent.CREATING:
            suggestions.extend(self._get_creative_suggestions(context))
        elif intent == UserIntent.EDITING:
            suggestions.extend(self._get_editing_suggestions(context))
        elif intent == UserIntent.LEARNING:
            suggestions.extend(self._get_learning_suggestions(context))
        
        # Performance-based suggestions
        if context.cpu_usage > 80:
            suggestions.append({
                "type": "performance",
                "priority": 1,
                "title": "High CPU Usage",
                "description": f"CPU at {context.cpu_usage:.0f}% - consider freezing tracks or increasing buffer size",
                "action": "optimize_performance"
            })
        
        # Track count suggestions
        if len(context.tracks) > 50:
            suggestions.append({
                "type": "workflow",
                "priority": 2,
                "title": "Large Project",
                "description": "Many tracks - consider organizing into groups or folders",
                "action": "organize_tracks"
            })
        
        return suggestions
    
    def _get_mixing_suggestions(self, context: DAWContext) -> List[Dict[str, Any]]:
        """Get mixing-specific suggestions"""
        return [
            {
                "type": "mixing",
                "priority": 1,
                "title": "Balance Levels",
                "description": "Check track levels for proper gain staging (-6dB to -3dB peaks)",
                "action": "check_levels"
            },
            {
                "type": "mixing",
                "priority": 2,
                "title": "Frequency Balance",
                "description": "Use spectrum analyzer to check overall frequency balance",
                "action": "analyze_spectrum"
            }
        ]
    
    def _get_creative_suggestions(self, context: DAWContext) -> List[Dict[str, Any]]:
        """Get creative workflow suggestions"""
        return [
            {
                "type": "creative",
                "priority": 1,
                "title": "Record Setup",
                "description": "Check input levels and monitoring before recording",
                "action": "setup_recording"
            },
            {
                "type": "creative",
                "priority": 2,
                "title": "Tempo Reference",
                "description": f"Current tempo: {context.bpm} BPM - enable metronome if needed",
                "action": "enable_metronome"
            }
        ]
    
    def _get_editing_suggestions(self, context: DAWContext) -> List[Dict[str, Any]]:
        """Get editing workflow suggestions"""
        return [
            {
                "type": "editing",
                "priority": 1,
                "title": "Save Project",
                "description": "Consider saving your progress",
                "action": "save_project"
            }
        ]
    
    def _get_learning_suggestions(self, context: DAWContext) -> List[Dict[str, Any]]:
        """Get learning-focused suggestions"""
        return [
            {
                "type": "learning",
                "priority": 1,
                "title": "Learn Mixing Basics",
                "description": "Try adjusting EQ and compression on the selected track",
                "action": "tutorial_mixing"
            }
        ]
    
    def _get_cache_key(self, context: DAWContext) -> str:
        """Generate cache key from context"""
        return f"{context.daw_state.value}_{context.user_intent.value}_{len(context.tracks)}"

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    context_manager = RealTimeContextManager()
    suggestion_engine = AdaptiveSuggestionEngine(context_manager)
    
    # Simulate DAW context update
    context_data = {
        "project_name": "My Song",
        "bpm": 120,
        "sample_rate": 44100,
        "is_playing": True,
        "tracks": [
            {"id": "1", "name": "Vocals", "type": "audio"},
            {"id": "2", "name": "Drums", "type": "audio"}
        ],
        "cpu_usage": 45
    }
    
    changes = context_manager.update_context(context_data)
    print(f"Detected {len(changes)} changes")
    
    # Get adaptive suggestions
    suggestions = suggestion_engine.get_adaptive_suggestions(limit=3)
    for sug in suggestions:
        print(f"[{sug['priority']}] {sug['title']}: {sug['description']}")
    
    print("? Real-Time Context Awareness System loaded")
