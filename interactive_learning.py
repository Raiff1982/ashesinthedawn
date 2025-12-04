"""
Interactive Learning System with User Feedback
Learns from user actions and improves suggestions over time
"""

import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# FEEDBACK MODELS
# ============================================================================

class FeedbackType(Enum):
    """Types of user feedback"""
    POSITIVE = "positive"  # User liked suggestion
    NEGATIVE = "negative"  # User disliked suggestion
    APPLIED = "applied"    # User applied suggestion
    IGNORED = "ignored"    # User ignored suggestion
    MODIFIED = "modified"  # User modified and applied

class SuggestionOutcome(Enum):
    """Outcome of a suggestion"""
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    PARTIALLY_HELPFUL = "partially_helpful"
    UNKNOWN = "unknown"

@dataclass
class UserFeedback:
    """User feedback on a suggestion"""
    suggestion_id: str
    feedback_type: FeedbackType
    timestamp: float
    user_comment: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            "feedback_type": self.feedback_type.value,
            "timestamp_iso": datetime.fromtimestamp(self.timestamp, timezone.utc).isoformat()
        }

@dataclass
class SuggestionEvaluation:
    """Evaluation of suggestion effectiveness"""
    suggestion_id: str
    suggestion_type: str
    was_applied: bool
    was_helpful: bool
    user_rating: Optional[int] = None  # 1-5 scale
    time_to_action: Optional[float] = None  # seconds
    modifications_made: List[str] = field(default_factory=list)

# ============================================================================
# LEARNING ENGINE
# ============================================================================

class InteractiveLearningEngine:
    """
    Learns from user feedback to improve suggestion quality
    """
    
    def __init__(self):
        # Feedback storage
        self.feedback_history: List[UserFeedback] = []
        self.suggestion_evaluations: Dict[str, SuggestionEvaluation] = {}
        
        # Learning data
        self.suggestion_effectiveness: Dict[str, float] = {}
        self.context_success_patterns: Dict[str, List[Dict[str, Any]]] = {}
        self.user_preferences: Dict[str, Any] = {
            "preferred_suggestion_types": [],
            "avoided_suggestion_types": [],
            "typical_workflow": [],
            "skill_level": "intermediate"
        }
        
        # Suggestion tracking
        self.active_suggestions: Dict[str, Dict[str, Any]] = {}
        self.suggestion_counter = 0
        
        # Performance metrics
        self.metrics = {
            "total_suggestions": 0,
            "applied_suggestions": 0,
            "positive_feedback": 0,
            "negative_feedback": 0,
            "application_rate": 0.0,
            "user_satisfaction": 0.0
        }
    
    def track_suggestion(
        self,
        suggestion: Dict[str, Any],
        context: Dict[str, Any]
    ) -> str:
        """
        Start tracking a suggestion
        
        Args:
            suggestion: Suggestion dict with type, description, etc.
            context: Context when suggestion was made
            
        Returns:
            suggestion_id for tracking
        """
        self.suggestion_counter += 1
        suggestion_id = f"sug_{int(time.time())}_{self.suggestion_counter}"
        
        self.active_suggestions[suggestion_id] = {
            "suggestion": suggestion,
            "context": context,
            "timestamp": time.time(),
            "status": "pending"
        }
        
        self.metrics["total_suggestions"] += 1
        
        logger.debug(f"Tracking suggestion {suggestion_id}: {suggestion.get('title')}")
        
        return suggestion_id
    
    def record_feedback(
        self,
        suggestion_id: str,
        feedback_type: FeedbackType,
        user_comment: Optional[str] = None,
        user_rating: Optional[int] = None
    ) -> None:
        """
        Record user feedback on a suggestion
        
        Args:
            suggestion_id: ID of suggestion
            feedback_type: Type of feedback
            user_comment: Optional comment from user
            user_rating: Optional 1-5 rating
        """
        if suggestion_id not in self.active_suggestions:
            logger.warning(f"Unknown suggestion ID: {suggestion_id}")
            return
        
        suggestion_data = self.active_suggestions[suggestion_id]
        
        # Create feedback record
        feedback = UserFeedback(
            suggestion_id=suggestion_id,
            feedback_type=feedback_type,
            timestamp=time.time(),
            user_comment=user_comment,
            context=suggestion_data["context"]
        )
        
        self.feedback_history.append(feedback)
        
        # Update suggestion status
        if feedback_type == FeedbackType.APPLIED:
            suggestion_data["status"] = "applied"
            self.metrics["applied_suggestions"] += 1
        elif feedback_type == FeedbackType.IGNORED:
            suggestion_data["status"] = "ignored"
        
        # Update metrics
        if feedback_type == FeedbackType.POSITIVE:
            self.metrics["positive_feedback"] += 1
        elif feedback_type == FeedbackType.NEGATIVE:
            self.metrics["negative_feedback"] += 1
        
        self._update_metrics()
        
        # Learn from feedback
        self._learn_from_feedback(suggestion_data, feedback, user_rating)
        
        logger.info(f"Recorded {feedback_type.value} feedback for {suggestion_id}")
    
    def suggest_with_learning(
        self,
        base_suggestions: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Filter and rank suggestions based on learned preferences
        
        Args:
            base_suggestions: Raw suggestions from suggestion engine
            context: Current context
            
        Returns:
            Filtered and ranked suggestions
        """
        if not base_suggestions:
            return []
        
        # Score each suggestion based on learned effectiveness
        scored_suggestions = []
        for suggestion in base_suggestions:
            score = self._calculate_suggestion_score(suggestion, context)
            scored_suggestions.append({
                **suggestion,
                "learning_score": score,
                "confidence": suggestion.get("confidence", 0.5) * score
            })
        
        # Filter out low-scoring suggestions
        min_score = 0.3
        filtered = [s for s in scored_suggestions if s["learning_score"] >= min_score]
        
        # Sort by combined score
        filtered.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Track filtered suggestions
        for suggestion in filtered:
            suggestion["suggestion_id"] = self.track_suggestion(suggestion, context)
        
        return filtered
    
    def get_personalized_tips(self, context: Dict[str, Any]) -> List[str]:
        """Get personalized tips based on user's skill level and preferences"""
        tips = []
        
        skill_level = self.user_preferences["skill_level"]
        
        if skill_level == "beginner":
            tips.extend([
                "?? Start with gain staging - aim for -6dB to -3dB peaks on individual tracks",
                "?? Learn keyboard shortcuts to speed up your workflow",
                "?? Focus on getting the balance right before adding effects"
            ])
        elif skill_level == "intermediate":
            tips.extend([
                "?? Use reference tracks to guide your mixing decisions",
                "?? Check your mix in mono to ensure proper balance",
                "??? Try parallel compression for natural-sounding dynamics control"
            ])
        else:  # advanced
            tips.extend([
                "?? Experiment with mid-side processing for wider mixes",
                "?? Use linear-phase EQ for mastering to avoid phase shifts",
                "??? Consider using dynamic EQ for surgical frequency control"
            ])
        
        # Add context-specific tips
        if context.get("track_count", 0) > 30:
            tips.append("??? With many tracks, use color coding and folders for organization")
        
        return tips[:3]
    
    def get_learning_report(self) -> Dict[str, Any]:
        """Generate learning progress report"""
        total_feedback = len(self.feedback_history)
        
        if total_feedback == 0:
            return {
                "status": "no_data",
                "message": "Not enough feedback data yet"
            }
        
        # Calculate statistics
        feedback_by_type = {}
        for feedback in self.feedback_history:
            ftype = feedback.feedback_type.value
            feedback_by_type[ftype] = feedback_by_type.get(ftype, 0) + 1
        
        # Top effective suggestion types
        effective_types = sorted(
            self.suggestion_effectiveness.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            "status": "success",
            "total_suggestions": self.metrics["total_suggestions"],
            "total_feedback": total_feedback,
            "application_rate": self.metrics["application_rate"],
            "user_satisfaction": self.metrics["user_satisfaction"],
            "feedback_breakdown": feedback_by_type,
            "most_effective_types": [
                {"type": t, "score": s} for t, s in effective_types
            ],
            "user_skill_level": self.user_preferences["skill_level"],
            "preferred_types": self.user_preferences["preferred_suggestion_types"][:5]
        }
    
    def export_learning_data(self) -> str:
        """Export learning data as JSON"""
        data = {
            "feedback_history": [f.to_dict() for f in self.feedback_history],
            "metrics": self.metrics,
            "user_preferences": self.user_preferences,
            "suggestion_effectiveness": self.suggestion_effectiveness,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }
        return json.dumps(data, indent=2)
    
    def import_learning_data(self, json_data: str) -> bool:
        """Import previously exported learning data"""
        try:
            data = json.loads(json_data)
            
            # Restore feedback history
            self.feedback_history = [
                UserFeedback(
                    suggestion_id=f["suggestion_id"],
                    feedback_type=FeedbackType(f["feedback_type"]),
                    timestamp=f["timestamp"],
                    user_comment=f.get("user_comment"),
                    context=f.get("context", {})
                )
                for f in data.get("feedback_history", [])
            ]
            
            # Restore metrics and preferences
            self.metrics = data.get("metrics", self.metrics)
            self.user_preferences = data.get("user_preferences", self.user_preferences)
            self.suggestion_effectiveness = data.get("suggestion_effectiveness", {})
            
            logger.info(f"Imported {len(self.feedback_history)} feedback records")
            return True
            
        except Exception as e:
            logger.error(f"Failed to import learning data: {e}")
            return False
    
    def _calculate_suggestion_score(
        self,
        suggestion: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """Calculate score for suggestion based on learned patterns"""
        base_score = 1.0
        
        suggestion_type = suggestion.get("type", "unknown")
        
        # Check effectiveness history
        if suggestion_type in self.suggestion_effectiveness:
            effectiveness = self.suggestion_effectiveness[suggestion_type]
            base_score *= effectiveness
        
        # Check user preferences
        if suggestion_type in self.user_preferences.get("preferred_suggestion_types", []):
            base_score *= 1.2
        elif suggestion_type in self.user_preferences.get("avoided_suggestion_types", []):
            base_score *= 0.5
        
        # Context matching
        if suggestion_type in self.context_success_patterns:
            # Check if current context matches successful patterns
            matching_patterns = self._count_matching_patterns(context, suggestion_type)
            if matching_patterns > 0:
                base_score *= (1 + matching_patterns * 0.1)
        
        return min(1.0, base_score)
    
    def _learn_from_feedback(
        self,
        suggestion_data: Dict[str, Any],
        feedback: UserFeedback,
        user_rating: Optional[int]
    ) -> None:
        """Update learning models based on feedback"""
        suggestion = suggestion_data["suggestion"]
        suggestion_type = suggestion.get("type", "unknown")
        
        # Update effectiveness scores
        if suggestion_type not in self.suggestion_effectiveness:
            self.suggestion_effectiveness[suggestion_type] = 0.5  # Start neutral
        
        current_score = self.suggestion_effectiveness[suggestion_type]
        
        # Adjust score based on feedback
        if feedback.feedback_type == FeedbackType.APPLIED:
            new_score = current_score * 0.9 + 1.0 * 0.1  # Move towards 1.0
        elif feedback.feedback_type == FeedbackType.POSITIVE:
            new_score = current_score * 0.95 + 1.0 * 0.05
        elif feedback.feedback_type == FeedbackType.NEGATIVE:
            new_score = current_score * 0.9 + 0.0 * 0.1  # Move towards 0.0
        elif feedback.feedback_type == FeedbackType.IGNORED:
            new_score = current_score * 0.95 + 0.3 * 0.05
        else:
            new_score = current_score
        
        self.suggestion_effectiveness[suggestion_type] = new_score
        
        # Update user preferences
        if feedback.feedback_type in [FeedbackType.APPLIED, FeedbackType.POSITIVE]:
            if suggestion_type not in self.user_preferences["preferred_suggestion_types"]:
                self.user_preferences["preferred_suggestion_types"].append(suggestion_type)
        elif feedback.feedback_type == FeedbackType.NEGATIVE:
            if suggestion_type not in self.user_preferences["avoided_suggestion_types"]:
                self.user_preferences["avoided_suggestion_types"].append(suggestion_type)
        
        # Learn context patterns for successful suggestions
        if feedback.feedback_type == FeedbackType.APPLIED:
            if suggestion_type not in self.context_success_patterns:
                self.context_success_patterns[suggestion_type] = []
            
            self.context_success_patterns[suggestion_type].append(feedback.context)
            
            # Limit pattern storage
            if len(self.context_success_patterns[suggestion_type]) > 100:
                self.context_success_patterns[suggestion_type] = \
                    self.context_success_patterns[suggestion_type][-100:]
    
    def _count_matching_patterns(self, context: Dict[str, Any], suggestion_type: str) -> int:
        """Count how many successful patterns match current context"""
        if suggestion_type not in self.context_success_patterns:
            return 0
        
        patterns = self.context_success_patterns[suggestion_type]
        matches = 0
        
        for pattern in patterns:
            # Simple matching: check if key properties match
            if pattern.get("track_count") == context.get("track_count"):
                matches += 1
            if pattern.get("is_playing") == context.get("is_playing"):
                matches += 0.5
        
        return int(matches)
    
    def _update_metrics(self) -> None:
        """Update performance metrics"""
        if self.metrics["total_suggestions"] > 0:
            self.metrics["application_rate"] = (
                self.metrics["applied_suggestions"] / self.metrics["total_suggestions"]
            )
        
        total_sentiment = self.metrics["positive_feedback"] + self.metrics["negative_feedback"]
        if total_sentiment > 0:
            self.metrics["user_satisfaction"] = (
                self.metrics["positive_feedback"] / total_sentiment
            )

# ============================================================================
# FEEDBACK COLLECTOR
# ============================================================================

class FeedbackCollector:
    """Collects feedback through various methods"""
    
    def __init__(self, learning_engine: InteractiveLearningEngine):
        self.learning_engine = learning_engine
    
    def collect_implicit_feedback(
        self,
        suggestion_id: str,
        user_action: str,
        action_context: Dict[str, Any]
    ) -> None:
        """
        Collect implicit feedback from user actions
        
        Args:
            suggestion_id: ID of suggestion
            user_action: Action user took
            action_context: Context of action
        """
        # Implicit feedback based on user actions
        if user_action == "apply_suggestion":
            self.learning_engine.record_feedback(
                suggestion_id,
                FeedbackType.APPLIED
            )
        elif user_action == "close_suggestion":
            self.learning_engine.record_feedback(
                suggestion_id,
                FeedbackType.IGNORED
            )
        elif user_action == "modify_and_apply":
            self.learning_engine.record_feedback(
                suggestion_id,
                FeedbackType.MODIFIED
            )
    
    def collect_explicit_feedback(
        self,
        suggestion_id: str,
        is_helpful: bool,
        rating: Optional[int] = None,
        comment: Optional[str] = None
    ) -> None:
        """
        Collect explicit feedback from user ratings
        
        Args:
            suggestion_id: ID of suggestion
            is_helpful: Whether suggestion was helpful
            rating: Optional 1-5 rating
            comment: Optional user comment
        """
        feedback_type = FeedbackType.POSITIVE if is_helpful else FeedbackType.NEGATIVE
        
        self.learning_engine.record_feedback(
            suggestion_id,
            feedback_type,
            user_comment=comment,
            user_rating=rating
        )

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    learning_engine = InteractiveLearningEngine()
    feedback_collector = FeedbackCollector(learning_engine)
    
    # Simulate suggestions with learning
    base_suggestions = [
        {"type": "eq", "title": "EQ Suggestion", "description": "Add high-pass filter", "confidence": 0.8},
        {"type": "compression", "title": "Compression", "description": "Apply gentle compression", "confidence": 0.7}
    ]
    
    context = {"track_count": 5, "is_playing": False}
    
    learned_suggestions = learning_engine.suggest_with_learning(base_suggestions, context)
    print(f"Generated {len(learned_suggestions)} learned suggestions")
    
    # Simulate feedback
    if learned_suggestions:
        sug_id = learned_suggestions[0]["suggestion_id"]
        feedback_collector.collect_explicit_feedback(sug_id, is_helpful=True, rating=5)
    
    # Get report
    report = learning_engine.get_learning_report()
    print(f"Application rate: {report['application_rate']:.2%}")
    print(f"User satisfaction: {report['user_satisfaction']:.2%}")
    
    print("? Interactive Learning System loaded")
