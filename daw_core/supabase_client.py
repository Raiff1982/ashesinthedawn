"""
Supabase Client Integration for Codette Backend
Handles all database operations and real-time subscriptions
"""

import os
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from dotenv import load_dotenv

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("[WARNING] supabase-py not installed. Install with: pip install supabase")

# Load environment variables
load_dotenv()

# ============================================================================
# SUPABASE CLIENT INITIALIZATION
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Initialize Supabase client (use service role key for backend operations)
supabase: Optional[Client] = None

if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("[OK] Supabase client initialized successfully")
    except Exception as e:
        print(f"[WARNING] Could not initialize Supabase client: {e}")
        supabase = None
else:
    if not SUPABASE_AVAILABLE:
        print("[INFO] Supabase not available - backend will operate without database")
    elif not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[INFO] Supabase environment variables not configured - database disabled")


# ============================================================================
# ERROR HANDLING
# ============================================================================

class SupabaseError(Exception):
    """Custom exception for Supabase operations"""
    pass


def handle_supabase_error(error: Exception) -> Tuple[Dict[str, Any], int]:
    """Convert Supabase errors to HTTP responses"""
    error_str = str(error)

    if "duplicate key" in error_str.lower():
        return {"error": "Record already exists"}, 409
    elif "not found" in error_str.lower() or "no rows" in error_str.lower():
        return {"error": "Record not found"}, 404
    elif "permission denied" in error_str.lower():
        return {"error": "Access denied"}, 403
    elif "jwt" in error_str.lower() or "unauthorized" in error_str.lower():
        return {"error": "Unauthorized"}, 401
    else:
        return {"error": f"Database error: {error_str}"}, 500


# ============================================================================
# CHAT HISTORY OPERATIONS
# ============================================================================

async def get_or_create_chat_history(user_id: str) -> Tuple[Optional[Dict], Optional[str]]:
    """Get or create chat history for user"""
    if not supabase:
        return None, "Supabase not available"

    try:
        # Try to get existing chat history
        response = supabase.table("chat_history").select("*").eq("user_id", user_id).execute()

        if response.data:
            return response.data[0], None

        # Create new chat history
        new_chat = {
            "user_id": user_id,
            "title": "New Chat",
            "messages": [],
            "total_tokens": 0,
            "model_version": "codette-2.0",
            "archived": False,
        }

        response = supabase.table("chat_history").insert(new_chat).execute()
        return response.data[0] if response.data else new_chat, None

    except Exception as e:
        return None, str(e)


async def add_chat_message(
    user_id: str, chat_id: str, role: str, content: str, tokens_used: int = 0
) -> Tuple[Optional[Dict], Optional[str]]:
    """Add message to chat history"""
    if not supabase:
        return None, "Supabase not available"

    try:
        # Insert message
        message = {
            "chat_id": chat_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
        }

        response = supabase.table("chat_message").insert(message).execute()

        # Update chat history total tokens
        if response.data:
            supabase.table("chat_history").update({"total_tokens": "total_tokens + :tokens"}).eq(
                "id", chat_id
            ).execute()

        return response.data[0] if response.data else message, None

    except Exception as e:
        return None, str(e)


async def clear_chat_history(chat_id: str) -> Tuple[bool, Optional[str]]:
    """Clear all messages from chat"""
    if not supabase:
        return False, "Supabase not available"

    try:
        # Delete all messages for this chat
        supabase.table("chat_message").delete().eq("chat_id", chat_id).execute()

        # Reset tokens
        supabase.table("chat_history").update({"total_tokens": 0}).eq("id", chat_id).execute()

        return True, None

    except Exception as e:
        return False, str(e)


# ============================================================================
# MUSIC KNOWLEDGE OPERATIONS
# ============================================================================

async def search_music_knowledge_by_text(
    query: str, category: Optional[str] = None, limit: int = 10
) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """Search music knowledge using full-text search"""
    if not supabase:
        return None, "Supabase not available"

    try:
        # Build query
        q = supabase.table("music_knowledge").select("*")

        if category:
            q = q.eq("category", category)

        # Limit results
        q = q.limit(limit)

        response = q.execute()
        return response.data, None

    except Exception as e:
        return None, str(e)


async def search_music_knowledge_by_similarity(
    embedding: List[float], limit: int = 5
) -> Tuple[Optional[List[Dict]], Optional[str]]:
    """Search music knowledge using vector similarity"""
    if not supabase:
        return None, "Supabase not available"

    try:
        # Call RPC function for vector similarity search
        response = supabase.rpc(
            "search_music_knowledge",
            {
                "query_embedding": embedding,
                "match_count": limit,
            },
        ).execute()

        return response.data, None

    except Exception as e:
        return None, str(e)


async def add_music_knowledge(
    user_id: str, title: str, content: str, category: str, embedding: Optional[List[float]] = None, tags: Optional[List[str]] = None, is_public: bool = True
) -> Tuple[Optional[Dict], Optional[str]]:
    """Add new music knowledge entry"""
    if not supabase:
        return None, "Supabase not available"

    try:
        record = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "category": category,
            "embedding": embedding,
            "tags": tags or [],
            "is_public": is_public,
        }

        response = supabase.table("music_knowledge").insert(record).execute()
        return response.data[0] if response.data else record, None

    except Exception as e:
        return None, str(e)


# ============================================================================
# USER FEEDBACK OPERATIONS
# ============================================================================

async def submit_user_feedback(
    user_id: str, rating: float, feedback_text: str, category: str = "general"
) -> Tuple[Optional[Dict], Optional[str]]:
    """Submit user feedback"""
    if not supabase:
        return None, "Supabase not available"

    try:
        feedback = {
            "user_id": user_id,
            "rating": max(0, min(5, rating)),  # Clamp to 0-5
            "feedback_text": feedback_text,
            "category": category,
        }

        response = supabase.table("user_feedback").insert(feedback).execute()
        return response.data[0] if response.data else feedback, None

    except Exception as e:
        return None, str(e)


# ============================================================================
# API METRICS OPERATIONS
# ============================================================================

async def log_api_metric(
    endpoint: str,
    method: str,
    response_time_ms: float,
    status_code: int,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[Dict], Optional[str]]:
    """Log API endpoint metric"""
    if not supabase:
        return None, "Supabase not available"

    try:
        metric = {
            "endpoint": endpoint,
            "method": method,
            "response_time_ms": response_time_ms,
            "status_code": status_code,
            "user_id": user_id,
            "metadata": metadata or {},
        }

        response = supabase.table("api_metric").insert(metric).execute()
        return response.data[0] if response.data else metric, None

    except Exception as e:
        return None, str(e)


async def get_average_response_time(
    endpoint: Optional[str] = None, time_window_hours: int = 24
) -> Tuple[Optional[float], Optional[str]]:
    """Get average API response time"""
    if not supabase:
        return None, "Supabase not available"

    try:
        # This would typically be done with a PostgreSQL function
        # For now, return None - implement as RPC function in Supabase
        return None, "Not yet implemented - requires RPC function"

    except Exception as e:
        return None, str(e)


# ============================================================================
# BENCHMARK OPERATIONS
# ============================================================================

async def record_benchmark_result(
    benchmark_type: str,
    score: float,
    metadata: Optional[Dict[str, Any]] = None,
    environment: str = "production",
    model_version: str = "2.0",
) -> Tuple[Optional[Dict], Optional[str]]:
    """Record benchmark result"""
    if not supabase:
        return None, "Supabase not available"

    try:
        result = {
            "benchmark_type": benchmark_type,
            "score": score,
            "metadata": metadata or {},
            "environment": environment,
            "model_version": model_version,
        }

        response = supabase.table("benchmark_result").insert(result).execute()
        return response.data[0] if response.data else result, None

    except Exception as e:
        return None, str(e)


# ============================================================================
# CODETTE FILE OPERATIONS
# ============================================================================

async def upload_file_metadata(
    user_id: str,
    filename: str,
    file_type: str,
    file_size_bytes: int,
    storage_path: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[Dict], Optional[str]]:
    """Track file upload in database"""
    if not supabase:
        return None, "Supabase not available"

    try:
        record = {
            "user_id": user_id,
            "filename": filename,
            "file_type": file_type,
            "file_size_bytes": file_size_bytes,
            "storage_path": storage_path,
            "metadata": metadata or {},
        }

        response = supabase.table("codette_file").insert(record).execute()
        return response.data[0] if response.data else record, None

    except Exception as e:
        return None, str(e)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_supabase_client() -> Optional[Client]:
    """Get Supabase client instance"""
    return supabase


def is_supabase_available() -> bool:
    """Check if Supabase is available"""
    return supabase is not None and SUPABASE_AVAILABLE


# ============================================================================
# OPERATION GROUPS (for compatibility with frontend imports)
# ============================================================================

# Create operation group objects for easier organization
class ChatHistoryOps:
    @staticmethod
    async def getOrCreate(user_id: str):
        return await get_or_create_chat_history(user_id)
    
    @staticmethod
    async def addMessage(user_id: str, chat_id: str, role: str, content: str, tokens_used: int = 0):
        return await add_chat_message(user_id, chat_id, role, content, tokens_used)
    
    @staticmethod
    async def clear(chat_id: str):
        return await clear_chat_history(chat_id)

class MusicKnowledgeOps:
    @staticmethod
    async def searchByText(query: str, category: Optional[str] = None, limit: int = 10):
        return await search_music_knowledge_by_text(query, category, limit)
    
    @staticmethod
    async def searchBySimilarity(embedding: list, limit: int = 5):
        return await search_music_knowledge_by_similarity(embedding, limit)
    
    @staticmethod
    async def getByCategory(category: str):
        return await search_music_knowledge_by_text("", category, 10)
    
    @staticmethod
    async def add(user_id: str, title: str, content: str, category: str, embedding=None, tags=None, is_public=True):
        return await add_music_knowledge(user_id, title, content, category, embedding, tags, is_public)

class FeedbackOps:
    @staticmethod
    async def submit(feedback_data):
        if hasattr(feedback_data, 'user_id'):
            return await submit_user_feedback(
                feedback_data.user_id,
                feedback_data.rating,
                feedback_data.feedback_text,
                getattr(feedback_data, 'category', 'general')
            )
        return None, "Invalid feedback data"

# Export operation groups
chatHistoryOps = ChatHistoryOps()
musicKnowledgeOps = MusicKnowledgeOps()
feedbackOps = FeedbackOps()
