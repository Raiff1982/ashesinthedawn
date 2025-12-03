"""
Codette Enhanced API Endpoints
Feedback, learning, and analytics endpoints for the enhanced responder
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from codette_enhanced_responder import (
    get_enhanced_responder,
    UserRating,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/codette", tags=["codette"])

# ==============================================================================
# RESPONSE GENERATION
# ==============================================================================

@router.post("/chat-enhanced")
async def chat_enhanced(
    message: str,
    user_id: str = "anonymous",
    context: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Generate response with learning and preference tracking
    """
    try:
        responder = get_enhanced_responder()
        response = responder.generate_response(message, user_id=user_id)
        
        logger.info(
            f"Enhanced response generated: category={response['category']}, "
            f"user={user_id}, confidence={response['combined_confidence']:.2f}"
        )
        
        return response
    except Exception as e:
        logger.error(f"Error generating enhanced response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# FEEDBACK COLLECTION
# ==============================================================================

@router.post("/feedback")
async def record_feedback(
    user_id: str,
    response_id: str,
    category: str,
    perspective: str,
    rating: int,
    rating_name: str,
    helpful_score: float = 0.0,
    helpful_comment: str = "",
    timestamp: str = "",
) -> Dict[str, Any]:
    """
    Record user feedback on a response
    Rating scale: 0=unhelpful, 1=slightly_helpful, 2=helpful, 3=very_helpful, 4=exactly_what_needed
    """
    try:
        # Validate rating
        if rating not in range(5):
            raise ValueError("Rating must be 0-4")

        responder = get_enhanced_responder()
        
        # Convert to UserRating enum
        rating_enum = UserRating(rating)
        
        # Record feedback
        result = responder.record_user_feedback(
            user_id=user_id,
            response_id=response_id,
            category=category,
            perspective=perspective,
            rating=rating_enum,
            helpful_score=helpful_score,
        )
        
        logger.info(
            f"Feedback recorded: user={user_id}, category={category}, "
            f"perspective={perspective}, rating={rating_name}"
        )
        
        return result
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# USER LEARNING PROFILES
# ==============================================================================

@router.get("/user-profile/{user_id}")
async def get_user_profile(user_id: str) -> Dict[str, Any]:
    """
    Get user's learning profile and preferences
    """
    try:
        responder = get_enhanced_responder()
        profile = responder.get_user_learning_profile(user_id)
        
        if "error" in profile:
            raise HTTPException(status_code=404, detail="User not found")
        
        return profile
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-profiles")
async def list_user_profiles(limit: int = Query(10, ge=1, le=100)) -> Dict[str, Any]:
    """
    List top active users and their profiles
    """
    try:
        responder = get_enhanced_responder()
        
        # Get all users
        all_users = list(responder.user_preferences.keys())[:limit]
        profiles = []
        
        for user_id in all_users:
            profile = responder.get_user_learning_profile(user_id)
            if "error" not in profile:
                profiles.append(profile)
        
        return {
            "total_active_users": len(responder.user_preferences),
            "profiles_returned": len(profiles),
            "profiles": profiles,
        }
    except Exception as e:
        logger.error(f"Error listing user profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# ANALYTICS & METRICS
# ==============================================================================

@router.get("/analytics")
async def get_analytics() -> Dict[str, Any]:
    """
    Get system-wide analytics and quality metrics
    """
    try:
        responder = get_enhanced_responder()
        analytics = responder.get_analytics()
        
        return analytics
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/category/{category}")
async def get_category_analytics(category: str) -> Dict[str, Any]:
    """
    Get analytics for a specific category
    """
    try:
        responder = get_enhanced_responder()
        
        # Find feedback for this category
        category_feedback = [
            f for f in responder.user_feedback_history
            if f["category"] == category
        ]
        
        if not category_feedback:
            return {"category": category, "feedback_count": 0, "average_rating": 0}
        
        ratings = [f["rating"] for f in category_feedback]
        average_rating = sum(ratings) / len(ratings)
        
        # Rating distribution
        distribution = {
            "unhelpful": sum(1 for r in ratings if r == 0),
            "slightly_helpful": sum(1 for r in ratings if r == 1),
            "helpful": sum(1 for r in ratings if r == 2),
            "very_helpful": sum(1 for r in ratings if r == 3),
            "exactly_what_needed": sum(1 for r in ratings if r == 4),
        }
        
        return {
            "category": category,
            "feedback_count": len(category_feedback),
            "average_rating": round(average_rating, 2),
            "rating_distribution": distribution,
            "most_common_rating": max(distribution.items(), key=lambda x: x[1])[0],
        }
    except Exception as e:
        logger.error(f"Error fetching category analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/perspective/{perspective}")
async def get_perspective_analytics(perspective: str) -> Dict[str, Any]:
    """
    Get analytics for a specific perspective
    """
    try:
        responder = get_enhanced_responder()
        
        # Find feedback for this perspective
        perspective_feedback = [
            f for f in responder.user_feedback_history
            if f["perspective"] == perspective
        ]
        
        if not perspective_feedback:
            return {"perspective": perspective, "feedback_count": 0, "average_rating": 0}
        
        ratings = [f["rating"] for f in perspective_feedback]
        average_rating = sum(ratings) / len(ratings)
        
        # Find most common categories for this perspective
        categories = {}
        for f in perspective_feedback:
            cat = f["category"]
            categories[cat] = categories.get(cat, 0) + 1
        
        return {
            "perspective": perspective,
            "feedback_count": len(perspective_feedback),
            "average_rating": round(average_rating, 2),
            "used_in_categories": dict(sorted(
                categories.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]),
            "quality_score": min(5, average_rating * 1.25),  # Scale to 5
        }
    except Exception as e:
        logger.error(f"Error fetching perspective analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# RECOMMENDATION ENGINE
# ==============================================================================

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str) -> Dict[str, Any]:
    """
    Get personalized recommendations for a user
    """
    try:
        responder = get_enhanced_responder()
        profile = responder.get_user_learning_profile(user_id)
        
        if "error" in profile:
            return {
                "user_id": user_id,
                "recommendations": [
                    "Start rating responses to get personalized recommendations",
                ],
            }
        
        recommendations = []
        
        # Recommend exploring underused perspectives
        sorted_perspectives = sorted(
            profile["all_perspective_preferences"].items(),
            key=lambda x: x[1],
        )
        
        if sorted_perspectives:
            least_used = sorted_perspectives[0]
            if least_used[1] < 0.4:
                recommendations.append(
                    f"Try exploring more {least_used[0].replace('_', ' ')} "
                    f"perspectives for balanced learning"
                )
        
        # Recommend exploring underused categories
        sorted_categories = sorted(
            profile.get("all_category_preferences", {}).items(),
            key=lambda x: x[1],
        )
        
        if sorted_categories:
            least_used_cat = sorted_categories[0]
            if least_used_cat[1] < 0.3:
                recommendations.append(
                    f"Explore {least_used_cat[0].replace('_', ' ')} "
                    f"for comprehensive DAW knowledge"
                )
        
        # Achievement-based recommendations
        if profile["responses_rated"] >= 10:
            recommendations.append(
                f"?? You've rated {profile['responses_rated']} responses! "
                f"Consider checking the analytics dashboard."
            )
        
        if not recommendations:
            recommendations.append(
                "Great! You're getting well-rounded perspectives. "
                "Keep learning and rating responses!"
            )
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "learning_progress": {
                "responses_rated": profile["responses_rated"],
                "most_preferred": profile["most_preferred_perspective"]["name"],
                "least_preferred": profile["least_preferred_perspective"]["name"],
            },
        }
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# A/B TESTING
# ==============================================================================

@router.get("/ab-tests")
async def list_ab_tests() -> Dict[str, Any]:
    """
    List all active and completed A/B tests
    """
    try:
        responder = get_enhanced_responder()
        
        active_tests = []
        completed_tests = []
        
        for category, test in responder.ab_tests.items():
            test_data = {
                "category": category,
                "variant_a_wins": test.variant_a_wins,
                "variant_b_wins": test.variant_b_wins,
                "total_tests": test.total_tests,
                "confidence": round(test.confidence, 3),
                "winner": test.winner,
            }
            
            if test.winner:
                completed_tests.append(test_data)
            else:
                active_tests.append(test_data)
        
        return {
            "active_tests": len(active_tests),
            "completed_tests": len(completed_tests),
            "active": active_tests,
            "completed": completed_tests,
        }
    except Exception as e:
        logger.error(f"Error listing A/B tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# HEALTH & STATUS
# ==============================================================================

@router.get("/status")
async def get_system_status() -> Dict[str, Any]:
    """
    Get enhanced system status
    """
    try:
        responder = get_enhanced_responder()
        analytics = responder.get_analytics()
        
        return {
            "status": "operational",
            "system": "codette-enhanced",
            "metrics": {
                "responses_generated": analytics["total_responses_generated"],
                "ratings_received": analytics["total_ratings_received"],
                "active_users": analytics["active_users"],
                "average_quality": analytics["average_rating"],
                "categories_available": analytics["total_categories_available"],
            },
            "features": {
                "learning_enabled": True,
                "feedback_system": True,
                "ab_testing": True,
                "user_profiles": True,
                "analytics": True,
                "recommendations": True,
            },
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# EXPORT & IMPORT
# ==============================================================================

@router.get("/export/feedback")
async def export_feedback_data(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Export feedback data for analysis
    """
    try:
        responder = get_enhanced_responder()
        
        feedback = responder.user_feedback_history
        
        if user_id:
            feedback = [f for f in feedback if f["user_id"] == user_id]
        
        return {
            "total_records": len(feedback),
            "user_id": user_id or "all",
            "data": feedback,
        }
    except Exception as e:
        logger.error(f"Error exporting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/user-profiles")
async def export_user_profiles() -> Dict[str, Any]:
    """
    Export all user profiles for analysis
    """
    try:
        responder = get_enhanced_responder()
        
        profiles = []
        for user_id in responder.user_preferences.keys():
            profile = responder.get_user_learning_profile(user_id)
            if "error" not in profile:
                profiles.append(profile)
        
        return {
            "total_profiles": len(profiles),
            "profiles": profiles,
        }
    except Exception as e:
        logger.error(f"Error exporting profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))
