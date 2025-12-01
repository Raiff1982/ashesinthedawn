"""
Supabase API Routes for Codette Backend
Exposes database operations as REST API endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from daw_core.models import (
    ChatMessage,
    UserFeedback,
    BenchmarkSubmitRequest,
    ApiMetricRequest,
)
from daw_core.supabase_client import (
    get_or_create_chat_history,
    add_chat_message,
    clear_chat_history,
    search_music_knowledge_by_text,
    search_music_knowledge_by_similarity,
    add_music_knowledge,
    submit_user_feedback,
    log_api_metric,
    record_benchmark_result,
    upload_file_metadata,
    is_supabase_available,
)

router = APIRouter(prefix="/api/supabase", tags=["supabase"])


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Check if Supabase is available"""
    return {
        "status": "ok" if is_supabase_available() else "degraded",
        "database": "available" if is_supabase_available() else "unavailable",
    }


# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

@router.post("/chat/history")
async def get_or_create_chat(user_id: str):
    """Get or create chat history for user"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await get_or_create_chat_history(user_id)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


@router.post("/chat/message")
async def add_message(
    user_id: str,
    chat_id: str,
    role: str,
    content: str,
    tokens_used: int = 0,
):
    """Add message to chat history"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await add_chat_message(user_id, chat_id, role, content, tokens_used)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


@router.delete("/chat/history/{chat_id}")
async def clear_chat(chat_id: str):
    """Clear chat history"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    success, error = await clear_chat_history(chat_id)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"success": success}


# ============================================================================
# MUSIC KNOWLEDGE ENDPOINTS
# ============================================================================

@router.get("/music-knowledge/search")
async def search_music_knowledge(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
):
    """Search music knowledge by text or category"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await search_music_knowledge_by_text(query or "", category, limit)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data or []}


@router.post("/music-knowledge/search-similar")
async def search_similar_knowledge(
    embedding: List[float],
    limit: int = Query(5, ge=1, le=100),
):
    """Search music knowledge by embedding similarity"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    if not embedding or len(embedding) != 1536:
        raise HTTPException(status_code=400, detail="Embedding must be 1536-dimensional")

    data, error = await search_music_knowledge_by_similarity(embedding, limit)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data or []}


@router.post("/music-knowledge")
async def create_music_knowledge(
    user_id: str,
    title: str,
    content: str,
    category: str,
    embedding: Optional[List[float]] = None,
    tags: Optional[List[str]] = None,
    is_public: bool = True,
):
    """Create new music knowledge entry"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await add_music_knowledge(
        user_id, title, content, category, embedding, tags, is_public
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


# ============================================================================
# FEEDBACK ENDPOINTS
# ============================================================================

@router.post("/feedback")
async def submit_feedback(feedback: UserFeedback):
    """Submit user feedback"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await submit_user_feedback(
        feedback.user_id, feedback.rating, feedback.feedback_text, feedback.category
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


# ============================================================================
# METRICS ENDPOINTS
# ============================================================================

@router.post("/metrics/log")
async def log_metric(request: ApiMetricRequest):
    """Log API metric"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await log_api_metric(
        request.endpoint,
        request.method,
        request.response_time_ms,
        request.status_code,
        request.user_id,
        request.metadata,
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


# ============================================================================
# BENCHMARK ENDPOINTS
# ============================================================================

@router.post("/benchmark")
async def submit_benchmark(request: BenchmarkSubmitRequest):
    """Submit benchmark result"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await record_benchmark_result(
        request.benchmark_type, request.score, request.metadata, request.environment
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


# ============================================================================
# FILE ENDPOINTS
# ============================================================================

@router.post("/files/metadata")
async def upload_file_info(
    user_id: str,
    filename: str,
    file_type: str,
    file_size_bytes: int,
    storage_path: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """Track file metadata in database"""
    if not is_supabase_available():
        raise HTTPException(status_code=503, detail="Database unavailable")

    data, error = await upload_file_metadata(
        user_id, filename, file_type, file_size_bytes, storage_path, metadata
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    return {"data": data}


# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@router.get("/status")
async def database_status():
    """Get database connection status"""
    return {
        "timestamp": datetime.now().isoformat(),
        "database": "available" if is_supabase_available() else "unavailable",
        "status": "ready" if is_supabase_available() else "degraded",
    }
