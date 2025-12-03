"""
Supabase Database Models for CoreLogic Studio Backend
Matches TypeScript interfaces in src/types/supabase.ts
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============================================================================
# ENUMS
# ============================================================================

class EmotionEnum(str, Enum):
    """Emotional states in Codette's emotional system"""
    INSPIRED = "inspired"
    CONFUSED = "confused"
    CONFIDENT = "confident"
    UNCERTAIN = "uncertain"
    CREATIVE = "creative"
    ANALYTICAL = "analytical"
    JOYFUL = "joyful"


class UserRoleEnum(str, Enum):
    """User permission levels"""
    USER = "user"
    ADMIN = "admin"


class VerificationStatusEnum(str, Enum):
    """Email verification status"""
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    PENDING = "pending"


class ChatRoleEnum(str, Enum):
    """Chat message sender role"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ============================================================================
# USER & ADMIN MODELS
# ============================================================================

class AdminUser(BaseModel):
    """Administrative user with elevated permissions"""
    id: str
    email: str
    role: UserRoleEnum = UserRoleEnum.ADMIN
    permissions: List[str] = []
    created_at: datetime
    updated_at: datetime
    is_active: bool = True


class UserFeedback(BaseModel):
    """User feedback and ratings"""
    id: Optional[str] = None
    user_id: str
    rating: float = Field(ge=0, le=5)
    feedback_text: str
    category: str = "general"  # e.g., "ui", "performance", "feature-request"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserStudySession(BaseModel):
    """Track user study/research sessions"""
    id: Optional[str] = None
    user_id: str
    session_name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    created_at: Optional[datetime] = None


# ============================================================================
# CHAT MODELS
# ============================================================================

class ChatMessage(BaseModel):
    """Individual chat message"""
    id: Optional[str] = None
    chat_id: str
    role: ChatRoleEnum
    content: str
    tokens_used: int = 0
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatHistory(BaseModel):
    """Chat conversation history"""
    id: Optional[str] = None
    user_id: str
    title: str = "New Chat"
    messages: List[ChatMessage] = Field(default_factory=list)
    total_tokens: int = 0
    model_version: str = "codette-2.0"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    archived: bool = False


# ============================================================================
# CODETTE AI MODELS
# ============================================================================

class MusicKnowledge(BaseModel):
    """Music theory and production knowledge base entries"""
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    content: str
    category: str  # e.g., "theory", "production", "mixing", "composition"
    embedding: Optional[List[float]] = None  # 1536-dimensional vector
    tags: List[str] = Field(default_factory=list)
    is_public: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    fts: Optional[str] = None  # Full-text search column


class CodetteFile(BaseModel):
    """AI-generated or user-uploaded files tracked by Codette"""
    id: Optional[str] = None
    user_id: str
    filename: str
    file_type: str  # e.g., "audio", "midi", "preset", "config"
    file_size_bytes: int
    storage_path: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class CodetteRecord(BaseModel):
    """Core Codette AI record for interactions"""
    id: Optional[str] = None
    user_id: str
    interaction_type: str  # e.g., "chat", "code-gen", "analysis"
    input_tokens: int = 0
    output_tokens: int = 0
    model_name: str = "codette"
    model_version: str = "2.0"
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EthicalCodeGeneration(BaseModel):
    """Track ethical concerns in code generation"""
    id: Optional[str] = None
    codette_record_id: str
    has_security_concerns: bool = False
    security_notes: Optional[str] = None
    has_performance_concerns: bool = False
    performance_notes: Optional[str] = None
    has_dependency_concerns: bool = False
    dependency_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: Optional[datetime] = None


# ============================================================================
# EMOTIONAL & CREATIVE MODELS
# ============================================================================

class Cocoon(BaseModel):
    """Protected creative space for brainstorming"""
    id: Optional[str] = None
    user_id: str
    title: str
    description: Optional[str] = None
    emotional_state: EmotionEnum = EmotionEnum.CREATIVE
    content: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EmotionalWeb(BaseModel):
    """Network of emotional connections between ideas"""
    id: Optional[str] = None
    user_id: str
    emotion: EmotionEnum
    intensity: float = Field(ge=0, le=1)
    related_cocoons: List[str] = Field(default_factory=list)  # IDs
    created_at: Optional[datetime] = None


class Memory(BaseModel):
    """Long-term memory storage for user context"""
    id: Optional[str] = None
    user_id: str
    memory_type: str  # e.g., "preference", "history", "context"
    content: str
    importance: float = Field(ge=0, le=1)
    accessed_count: int = 0
    last_accessed: Optional[datetime] = None
    created_at: Optional[datetime] = None


class Signal(BaseModel):
    """Emotional or contextual signals from user interactions"""
    id: Optional[str] = None
    user_id: str
    signal_type: str  # e.g., "frustration", "excitement", "confusion"
    intensity: float = Field(ge=0, le=1)
    timestamp: datetime
    context: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# API & SYSTEM MODELS
# ============================================================================

class ApiConfig(BaseModel):
    """API configuration and feature flags"""
    id: Optional[str] = None
    config_key: str
    config_value: Any
    description: Optional[str] = None
    is_active: bool = True
    updated_at: Optional[datetime] = None


class ApiMetric(BaseModel):
    """Track API performance and usage"""
    id: Optional[str] = None
    endpoint: str
    method: str  # GET, POST, etc.
    response_time_ms: float
    status_code: int
    timestamp: datetime
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AiCache(BaseModel):
    """Cache for AI responses to avoid redundant computation"""
    id: Optional[str] = None
    cache_key: str
    cache_value: str
    model_version: str
    expires_at: datetime
    hit_count: int = 0
    created_at: Optional[datetime] = None
    last_accessed: Optional[datetime] = None


# ============================================================================
# BENCHMARKING MODELS
# ============================================================================

class BenchmarkResult(BaseModel):
    """Performance benchmarking results"""
    id: Optional[str] = None
    benchmark_type: str  # e.g., "response-time", "accuracy", "throughput"
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    model_version: str = "2.0"
    environment: str = "production"  # or "staging", "development"


class CompetitorAnalysis(BaseModel):
    """Analysis comparing Codette with competitors"""
    id: Optional[str] = None
    competitor_name: str
    metric: str  # e.g., "response-time", "accuracy", "features"
    competitor_score: float
    codette_score: float
    analysis_date: datetime
    notes: Optional[str] = None


# ============================================================================
# COMPOSITE/REQUEST MODELS
# ============================================================================

class UserWithRoles(BaseModel):
    """User extended with role information"""
    id: str
    email: str
    roles: List[UserRoleEnum]
    is_active: bool


class MusicKnowledgeWithEmbedding(BaseModel):
    """Music knowledge with embedding ready for similarity search"""
    id: str
    title: str
    content: str
    category: str
    embedding: List[float]
    similarity_score: Optional[float] = None  # Populated by search


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateChatMessageRequest(BaseModel):
    """Request to add message to chat"""
    chat_id: str
    role: ChatRoleEnum
    content: str
    tokens_used: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchMusicKnowledgeRequest(BaseModel):
    """Request to search music knowledge"""
    query: Optional[str] = None
    category: Optional[str] = None
    embedding: Optional[List[float]] = None
    limit: int = 10
    offset: int = 0


class SubmitFeedbackRequest(BaseModel):
    """Request to submit user feedback"""
    user_id: str
    rating: float = Field(ge=0, le=5)
    feedback_text: str
    category: str = "general"


class ApiMetricRequest(BaseModel):
    """Request to log API metric"""
    endpoint: str
    method: str
    response_time_ms: float
    status_code: int
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BenchmarkSubmitRequest(BaseModel):
    """Request to submit benchmark result"""
    benchmark_type: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)
    environment: str = "production"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def model_to_dict(model: BaseModel, exclude_none: bool = True) -> Dict[str, Any]:
    """Convert Pydantic model to dictionary for Supabase"""
    return model.model_dump(exclude_none=exclude_none)


def dict_to_model(data: Dict[str, Any], model_class: type):
    """Convert dictionary from Supabase to Pydantic model"""
    return model_class(**data)
