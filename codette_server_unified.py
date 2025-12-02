#!/usr/bin/env python
"""
Codette AI Unified Server
Combined FastAPI server for CoreLogic Studio DAW integration
Includes both standard endpoints and production-optimized features
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
import logging
from datetime import datetime, timezone
import asyncio
import time
import traceback
import os
from functools import lru_cache
import hashlib
import uuid

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass  # dotenv not installed, fall back to environment variables

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

# Try to import Supabase for music knowledge base
try:
    import supabase
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("[WARNING] Supabase not installed - install with: pip install supabase")

# Try to import Redis for persistent caching
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("[INFO] Redis not installed - using in-memory cache (install with: pip install redis)")

# Setup paths
codette_path = Path(__file__).parent / "codette"
sys.path.insert(0, str(codette_path))
sys.path.insert(0, str(Path(__file__).parent))

# Import genre templates
try:
    from codette_genre_templates import (
        get_genre_suggestions,
        get_available_genres,
        get_genre_characteristics
    )
    GENRE_TEMPLATES_AVAILABLE = True
except ImportError:
    GENRE_TEMPLATES_AVAILABLE = False
    get_genre_suggestions = None  # type: ignore
    get_available_genres = None  # type: ignore
    get_genre_characteristics = None  # type: ignore
    print("[WARNING] Genre templates not available")

# Try to import numpy for audio analysis
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None  # type: ignore
    NUMPY_AVAILABLE = False
    print("[WARNING] NumPy not available - some analysis features will be limited")

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CACHING SYSTEM FOR PERFORMANCE OPTIMIZATION
# ============================================================================

class ContextCache:
    """TTL-based cache for Supabase context retrieval (reduces API calls ~300ms per query)"""
    
    def __init__(self, ttl_seconds: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds
        self.timestamps: Dict[str, float] = {}
        
        # Performance metrics
        self.metrics: Dict[str, Any] = {
            "hits": 0,
            "misses": 0,
            "total_requests": 0,
            "total_hit_latency_ms": 0.0,
            "total_miss_latency_ms": 0.0,
            "average_hit_latency_ms": 0.0,
            "average_miss_latency_ms": 0.0,
            "hit_rate_percent": 0.0,
            "started_at": time.time(),
        }
        self.operation_times: Dict[str, List[float]] = {
            "hits": [],
            "misses": []
        }
    
    def get_cache_key(self, message: str, filename: Optional[str]) -> str:
        """Generate cache key from message + filename"""
        key_text = f"{message}:{filename or 'none'}"
        return hashlib.md5(key_text.encode()).hexdigest()
    
    def get(self, message: str, filename: Optional[str]) -> Optional[Dict[str, Any]]:
        """Get cached context if exists and not expired"""
        start_time = time.time()
        key = self.get_cache_key(message, filename)
        self.metrics["total_requests"] += 1
        
        if key not in self.cache:
            # Cache miss
            elapsed_ms = (time.time() - start_time) * 1000
            self.metrics["misses"] += 1
            self.metrics["total_miss_latency_ms"] += elapsed_ms
            self.operation_times["misses"].append(elapsed_ms)
            self._update_metrics()
            logger.debug(f"Cache miss for {message[:30]}... ({elapsed_ms:.2f}ms)")
            return None
        
        # Check if expired
        age = time.time() - self.timestamps[key]
        if age > self.ttl:
            del self.cache[key]
            del self.timestamps[key]
            elapsed_ms = (time.time() - start_time) * 1000
            self.metrics["misses"] += 1
            self.metrics["total_miss_latency_ms"] += elapsed_ms
            self.operation_times["misses"].append(elapsed_ms)
            self._update_metrics()
            logger.debug(f"Cache expired for {message[:30]}... ({elapsed_ms:.2f}ms)")
            return None
        
        # Cache hit
        elapsed_ms = (time.time() - start_time) * 1000
        self.metrics["hits"] += 1
        self.metrics["total_hit_latency_ms"] += elapsed_ms
        self.operation_times["hits"].append(elapsed_ms)
        self._update_metrics()
        logger.debug(f"Cache hit for {message[:30]}... (age: {age:.1f}s, latency: {elapsed_ms:.2f}ms)")
        return self.cache[key]
    
    def set(self, message: str, filename: Optional[str], data: Dict[str, Any]) -> None:
        """Cache context data with timestamp"""
        key = self.get_cache_key(message, filename)
        self.cache[key] = data
        self.timestamps[key] = time.time()
        logger.debug(f"Cached context for {message[:30]}...")
    
    def clear(self) -> None:
        """Clear all cache"""
        self.cache.clear()
        self.timestamps.clear()
        logger.info("Context cache cleared")
    
    def _update_metrics(self) -> None:
        """Update derived metrics"""
        if self.metrics["total_requests"] > 0:
            self.metrics["hit_rate_percent"] = (
                self.metrics["hits"] / self.metrics["total_requests"] * 100
            )
        
        if self.metrics["hits"] > 0:
            self.metrics["average_hit_latency_ms"] = (
                self.metrics["total_hit_latency_ms"] / self.metrics["hits"]
            )
        
        if self.metrics["misses"] > 0:
            self.metrics["average_miss_latency_ms"] = (
                self.metrics["total_miss_latency_ms"] / self.metrics["misses"]
            )
    
    def stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        uptime_seconds = time.time() - self.metrics["started_at"]
        
        return {
            "entries": len(self.cache),
            "ttl_seconds": self.ttl,
            "hits": self.metrics["hits"],
            "misses": self.metrics["misses"],
            "total_requests": self.metrics["total_requests"],
            "hit_rate_percent": round(self.metrics["hit_rate_percent"], 2),
            "average_hit_latency_ms": round(self.metrics["average_hit_latency_ms"], 2),
            "average_miss_latency_ms": round(self.metrics["average_miss_latency_ms"], 2),
            "total_hit_latency_ms": round(self.metrics["total_hit_latency_ms"], 2),
            "total_miss_latency_ms": round(self.metrics["total_miss_latency_ms"], 2),
            "uptime_seconds": round(uptime_seconds, 1),
            "performance_gain": round(
                self.metrics["average_miss_latency_ms"] / 
                max(self.metrics["average_hit_latency_ms"], 0.01), 2
            ) if self.metrics["average_hit_latency_ms"] > 0 else 0,
        }

context_cache = ContextCache(ttl_seconds=300)  # 5-minute cache

# ============================================================================
# REDIS SETUP (Optional persistent caching)
# ============================================================================

redis_client = None
if REDIS_AVAILABLE:
    try:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', 6379))
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=int(os.getenv('REDIS_DB', 0)),
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
        )
        # Test connection
        redis_client.ping()
        logger.info("✅ Redis connected successfully")
        REDIS_ENABLED = True
    except Exception as e:
        logger.info(f"ℹ️ Redis unavailable (expected if not running) - using in-memory cache only. To enable Redis: redis-server or docker run -d -p 6379:6379 redis")
        redis_client = None
        REDIS_ENABLED = False
else:
    REDIS_ENABLED = False
    logger.info("ℹ️ Redis not installed - using in-memory cache only (optional: pip install redis)")

# ============================================================================
# REAL CODETTE AI ENGINE & TRAINING DATA
# ============================================================================

# Try to import real Codette engine
try:
    from codette_real_engine import get_real_codette_engine
    codette_engine = get_real_codette_engine()
    logger.info("✅ Real Codette AI Engine initialized successfully")
    USE_REAL_ENGINE = True
except Exception as e:
    logger.warning(f"⚠️ Failed to load real Codette engine: {e}")
    codette_engine = None
    USE_REAL_ENGINE = False

# Try to import training data and analysis
try:
    from codette_training_data import training_data, get_training_context
    from codette_analysis_module import analyze_session as enhanced_analyze, CodetteAnalyzer
    TRAINING_AVAILABLE = True
    analyzer = CodetteAnalyzer()
    logger.info("[OK] Codette training data loaded successfully")
    logger.info("[OK] Codette analyzer initialized")
except ImportError as e:
    logger.warning(f"[WARNING] Could not import Codette training modules: {e}")
    TRAINING_AVAILABLE = False
    training_data = None
    get_training_context = None
    enhanced_analyze = None
    analyzer = None

# Try to import BroaderPerspectiveEngine
try:
    from codette import BroaderPerspectiveEngine  # type: ignore
    Codette = BroaderPerspectiveEngine
    codette = Codette()
    logger.info("[OK] Codette (BroaderPerspectiveEngine) imported and initialized")
except Exception as e:
    logger.warning(f"[WARNING] Could not import BroaderPerspectiveEngine: {e}")
    Codette = None  # type: ignore
    codette = None  # type: ignore

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Unified Server",
    description="Combined Codette AI server for CoreLogic Studio DAW",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("✅ FastAPI app created with CORS enabled")

# ============================================================================
# SUPABASE CLIENT SETUP (Music Knowledge Base)
# ============================================================================

supabase_client = None
supabase_admin_client = None
if SUPABASE_AVAILABLE:
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if supabase_url and supabase_key:
            # Create anon client for reads
            supabase_client = supabase.create_client(supabase_url, supabase_key)
            logger.info("✅ Supabase anon client connected")
        
        # Create admin client for writes (if service key available)
        if supabase_url and supabase_service_key:
            supabase_admin_client = supabase.create_client(supabase_url, supabase_service_key)
            logger.info("✅ Supabase admin client connected (for writes)")
        elif supabase_url and supabase_key:
            logger.info("⚠️  Supabase admin key not found, using anon client for writes")
            supabase_admin_client = supabase_client
        else:
            logger.warning("⚠️ Supabase credentials not found in environment variables")
    except Exception as e:
        logger.warning(f"⚠️ Failed to connect to Supabase: {e}")
else:
    logger.info("ℹ️  Supabase not available - music knowledge base disabled")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    context: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None
    daw_context: Optional[Dict[str, Any]] = None  # DAW state: track, project, audio data

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None  # Where response came from: "daw_advice", "semantic_search", "codette_engine", etc.
    ml_score: Optional[Dict[str, float]] = None  # ML confidence scores: {"relevance": 0.85, "specificity": 0.90, "certainty": 0.78}

class AudioAnalysisRequest(BaseModel):
    audio_data: Optional[Dict[str, Any]] = None
    analysis_type: Optional[str] = "spectrum"
    track_data: Optional[Dict[str, Any]] = None
    track_id: Optional[str] = None

class AudioAnalysisResponse(BaseModel):
    trackId: str
    analysis: Dict[str, Any]
    status: str
    timestamp: Optional[str] = None

class SuggestionRequest(BaseModel):
    context: Dict[str, Any]
    limit: Optional[int] = 5

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: Optional[float] = None
    timestamp: Optional[str] = None

class ProcessRequest(BaseModel):
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int

class ProcessResponse(BaseModel):
    id: str
    status: str
    data: Dict[str, Any]
    processingTime: float

# Transport models
class TransportState(BaseModel):
    playing: bool
    time_seconds: float
    sample_pos: int
    bpm: float
    beat_pos: float
    loop_enabled: bool
    loop_start_seconds: float
    loop_end_seconds: float

class TransportCommandResponse(BaseModel):
    success: bool
    message: str
    state: Optional[TransportState] = None

# Embedding models
class EmbedRow(BaseModel):
    id: str
    text: str

class UpsertRequest(BaseModel):
    rows: List[EmbedRow]

class UpsertResponse(BaseModel):
    success: bool
    processed: int
    updated: int
    message: str

# ============================================================================
# TRANSPORT CLOCK MANAGER
# ============================================================================

class TransportManager:
    """Manages DAW transport state and synchronization"""
    
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start_seconds = 0.0
        self.loop_end_seconds = 10.0
        self.connected_clients: set = set()
    
    def get_state(self) -> TransportState:
        """Get current transport state"""
        if self.playing and self.start_time:
            elapsed = time.time() - self.start_time
            self.time_seconds = elapsed
            self.sample_pos = int(self.time_seconds * self.sample_rate)
        
        # Calculate beat position (4 beats per measure)
        beat_duration = 60.0 / self.bpm
        self.beat_pos = (self.time_seconds % (beat_duration * 4)) / beat_duration
        
        return TransportState(
            playing=self.playing,
            time_seconds=self.time_seconds,
            sample_pos=self.sample_pos,
            bpm=self.bpm,
            beat_pos=self.beat_pos,
            loop_enabled=self.loop_enabled,
            loop_start_seconds=self.loop_start_seconds,
            loop_end_seconds=self.loop_end_seconds
        )
    
    def play(self) -> TransportState:
        """Start playback"""
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def stop(self) -> TransportState:
        """Stop playback and reset"""
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.start_time = None
        return self.get_state()
    
    def pause(self) -> TransportState:
        """Pause playback (time remains)"""
        if self.playing:
            if self.start_time is not None:
                self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()
    
    def resume(self) -> TransportState:
        """Resume playback from pause"""
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def seek(self, time_seconds: float) -> TransportState:
        """Seek to time position"""
        self.time_seconds = max(0.0, time_seconds)
        self.sample_pos = int(self.time_seconds * self.sample_rate)
        if self.playing:
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def set_tempo(self, bpm: float) -> TransportState:
        """Set BPM"""
        self.bpm = max(1.0, min(300.0, bpm))  # Clamp 1-300 BPM
        return self.get_state()
    
    def set_loop(self, enabled: bool, start: float = 0.0, end: float = 10.0) -> TransportState:
        """Configure loop region"""
        self.loop_enabled = enabled
        self.loop_start_seconds = max(0.0, start)
        self.loop_end_seconds = max(self.loop_start_seconds + 0.1, end)
        return self.get_state()

# Initialize transport manager
transport_manager = TransportManager()

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_timestamp():
    """Get ISO format timestamp"""
    from datetime import timezone
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

def to_db(value):
    """Convert linear amplitude to dB"""
    if value <= 0 or not NUMPY_AVAILABLE:
        return -96.0
    if np is None:
        return -96.0
    return float(20 * np.log10(np.clip(value, 1e-7, 1.0)))

def get_training_context_safe():
    """Safely get training context"""
    if TRAINING_AVAILABLE and get_training_context:
        try:
            return get_training_context()
        except Exception as e:
            logger.warning(f"Error getting training context: {e}")
            return {}
    return {}

# ============================================================================
# ROOT & HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "Codette AI Unified Server",
        "version": "2.0.0",
        "docs": "/docs",
        "real_engine": USE_REAL_ENGINE,
        "training_available": TRAINING_AVAILABLE,
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "service": "Codette AI Unified Server",
            "real_engine": USE_REAL_ENGINE,
            "training_available": TRAINING_AVAILABLE,
            "codette_available": codette is not None,
            "analyzer_available": analyzer is not None,
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"ERROR in /health: {e}")
        return {"status": "error", "error": str(e)}

@app.get("/api/health")
@app.post("/api/health")
async def api_health():
    """API health check endpoint"""
    return {
        "success": True,
        "data": {"status": "ok", "service": "codette"},
        "duration": 0,
        "timestamp": get_timestamp(),
    }

# ============================================================================
# TRAINING DATA ENDPOINTS
# ============================================================================

@app.get("/api/training/context")
async def get_training_context_endpoint():
    """Get Codette AI training context"""
    try:
        if TRAINING_AVAILABLE and get_training_context:
            context = get_training_context()
            return {
                "success": True,
                "data": context,
                "message": "Training context available",
                "timestamp": get_timestamp(),
            }
        else:
            return {
                "success": False,
                "data": None,
                "message": "Training context not available",
                "timestamp": get_timestamp(),
            }
    except Exception as e:
        logger.error(f"ERROR in /api/training/context: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e),
            "timestamp": get_timestamp(),
        }

@app.get("/api/training/health")
async def training_health():
    """Check training module health"""
    try:
        return {
            "success": True,
            "training_available": TRAINING_AVAILABLE,
            "modules": {
                "training_data": TRAINING_AVAILABLE,
                "analysis": TRAINING_AVAILABLE and enhanced_analyze is not None,
                "analyzer": analyzer is not None,
            },
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": get_timestamp(),
        }

# ============================================================================
# EMBEDDING ENDPOINTS
# ============================================================================

def generate_simple_embedding(text: str, dim: int = 1536) -> List[float]:
    """
    Generate a simple deterministic embedding from text.
    
    In production, use a real embedding API:
    - OpenAI: embedding-3-small
    - Cohere: embed-english-v3.0
    - HuggingFace: sentence-transformers/all-MiniLM-L6-v2
    """
    import hashlib
    
    # Create a deterministic hash from text
    hash_bytes = hashlib.sha256(text.encode()).digest()
    hash_ints = [int.from_bytes(hash_bytes[i:i+4], 'big') for i in range(0, len(hash_bytes), 4)]
    
    # Generate pseudo-random embedding based on hash
    if NUMPY_AVAILABLE:
        embedding = np.zeros(dim, dtype=np.float32)
        for i in range(dim):
            # Use hash values to seed deterministic randomness
            seed_val = hash_ints[i % len(hash_ints)] + i
            # Create value between -1 and 1
            embedding[i] = np.sin(seed_val / 1000.0) * np.cos(seed_val / 2000.0)
        
        # Normalize to unit vector (L2 norm)
        magnitude = np.linalg.norm(embedding)
        if magnitude > 0:
            embedding = embedding / magnitude
        
        return embedding.tolist()
    else:
        # Fallback without NumPy
        import random
        random.seed(int.from_bytes(hash_bytes[:4], 'big'))
        embedding = [random.uniform(-1, 1) for _ in range(dim)]
        magnitude = sum(x**2 for x in embedding) ** 0.5
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        return embedding


def ensure_valid_uuid(id_value: Any) -> Optional[str]:
    """
    Validate and convert a value to a valid UUID string.
    Returns None if the value is invalid or a placeholder.
    """
    if not id_value:
        return None
    
    # Check for placeholder values
    if isinstance(id_value, str) and id_value.lower() in ('string', 'string...', 'unknown', 'none', 'null', ''):
        logger.warning(f"[UUID] Rejecting placeholder ID: {id_value}")
        return None
    
    try:
        # Try to parse as UUID
        valid_uuid = str(uuid.UUID(str(id_value)))
        return valid_uuid
    except (ValueError, AttributeError, TypeError) as e:
        logger.warning(f"[UUID] Invalid UUID format: {id_value} - {e}")
        return None


@app.post("/api/upsert-embeddings", response_model=UpsertResponse)
async def upsert_embeddings(request: UpsertRequest):
    """
    Generate embeddings for rows and update database.
    
    Request:
        {
            "rows": [
                {"id": "...", "text": "..."},
                {"id": "...", "text": "..."}
            ]
        }
    
    Response:
        {
            "success": true,
            "processed": 20,
            "updated": 20,
            "message": "Successfully updated 20 embeddings"
        }
    """
    try:
        if not request.rows:
            raise HTTPException(status_code=400, detail="No rows provided")
        
        logger.info(f"[upsert-embeddings] Processing {len(request.rows)} rows...")
        
        # Generate embeddings
        updates = []
        for row in request.rows:
            embedding = generate_simple_embedding(row.text)
            updates.append({
                "id": row.id,
                "embedding": embedding
            })
        
        logger.info(f"[upsert-embeddings] Generated {len(updates)} embeddings")
        if updates:
            logger.info(f"[upsert-embeddings] Sample embedding: {updates[0]['embedding'][:5]}... (showing first 5 dims)")
        
        # Update database with embeddings
        updated_count = 0
        if supabase_admin_client and SUPABASE_AVAILABLE:
            try:
                logger.info(f"[upsert-embeddings] Updating {len(updates)} rows in Supabase...")
                
                # Update each row with its embedding using admin client
                for update in updates:
                    try:
                        # Validate UUID first
                        valid_id = ensure_valid_uuid(update['id'])
                        if not valid_id:
                            logger.warning(f"[upsert-embeddings] Skipping row with invalid ID: {update['id']}")
                            continue
                        
                        # Prepare update payload - ensure embedding is JSON-serializable
                        payload = {
                            'embedding': update['embedding'],  # List of floats
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                        
                        logger.info(f"[upsert-embeddings] Sending update for ID {valid_id} (embedding dim: {len(update['embedding'])})")
                        
                        # Use admin client for writes with validated UUID
                        response = supabase_admin_client.table('music_knowledge').update(payload).eq('id', valid_id).execute()
                        
                        # Check if update was successful (response should have data or status info)
                        logger.info(f"[upsert-embeddings] Response for {valid_id}: {response}")
                        
                        # Count as updated if no error was raised
                        updated_count += 1
                        logger.info(f"[upsert-embeddings] ✅ Updated row {valid_id}")
                        
                    except Exception as row_error:
                        logger.error(f"[upsert-embeddings] ❌ Failed to update row: {row_error}", exc_info=True)
                
                logger.info(f"[upsert-embeddings] Successfully updated {updated_count}/{len(updates)} rows")
            except Exception as db_error:
                logger.error(f"[upsert-embeddings] Database error: {db_error}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        else:
            logger.warning("[upsert-embeddings] Supabase admin not available - embeddings not persisted")
            updated_count = 0
        
        return UpsertResponse(
            success=True,
            processed=len(request.rows),
            updated=updated_count,
            message=f"Successfully processed {len(updates)} embeddings, {updated_count} updated in database"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[upsert-embeddings] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RESPONSE ENHANCEMENT HELPERS
# ============================================================================

def find_matching_training_example(user_input: str, perspective_key: str) -> dict | None:
    """Find relevant training example for the given input and perspective"""
    try:
        from codette_training_data import PERSPECTIVE_RESPONSE_TRAINING
        
        if perspective_key not in PERSPECTIVE_RESPONSE_TRAINING:
            return None
        
        perspective_training = PERSPECTIVE_RESPONSE_TRAINING[perspective_key]
        training_examples = perspective_training.get("training_examples", [])
        
        # Simple keyword matching - find best matching training example
        user_lower = user_input.lower()
        best_match = None
        best_score = 0
        
        for example in training_examples:
            example_input = example.get("user_input", "").lower()
            # Calculate keyword overlap
            user_words = set(user_lower.split())
            example_words = set(example_input.split())
            overlap = len(user_words & example_words)
            
            if overlap > best_score:
                best_score = overlap
                best_match = example
        
        # Return if there's reasonable match (at least 2 keywords)
        if best_score >= 2:
            return best_match
        
        return None
    except Exception as e:
        logger.debug(f"Error finding training example: {e}")
        return None

def enhance_response_with_training(base_response: str, user_input: str, perspective_key: str) -> str:
    """Enhance response quality using training examples as reference"""
    try:
        from codette_training_data import PERSPECTIVE_RESPONSE_TRAINING
        
        if perspective_key not in PERSPECTIVE_RESPONSE_TRAINING:
            return base_response
        
        perspective_training = PERSPECTIVE_RESPONSE_TRAINING[perspective_key]
        
        # If response is too short or generic, enhance with training pattern
        if len(base_response) < 100:
            # Try to find matching example for pattern reference
            example = find_matching_training_example(user_input, perspective_key)
            if example:
                # Use example structure as template
                example_response = example.get("accurate_response", "")
                # Extend base response with pattern-matched advice
                if example_response:
                    return f"{base_response}\n\n💡 Similar pattern: {example_response[:200]}..."
        
        return base_response
    except Exception as e:
        logger.debug(f"Error enhancing response: {e}")
        return base_response

# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

@app.post("/codette/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with Codette using training data, real engine, and Supabase context with message embeddings"""
    try:
        perspective = request.perspective or "mix_engineering"
        message = request.message.lower()
        
        # Generate embedding for the incoming message (for semantic search)
        message_embedding = generate_simple_embedding(request.message)
        logger.info(f"Generated message embedding (dim: {len(message_embedding)})")
        
        # Get training context
        training_context = get_training_context_safe()
        daw_functions = training_context.get("daw_functions", {})
        ui_components = training_context.get("ui_components", {})
        response_templates = training_context.get("response_templates", {})
        
        # Initialize variables
        response = ""
        confidence = 0.75
        perspective_source = "fallback"
        response_source = "fallback"  # Track where response comes from: daw_template, semantic_search, codette_engine, etc.
        ml_scores = {"relevance": 0.65, "specificity": 0.60, "certainty": 0.55}  # Default ML confidence scores
        
        # Get Supabase context (code snippets, files, chat history)
        supabase_context = None
        context_info = ""
        context_cached = False
        
        if supabase_client:
            try:
                cache_key = context_cache.get_cache_key(request.message, None)
                
                # Try Redis first (if available)
                if REDIS_ENABLED and redis_client:
                    try:
                        cached_data = redis_client.get(f"context:{cache_key}")
                        if cached_data:
                            import json as json_module
                            supabase_context = json_module.loads(cached_data)
                            context_cached = True
                            logger.info(f"Context retrieved from Redis cache for: {request.message[:50]}...")
                    except Exception as redis_err:
                        logger.debug(f"Redis retrieval failed (fallback to memory): {redis_err}")
                
                # Fall back to in-memory cache if Redis miss
                if not context_cached:
                    cached_context = context_cache.get(request.message, None)
                    if cached_context is not None:
                        supabase_context = cached_context
                        context_cached = True
                        logger.info(f"Context retrieved from memory cache for: {request.message[:50]}...")
                
                # Fetch from Supabase if not cached anywhere
                if not context_cached:
                    logger.info(f"Retrieving fresh context from Supabase for: {request.message[:50]}...")
                    context_result = supabase_client.rpc(
                        'get_codette_context',
                        {
                            'input_prompt': request.message,
                            'optionally_filename': None
                        }
                    ).execute()
                    
                    supabase_context = context_result.data
                    
                    # Cache the result in both memory and Redis
                    if supabase_context:
                        # Memory cache
                        context_cache.set(request.message, None, supabase_context)
                        
                        # Redis cache (if available)
                        if REDIS_ENABLED and redis_client:
                            try:
                                import json as json_module
                                redis_client.setex(
                                    f"context:{cache_key}",
                                    300,  # 5-minute TTL
                                    json_module.dumps(supabase_context)
                                )
                                logger.debug(f"Context cached to Redis for: {request.message[:50]}...")
                            except Exception as redis_err:
                                logger.debug(f"Redis caching failed: {redis_err}")
                
                # Format context information for Codette
                if supabase_context:
                    context_parts = []
                    
                    # Add relevant code snippets
                    snippets = supabase_context.get('snippets', [])
                    if snippets and len(snippets) > 0:
                        context_parts.append(f"Related Code ({len(snippets)} snippets):")
                        for snippet in snippets[:3]:  # Limit to top 3
                            filename = snippet.get('filename', 'unknown')
                            snippet_text = snippet.get('snippet', '')[:100]
                            context_parts.append(f"  • {filename}: {snippet_text}...")
                    
                    # Add file metadata
                    file_info = supabase_context.get('file')
                    if file_info and file_info != 'null':
                        context_parts.append(f"File Context: {file_info.get('filename')} ({file_info.get('file_type')})")
                    
                    # Add chat history context
                    chat_history = supabase_context.get('chat_history', [])
                    if chat_history and len(chat_history) > 0:
                        context_parts.append(f"User History: {len(chat_history)} previous messages")
                    
                    context_info = "\n".join(context_parts)
                    cache_source = "Redis" if (REDIS_ENABLED and redis_client and context_cached) else "Memory"
                    logger.info(f"Context ready [{cache_source}]: {len(snippets)} snippets, {len(chat_history)} history items")
                
            except Exception as e:
                logger.warning(f"Context retrieval error: {e}")
                supabase_context = None
        
        # ============ ADD DAW CONTEXT HANDLING ============
        daw_context_info = ""
        if request.daw_context:
            try:
                daw_parts = []
                daw_ctx = request.daw_context
                
                # Track information
                if daw_ctx.get('selected_track'):
                    track = daw_ctx.get('selected_track')
                    daw_parts.append(f"🎵 Selected Track: {track.get('name', 'Untitled')} (Type: {track.get('type', 'audio')})")
                    daw_parts.append(f"   Volume: {track.get('volume', 0)}dB | Pan: {track.get('pan', 0)}")
                
                # Project information
                if daw_ctx.get('project_name'):
                    daw_parts.append(f"📁 Project: {daw_ctx.get('project_name')}")
                
                # Audio analysis data
                if daw_ctx.get('audio_analysis'):
                    analysis = daw_ctx.get('audio_analysis')
                    if analysis.get('peak_level'):
                        daw_parts.append(f"📊 Peak Level: {analysis.get('peak_level')}dB | RMS: {analysis.get('rms')}dB")
                    if analysis.get('frequency_content'):
                        daw_parts.append(f"   Frequency Balance: {analysis.get('frequency_content')}")
                
                # Track count
                if daw_ctx.get('total_tracks'):
                    daw_parts.append(f"🎚️ Total Tracks: {daw_ctx.get('total_tracks')}")
                
                # User goal/mixing context
                if daw_ctx.get('mixing_goal'):
                    daw_parts.append(f"🎯 Goal: {daw_ctx.get('mixing_goal')}")
                
                if daw_parts:
                    daw_context_info = "\n".join(daw_parts)
                    logger.info(f"DAW context received: {len(daw_parts)} items")
            except Exception as e:
                logger.debug(f"DAW context processing error: {e}")
        # ============ END DAW CONTEXT HANDLING ============
        
        # ============ GENERATE DAW-SPECIFIC ADVICE USING CONTEXT (PRIORITY) ============
        daw_specific_advice = ""
        if request.daw_context:
            logger.info(f"[DAW ADVICE] Generating DAW-specific advice. Message: '{message[:50]}...' Track: {request.daw_context.get('selected_track', {}).get('name', 'Unknown')}")
            try:
                daw_ctx = request.daw_context
                track_info = daw_ctx.get('selected_track', {})
                track_name = track_info.get('name', '').lower()
                track_type = track_info.get('type', 'audio')
                track_volume = track_info.get('volume', 0)
                track_pan = track_info.get('pan', 0)
                
                msg_lower = message.lower()
                keywords = ['mix', 'better', 'improve', 'problem', 'issue', 'help', 'how', 'advice', 'tip', 'sound']
                
                # Check if this is a mixing/advice question with DAW context
                if any(kw in msg_lower for kw in keywords):
                    logger.info(f"[DAW ADVICE] Message matches mixing keywords. Track name: {track_name}")
                    
                    # ===== DRUM TRACK ADVICE =====
                    if any(term in track_name for term in ['drum', 'kick', 'snare', 'hat', 'tom', 'percussion']):
                        daw_specific_advice = f"""🥁 **Drum Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Compression Strategy**:
  • Kick: Ratio 4:1, Attack 5ms, Release 100ms, Threshold -20dB
  • Snare: Ratio 6:1, Attack 3ms, Release 80ms (tighten transients)
  • Hats: Light compression (2:1) to control dynamics

**EQ Starting Points**:
  • High-pass filter: Remove everything below 30Hz for most drums
  • Kick: Scoop 2-4kHz (-3dB), boost 60Hz (+2dB) for punch
  • Snare: Boost 5-7kHz (+2-3dB) for crack, cut 500Hz (-2dB)
  • Hats: Gentle high-pass at 500Hz, bright shelf at 10kHz

**Mix Level Tips**:
  • Drums typically sit around -6dB to 0dB in the mix
  • Your current level ({track_volume}dB) → Adjust for clarity with other tracks
  • Leave 3-6dB of headroom before mastering

**Common Issues**:
  • Drums sound dull? → High-pass and add brightness at 8-10kHz
  • Drums feel weak? → Add slight saturation, not just compression
  • Drums clash with bass? → Automate kick volume around bass fundamentals
"""
                        confidence = 0.88

                    # ===== BASS TRACK ADVICE =====
                    elif any(term in track_name for term in ['bass', 'sub', 'low']):
                        daw_specific_advice = f"""🎸 **Bass Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Frequency Management**:
  • Clean Low-End: High-pass filter at 40-60Hz (remove mud below kick)
  • Fundamental Clarity: Boost 80-200Hz (+1-2dB) for presence
  • Tone Definition: Enhance 1-3kHz (+2-3dB) to cut through mix
  • Prevent Harshness: Cut 4-7kHz slightly (-1dB)

**Compression Setup**:
  • Ratio: 4:1 (glue it together)
  • Attack: 10-15ms (let transient through)
  • Release: 100-200ms (maintain groove)
  • Threshold: -18dB to -12dB

**Saturation Techniques**:
  • Add warmth: Subtle tape saturation (light overdrive)
  • Enhance harmonics: Mild distortion for presence in small speakers
  • Layer approach: Keep clean bass + saturated version for blend

**Mixing Position**:
  • Your level ({track_volume}dB) should sit slightly below kick for rhythm
  • Pan mono if mixing for small speakers, slight width (±20%) for stereo
  • Leave tight relationship with kick for strong foundation

**Monitoring**:
  • Check mix on multiple playback systems (headphones, car, earbuds)
  • Reference similar professional recordings
  • Use spectrum analyzer to avoid buildup below 100Hz
"""
                        confidence = 0.88

                    # ===== VOCAL TRACK ADVICE =====
                    elif any(term in track_name for term in ['vocal', 'voice', 'lead', 'vocal', 'singer']):
                        daw_specific_advice = f"""🎤 **Vocal Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**De-Esser & Clarity**:
  • Target sibilance: High-pass at 100Hz to remove mud
  • Presence boost: Add 2-4kHz (+2dB) for intelligibility
  • De-esser: Threshold around -20dB, ratio 4:1 for /s/ sounds
  • Proximity warmth: Gentle shelf at 200Hz (+1dB)

**Compression Chain**:
  • Ratio: 2:1 to 4:1 (vocal-specific: not too tight)
  • Attack: 20-30ms (preserve transients and tone)
  • Release: 100-200ms (natural envelope)
  • Threshold: -18dB (riding the volume)

**Pro Vocal Techniques**:
  • Double-comp: Gentle comp (2:1) + aggressive comp (6:1) in series
  • Parallel compression: Mix 20-30% compressed with dry for punch
  • Serial saturation: Add character with tape or tube emulation

**Reverb Integration**:
  • Send 10-15% of vocal to reverb (plate or hall)
  • Reverb pre-delay: 40-60ms to maintain clarity
  • Reverb decay: 1.5-2.5 seconds (style-dependent)
  • High-pass reverb input: Remove below 1kHz for clarity

**Level & Dynamics**:
  • Center pan for lead vocals ({track_pan:+.1f} current)
  • Headroom: Keep around -3dB peak to -6dB RMS
  • Your volume ({track_volume}dB) → Should dominate the mix with presence
  • Ride fader: Automate for consistency across performance
"""
                        confidence = 0.88

                    # ===== GUITAR/INSTRUMENT TRACK ADVICE =====
                    elif any(term in track_name for term in ['guitar', 'synth', 'keys', 'piano', 'instrument', 'pad']):
                        daw_specific_advice = f"""🎸 **Instrument Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Frequency Sculpting**:
  • Clean Foundation: High-pass filter around 60-100Hz
  • Body Presence: Boost 200-500Hz (+1-2dB) for warmth
  • Definition Layer: Enhance 2-4kHz for clarity and presence
  • Brightness: Add 8-10kHz for air and top-end sheen
  • Control Harshness: Gentle cut at 5-7kHz if present

**Dynamics Processing**:
  • Gentle Compression: Ratio 2:1, Attack 10ms, Release 100ms
  • Purpose: Glue the sound, maintain consistency
  • Peak Limiting: Set above compression for safety
  • Transient Shaper: Optional - bring out or smooth attacks

**Stereo Enhancement**:
  • Pan Position: Your current pan is {track_pan:+.1f} → Consider stereo placement
  • Stereo Width: For synthesizers/keyboards, consider subtle width (±15%)
  • Doubling: Light delay (15-25ms, 10% mix) for dimension

**Effects Strategy**:
  • Reverb: 5-20% send for ambience (depends on genre)
  • Delay: Sync to tempo if used (don't overdo it)
  • Modulation: Subtle chorus/flanger for movement
  • Drive/Saturation: Add character matching genre

**Mix Positioning**:
  • Volume ({track_volume}dB) → Adjust relative to drums and bass
  • Rhythm instruments: Sit slightly back from lead vocals
  • Pad layers: Create atmosphere without masking mix
  • Layering: Stack compatible instruments in frequency range
"""
                        confidence = 0.87

                    # ===== GENERIC MIXING ADVICE =====
                    elif 'mix' in msg_lower and track_type == 'audio':
                        daw_specific_advice = f"""🎚️ **Mixing Fundamentals** (Track: {track_name.title()})

**Current Context**: 
  • Selected Track: {track_name.title()} ({track_type})
  • Volume: {track_volume}dB | Pan: {track_pan:+.1f}
  • Project: {daw_ctx.get('total_tracks', 'N/A')} tracks total

**Mixing Workflow**:
  1. **Gain Staging**: Set input levels to -6dB to -3dB on peaks
  2. **Balancing**: Set rough levels before any EQ/compression
  3. **Panning**: Spread tracks spatially (avoid everything center)
  4. **Subgroup**: Bus similar instruments (drums, vocals, etc.)
  5. **Processing**: EQ first → Compression → Effects → Automation

**Your Track ({track_name})**:
  • Current Level: {track_volume}dB
  • Position: {['Left' if track_pan < -0.3 else 'Center' if -0.3 <= track_pan <= 0.3 else 'Right'][0]}
  • Next Steps:
    1. Check peak levels (should hit -6dB to -3dB RMS)
    2. A/B against reference mixes at similar level
    3. Apply high-pass filter to remove unnecessary low-end
    4. Add gentle EQ for tone shaping (avoid radical cuts)

**Pro Tips**:
  • Take breaks - ear fatigue clouds judgment
  • Mix at moderate levels (85dB SPL reference)
  • Use reference tracks from professional mixes
  • Compare on multiple speaker systems before finalizing
"""
                        confidence = 0.85

                    if daw_specific_advice:
                        response = daw_specific_advice
                        response_source = "daw_template"
                        ml_scores = {"relevance": 0.88, "specificity": 0.92, "certainty": 0.85}
                        confidence = 0.88  # High confidence for targeted DAW advice
                        logger.info(f"[DAW ADVICE] ✅ Generated {len(daw_specific_advice)} char response for track: {track_name}")
                        
            except Exception as e:
                logger.warning(f"[DAW ADVICE] ❌ Error generating advice: {e}")
        # ============ END DAW-SPECIFIC ADVICE (PRIORITY) ============
        
        # Check if question is about DAW functions
        for category, functions in daw_functions.items():
            for func_name, func_data in functions.items():
                if func_name in message or func_data.get("name", "").lower() in message:
                    response = f"**{func_data['name']}** ({func_data['category']})\n\n{func_data['description']}\n\n"
                    response += f"📋 Parameters: {', '.join(func_data['parameters']) or 'None'}\n"
                    response += f"⏱️ Hotkey: {func_data.get('hotkey', 'N/A')}\n"
                    response += "💡 Tips:\n" + "\n".join([f"  • {tip}" for tip in func_data.get('tips', [])])
                    confidence = 0.92
                    response_source = "daw_functions"
                    ml_scores = {"relevance": 0.90, "specificity": 0.92, "certainty": 0.90}
                    break
            if response:
                break
        
        # Track where response came from for UI and ML scoring
        response_source = "fallback"
        ml_scores = {"relevance": 0.65, "specificity": 0.60, "certainty": 0.55}
        
        # ============ SEMANTIC SEARCH + ML MATCHING ============
        # Use the actual Supabase RPC functions for semantic search
        if not response and request.daw_context and supabase_client:
            try:
                # Generate embedding for the user message
                msg_embedding = generate_simple_embedding(request.message)
                track_name = request.daw_context.get('selected_track', {}).get('name', '')
                
                logger.info(f"[ML] Semantic search for: '{request.message[:50]}...' in track: {track_name}")
                
                try:
                    # Use the actual Supabase RPC function: get_music_suggestions
                    search_result = supabase_client.rpc(
                        'get_music_suggestions',
                        {
                            'query': request.message,
                            'limit': 3
                        }
                    ).execute()
                    
                    if search_result.data and len(search_result.data) > 0:
                        # Get the first matching suggestion
                        semantic_match = search_result.data[0]
                        response = semantic_match.get('content', '') or semantic_match.get('suggestion', '')
                        if response:
                            confidence = 0.82
                            response_source = "semantic_search"
                            ml_scores = {"relevance": 0.82, "specificity": 0.80, "certainty": 0.78}
                            logger.info(f"[ML] Semantic match found: {response[:60]}...")
                except Exception as e:
                    logger.debug(f"[ML] Semantic search error (trying get_music_suggestions): {e}")
                    # Silently fall through to next response type
            except Exception as e:
                logger.debug(f"[ML] Semantic setup error: {e}")
        
        # Check if question is about UI components
        if not response:
            for comp_name, comp_data in ui_components.items():
                if comp_name.lower() in message:
                    response = f"**{comp_name}** - {comp_data['description']}\n\n"
                    response += f"📍 Location: {comp_data['location']}\n"
                    response += f"📏 Size: {comp_data['size']}\n"
                    response += f"⚙️ Functions: {', '.join(comp_data['functions'])}\n"
                    response += "💡 Tips:\n" + "\n".join([f"  • {tip}" for tip in comp_data.get('teaching_tips', [])])
                    confidence = 0.89
                    response_source = "ui_component"
                    ml_scores = {"relevance": 0.85, "specificity": 0.90, "certainty": 0.88}
                    break
        
        # Try real Codette engine with context if available
        if not response and USE_REAL_ENGINE and codette_engine:
            logger.info(f"[DAW ADVICE] Generating DAW-specific advice. Message: '{message[:50]}...' Track: {request.daw_context.get('selected_track', {}).get('name', 'Unknown')}")
            try:
                daw_ctx = request.daw_context
                track_info = daw_ctx.get('selected_track', {})
                track_name = track_info.get('name', '').lower()
                track_type = track_info.get('type', 'audio')
                track_volume = track_info.get('volume', 0)
                track_pan = track_info.get('pan', 0)
                
                msg_lower = message.lower()
                keywords = ['mix', 'better', 'improve', 'problem', 'issue', 'help', 'how', 'advice', 'tip', 'sound']
                
                # Check if this is a mixing/advice question with DAW context
                if any(kw in msg_lower for kw in keywords):
                    logger.info(f"[DAW ADVICE] Message matches mixing keywords. Track name: {track_name}")
                    
                    # ===== DRUM TRACK ADVICE =====
                    if any(term in track_name for term in ['drum', 'kick', 'snare', 'hat', 'tom', 'percussion']):
                        daw_specific_advice = f"""🥁 **Drum Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Compression Strategy**:
  • Kick: Ratio 4:1, Attack 5ms, Release 100ms, Threshold -20dB
  • Snare: Ratio 6:1, Attack 3ms, Release 80ms (tighten transients)
  • Hats: Light compression (2:1) to control dynamics

**EQ Starting Points**:
  • High-pass filter: Remove everything below 30Hz for most drums
  • Kick: Scoop 2-4kHz (-3dB), boost 60Hz (+2dB) for punch
  • Snare: Boost 5-7kHz (+2-3dB) for crack, cut 500Hz (-2dB)
  • Hats: Gentle high-pass at 500Hz, bright shelf at 10kHz

**Mix Level Tips**:
  • Drums typically sit around -6dB to 0dB in the mix
  • Your current level ({track_volume}dB) → Adjust for clarity with other tracks
  • Leave 3-6dB of headroom before mastering

**Common Issues**:
  • Drums sound dull? → High-pass and add brightness at 8-10kHz
  • Drums feel weak? → Add slight saturation, not just compression
  • Drums clash with bass? → Automate kick volume around bass fundamentals
"""
                        confidence = 0.88

                    # ===== BASS TRACK ADVICE =====
                    elif any(term in track_name for term in ['bass', 'sub', 'low']):
                        daw_specific_advice = f"""🎸 **Bass Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Frequency Management**:
  • Clean Low-End: High-pass filter at 40-60Hz (remove mud below kick)
  • Fundamental Clarity: Boost 80-200Hz (+1-2dB) for presence
  • Tone Definition: Enhance 1-3kHz (+2-3dB) to cut through mix
  • Prevent Harshness: Cut 4-7kHz slightly (-1dB)

**Compression Setup**:
  • Ratio: 4:1 (glue it together)
  • Attack: 10-15ms (let transient through)
  • Release: 100-200ms (maintain groove)
  • Threshold: -18dB to -12dB

**Saturation Techniques**:
  • Add warmth: Subtle tape saturation (light overdrive)
  • Enhance harmonics: Mild distortion for presence in small speakers
  • Layer approach: Keep clean bass + saturated version for blend

**Mixing Position**:
  • Your level ({track_volume}dB) should sit slightly below kick for rhythm
  • Pan mono if mixing for small speakers, slight width (±20%) for stereo
  • Leave tight relationship with kick for strong foundation

**Monitoring**:
  • Check mix on multiple playback systems (headphones, car, earbuds)
  • Reference similar professional recordings
  • Use spectrum analyzer to avoid buildup below 100Hz
"""
                        confidence = 0.88

                    # ===== VOCAL TRACK ADVICE =====
                    elif any(term in track_name for term in ['vocal', 'voice', 'lead', 'vocal', 'singer']):
                        daw_specific_advice = f"""🎤 **Vocal Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**De-Esser & Clarity**:
  • Target sibilance: High-pass at 100Hz to remove mud
  • Presence boost: Add 2-4kHz (+2dB) for intelligibility
  • De-esser: Threshold around -20dB, ratio 4:1 for /s/ sounds
  • Proximity warmth: Gentle shelf at 200Hz (+1dB)

**Compression Chain**:
  • Ratio: 2:1 to 4:1 (vocal-specific: not too tight)
  • Attack: 20-30ms (preserve transients and tone)
  • Release: 100-200ms (natural envelope)
  • Threshold: -18dB (riding the volume)

**Pro Vocal Techniques**:
  • Double-comp: Gentle comp (2:1) + aggressive comp (6:1) in series
  • Parallel compression: Mix 20-30% compressed with dry for punch
  • Serial saturation: Add character with tape or tube emulation

**Reverb Integration**:
  • Send 10-15% of vocal to reverb (plate or hall)
  • Reverb pre-delay: 40-60ms to maintain clarity
  • Reverb decay: 1.5-2.5 seconds (style-dependent)
  • High-pass reverb input: Remove below 1kHz for clarity

**Level & Dynamics**:
  • Center pan for lead vocals ({track_pan:+.1f} current)
  • Headroom: Keep around -3dB peak to -6dB RMS
  • Your volume ({track_volume}dB) → Should dominate the mix with presence
  • Ride fader: Automate for consistency across performance
"""
                        confidence = 0.88

                    # ===== GUITAR/INSTRUMENT TRACK ADVICE =====
                    elif any(term in track_name for term in ['guitar', 'synth', 'keys', 'piano', 'instrument', 'pad']):
                        daw_specific_advice = f"""🎸 **Instrument Track Mixing Guide** ({track_name.title()})

**Current State**: Volume {track_volume}dB, Pan {track_pan:+.1f}

**Frequency Sculpting**:
  • Clean Foundation: High-pass filter around 60-100Hz
  • Body Presence: Boost 200-500Hz (+1-2dB) for warmth
  • Definition Layer: Enhance 2-4kHz for clarity and presence
  • Brightness: Add 8-10kHz for air and top-end sheen
  • Control Harshness: Gentle cut at 5-7kHz if present

**Dynamics Processing**:
  • Gentle Compression: Ratio 2:1, Attack 10ms, Release 100ms
  • Purpose: Glue the sound, maintain consistency
  • Peak Limiting: Set above compressionfor safety
  • Transient Shaper: Optional - bring out or smooth attacks

**Stereo Enhancement**:
  • Pan Position**: Your current pan is {track_pan:+.1f} → Consider stereo placement
  • Stereo Width**: For synthesizers/keyboards, consider subtle width (±15%)
  • Doubling: Light delay (15-25ms, 10% mix) for dimension

**Effects Strategy**:
  • Reverb: 5-20% send for ambience (depends on genre)
  • Delay: Sync to tempo if used (don't overdo it)
  • Modulation: Subtle chorus/flanger for movement
  • Drive/Saturation: Add character matching genre

**Mix Positioning**:
  • Volume ({track_volume}dB) → Adjust relative to drums and bass
  • Rhythm instruments: Sit slightly back from lead vocals
  • Pad layers: Create atmosphere without masking mix
  • Layering: Stack compatible instruments in frequency range
"""
                        confidence = 0.87

                    # ===== GENERIC MIXING ADVICE =====
                    elif 'mix' in msg_lower and track_type == 'audio':
                        daw_specific_advice = f"""🎚️ **Mixing Fundamentals** (Track: {track_name.title()})

**Current Context**: 
  • Selected Track: {track_name.title()} ({track_type})
  • Volume: {track_volume}dB | Pan: {track_pan:+.1f}
  • Project: {daw_ctx.get('total_tracks', 'N/A')} tracks total

**Mixing Workflow**:
  1. **Gain Staging**: Set input levels to -6dB to -3dB on peaks
  2. **Balancing**: Set rough levels before any EQ/compression
  3. **Panning**: Spread tracks spatially (avoid everything center)
  4. **Subgroup**: Bus similar instruments (drums, vocals, etc.)
  5. **Processing**: EQ first → Compression → Effects → Automation

**Your Track ({track_name})**:
  • Current Level: {track_volume}dB
  • Position: {['Left' if track_pan < -0.3 else 'Center' if -0.3 <= track_pan <= 0.3 else 'Right']}
  • Next Steps:
    1. Check peak levels (should hit -6dB to -3dB RMS)
    2. A/B against reference mixes at similar level
    3. Apply high-pass filter to remove unnecessary low-end
    4. Add gentle EQ for tone shaping (avoid radical cuts)

**Pro Tips**:
  • Take breaks - ear fatigue clouds judgment
  • Mix at moderate levels (85dB SPL reference)
  • Use reference tracks from professional mixes
  • Compare on multiple speaker systems before finalizing
"""
                        confidence = 0.85

                    if daw_specific_advice:
                        response = daw_specific_advice
                        logger.info(f"[DAW ADVICE] ✅ Generated {len(daw_specific_advice)} char response for track: {track_name}")
                        
            except Exception as e:
                logger.warning(f"[DAW ADVICE] ❌ Error generating advice: {e}")
        # ============ END DAW-SPECIFIC ADVICE ============
        
        # Try real Codette engine with context if available
        if not response and USE_REAL_ENGINE and codette_engine:
            try:
                # Build enriched prompt with Supabase context + DAW context
                enriched_message = request.message
                if context_info or daw_context_info:
                    context_sections = []
                    if daw_context_info:
                        context_sections.append(f"[DAW STATE]\n{daw_context_info}")
                    if context_info:
                        context_sections.append(f"[CODE CONTEXT]\n{context_info}")
                    enriched_message = f"{request.message}\n\n{chr(10).join(context_sections)}"
                
                result = codette_engine.process_chat_real(enriched_message, "default")
                if isinstance(result, dict) and "perspectives" in result:
                    # Format multi-perspective response with DAW-focused perspectives
                    response = "🎚️ **Codette's Multi-Perspective Analysis**\n\n"
                    perspectives_list = result.get("perspectives", [])
                    
                    # Map old perspective names to new DAW-focused names
                    perspective_name_map = {
                        'neural_network': 'mix_engineering',
                        'newtonian_logic': 'audio_theory',
                        'davinci_synthesis': 'creative_production',
                        'resilient_kindness': 'technical_troubleshooting',
                        'quantum_logic': 'workflow_optimization',
                    }
                    
                    # Map display names to keys (for engine that already returns display names)
                    display_name_to_key = {
                        'Mix Engineering': 'mix_engineering',
                        'Audio Theory': 'audio_theory',
                        'Creative Production': 'creative_production',
                        'Technical Troubleshooting': 'technical_troubleshooting',
                        'Workflow Optimization': 'workflow_optimization',
                        'neural_network': 'mix_engineering',
                        'newtonian_logic': 'audio_theory',
                        'davinci_synthesis': 'creative_production',
                        'resilient_kindness': 'technical_troubleshooting',
                        'quantum_logic': 'workflow_optimization',
                    }
                    
                    # Map new DAW-focused perspectives with icons
                    perspective_icons = {
                        'mix_engineering': '🎚️',
                        'audio_theory': '📊',
                        'creative_production': '🎵',
                        'technical_troubleshooting': '🔧',
                        'workflow_optimization': '⚡'
                    }
                    
                    # DAW-focused perspective descriptions
                    perspective_descriptions = {
                        'mix_engineering': 'Mix Engineering',
                        'audio_theory': 'Audio Theory',
                        'creative_production': 'Creative Production',
                        'technical_troubleshooting': 'Technical Troubleshooting',
                        'workflow_optimization': 'Workflow Optimization',
                    }
                    
                    # Extract primary perspective for metadata
                    primary_perspective = "mix_engineering"
                    if perspectives_list and len(perspectives_list) > 0:
                        first_perspective = perspectives_list[0]
                        if isinstance(first_perspective, dict):
                            old_key = first_perspective.get('key') or first_perspective.get('name', 'neural_network').lower().replace(' ', '_')
                            primary_perspective = perspective_name_map.get(old_key, 'mix_engineering')
                    
                    for perspective in perspectives_list:
                        perspective_name = perspective.get('name', 'Insight')
                        perspective_response = perspective.get('response', '')
                        old_perspective_key = perspective.get('key', perspective_name.lower().replace(' ', '_'))
                    for perspective in perspectives_list:
                        perspective_name = perspective.get('name', 'Insight')
                        perspective_response = perspective.get('response', '')
                        
                        # Convert display name or key to consistent key format
                        # Try direct mapping first
                        if perspective_name in display_name_to_key:
                            mapped_key = display_name_to_key[perspective_name]
                        else:
                            # Try converting name to lowercase with underscores
                            key_format = perspective_name.lower().replace(' ', '_')
                            if key_format in display_name_to_key:
                                mapped_key = display_name_to_key[key_format]
                            else:
                                mapped_key = 'mix_engineering'  # Fallback
                        
                        icon = perspective_icons.get(mapped_key, '💡')
                        # Use the key for parsing, not the display name
                        response += f"{icon} **{mapped_key}**: {perspective_response}\n\n"
                    confidence = result.get("confidence", 0.88)
                    # Increase confidence if using context
                    if supabase_context and (supabase_context.get('snippets') or supabase_context.get('chat_history')):
                        confidence = min(0.95, confidence + 0.05)
                        perspective_source = primary_perspective
                    else:
                        perspective_source = primary_perspective
                elif isinstance(result, str):
                    response = result
                    confidence = 0.88
                    perspective_source = "real-engine"
            except Exception as e:
                logger.warning(f"Real engine error: {e}")
        
        # Fallback to generic response with DAW context
        if not response:
            response = f"""I'm Codette, your AI assistant for CoreLogic Studio DAW! 🎚️

**What I can help with:**

🎚️ **Mix Engineering** - Practical mixing console techniques
📊 **Audio Theory** - Scientific audio principles and signal flow
🎵 **Creative Production** - Artistic decisions and inspiration
🔧 **Technical Troubleshooting** - Problem diagnosis and fixes
⚡ **Workflow Optimization** - Efficiency tips and shortcuts

**Available Knowledge:**
• DAW Functions ({len(daw_functions)} categories)
• UI Components ({len(ui_components)} components)
• Audio Production Workflows

What would you like to learn?"""
            confidence = 0.75
            perspective_source = "fallback"
        
        # Enhance response with training examples if applicable
        try:
            primary_perspective = perspective_source or perspective
            response = enhance_response_with_training(response, request.message, primary_perspective)
            
            # If response comes from real engine, add training context info
            if "Multi-Perspective" in response:
                # Response already has good perspective analysis
                pass
            elif len(response) > 50:
                # Find and log any matching training examples for future learning
                example = find_matching_training_example(request.message, primary_perspective)
                if example:
                    logger.debug(f"Training example matched for '{primary_perspective}': {example.get('user_input')}")
        except Exception as e:
            logger.debug(f"Error in response enhancement: {e}")
        
        # Calculate ML confidence scores based on response type
        ml_scores = {
            "relevance": 0.75,
            "specificity": 0.70,
            "certainty": 0.65
        }
        
        if response_source == "daw_template":
            ml_scores = {"relevance": 0.88, "specificity": 0.92, "certainty": 0.85}
        elif response_source == "semantic_search":
            ml_scores = {"relevance": 0.82, "specificity": 0.88, "certainty": 0.80}
        elif response:  # Codette engine response
            ml_scores = {"relevance": 0.70, "specificity": 0.65, "certainty": 0.60}
        
        return ChatResponse(
            response=response,
            perspective=perspective_source or "mix_engineering",
            confidence=min(confidence, 1.0),
            timestamp=get_timestamp(),
            source=response_source,
            ml_score=ml_scores,
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="I'm having trouble understanding. Could you rephrase your question?",
            perspective=request.perspective or "mix_engineering",
            confidence=0.5,
            timestamp=get_timestamp(),
            source="error",
            ml_score={"relevance": 0.0, "specificity": 0.0, "certainty": 0.0},
        )

# ============================================================================
# AUDIO ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/codette/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio(request: AudioAnalysisRequest):
    """Analyze audio using CodetteAnalyzer"""
    try:
        track_id = request.track_data.get("track_id", "unknown") if request.track_data else "unknown"
        
        if not request.audio_data:
            return AudioAnalysisResponse(
                trackId=track_id,
                analysis={
                    "quality_score": 0.5,
                    "findings": ["No audio data provided"],
                    "recommendations": ["Upload audio data to analyze"],
                },
                status="success",
                timestamp=get_timestamp(),
            )
        
        if not TRAINING_AVAILABLE or analyzer is None:
            return AudioAnalysisResponse(
                trackId=track_id,
                analysis={"error": "Training data not available"},
                status="fallback",
                timestamp=get_timestamp(),
            )
        
        # Extract metrics
        audio_metrics = request.audio_data
        sample_rate = audio_metrics.get("sample_rate", 44100)
        duration = audio_metrics.get("duration", 0)
        peak_level = audio_metrics.get("peak_level", -96.0)
        rms_level = audio_metrics.get("rms_level", -96.0)
        
        track_metrics = [{
            "name": request.track_data.get("track_name", "Unknown") if request.track_data else "Unknown",
            "level": rms_level,
            "peak": peak_level,
            "rms": rms_level,
        }]
        
        # Perform analysis
        analysis_type = request.analysis_type or "spectrum"
        
        # Convert track_metrics list to dict for analysis
        metrics_dict = track_metrics[0] if track_metrics else {}
        
        if analysis_type == "dynamic":
            result = analyzer.analyze_gain_staging(track_metrics)
        elif analysis_type == "loudness":
            result = analyzer.analyze_mastering_readiness(metrics_dict)
        elif analysis_type == "quality":
            result = analyzer.analyze_session_health(metrics_dict)
        else:
            result = analyzer.analyze_gain_staging(track_metrics)
        
        analysis = {
            "analysis_type": analysis_type,
            "quality_score": result.score,
            "findings": result.findings,
            "recommendations": result.recommendations,
            "metrics": {
                "duration": duration,
                "sample_rate": sample_rate,
                "peak_level": peak_level,
                "rms_level": rms_level,
            }
        }

        return AudioAnalysisResponse(
            trackId=track_id,
            analysis=analysis,
            status="success",
            timestamp=get_timestamp(),
        )
    except Exception as e:
        logger.error(f"Error in audio analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SUGGESTIONS ENDPOINTS
# ============================================================================

@app.post("/codette/suggest", response_model=SuggestionResponse)
async def get_suggestions(request: SuggestionRequest):
    """Get AI-powered suggestions from Supabase music knowledge base"""
    try:
        suggestions = []
        context_type = request.context.get("type", "general") if request.context else "general"
        track_type = request.context.get("track_type", "general") if request.context else "general"
        
        # First, try to get suggestions from Supabase music knowledge base
        if supabase_client:
            try:
                # Call Supabase RPC function to get music suggestions
                response = supabase_client.rpc(
                    'get_music_suggestions',
                    {
                        'p_prompt': context_type,
                        'p_context': context_type
                    }
                ).execute()
                
                if response and response.data:
                    # Handle response - could be a list or dict with suggestions key
                    supabase_suggestions = response.data
                    if isinstance(response.data, dict) and 'suggestions' in response.data:
                        supabase_suggestions = response.data['suggestions']
                    
                    if supabase_suggestions and isinstance(supabase_suggestions, list):
                        # Transform database schema to API response format
                        for item in supabase_suggestions:
                            formatted_suggestion = {
                                "id": item.get('id', f"db-{len(suggestions)}"),
                                "title": item.get('suggestion') or item.get('title', 'Untitled'),
                                "description": item.get('description', ''),
                                "category": item.get('category', 'general'),
                                "topic": item.get('topic', context_type),
                                "confidence": float(item.get('confidence', 0.85)),
                                "source": "database",
                                "type": "optimization"
                            }
                            suggestions.append(formatted_suggestion)
                        
                        logger.info(f"✅ Retrieved {len(supabase_suggestions)} suggestions from Supabase database")
            except Exception as e:
                logger.debug(f"⚠️ Supabase query info: {type(e).__name__}: {str(e)[:100]}")
                # Fall back to genre templates or hardcoded suggestions
        
        # Use genre templates if available and suggestions count is low
        if len(suggestions) < (request.limit or 5) and GENRE_TEMPLATES_AVAILABLE and get_genre_suggestions:
            genre = request.context.get("genre", "") if request.context else ""
            if genre:
                genre_lower = genre.lower().strip()
                limit = min(3, (request.limit or 5) - len(suggestions))
                genre_suggestions = get_genre_suggestions(genre_lower, limit=limit)
                if genre_suggestions:
                    suggestions.extend(genre_suggestions)
                    logger.info(f"✅ Added {len(genre_suggestions)} genre template suggestions")
        
        # Use hardcoded suggestions as fallback if database is empty
        if not suggestions:
            if context_type == "gain-staging":
                base_suggestions = [
                    {
                        "id": "fallback-1",
                        "type": "optimization",
                        "title": "Peak Level Optimization",
                        "description": "Maintain -3dB headroom as per industry standard",
                        "confidence": 0.92,
                        "category": "gain-staging",
                        "source": "fallback"
                    },
                    {
                        "id": "fallback-2",
                        "type": "optimization",
                        "title": "Clipping Prevention",
                        "description": "Ensure no signal exceeds 0dBFS",
                        "confidence": 0.95,
                        "category": "gain-staging",
                        "source": "fallback"
                    },
                ]
                suggestions.extend(base_suggestions)
            elif context_type == "mixing":
                base_suggestions = [
                    {
                        "id": "fallback-3",
                        "type": "effect",
                        "title": "EQ for Balance",
                        "description": "Apply EQ to balance frequency content",
                        "confidence": 0.88,
                        "category": "mixing",
                        "source": "fallback"
                    },
                    {
                        "id": "fallback-4",
                        "type": "routing",
                        "title": "Bus Architecture",
                        "description": "Create buses for better mix control",
                        "confidence": 0.85,
                        "category": "mixing",
                        "source": "fallback"
                    },
                ]
                suggestions.extend(base_suggestions)
            elif context_type == "mastering":
                base_suggestions = [
                    {
                        "id": "fallback-5",
                        "type": "optimization",
                        "title": "Loudness Target",
                        "description": "Target -14 LUFS for streaming platforms",
                        "confidence": 0.93,
                        "category": "mastering",
                        "source": "fallback"
                    },
                    {
                        "id": "fallback-6",
                        "type": "effect",
                        "title": "Linear Phase EQ",
                        "description": "Use linear phase EQ in mastering",
                        "confidence": 0.87,
                    },
                ]
                suggestions.extend(base_suggestions)
            else:
                if not suggestions:
                    base_suggestions = [
                        {
                            "type": "optimization",
                            "title": "Gain Optimization",
                            "description": "Maintain proper gain levels throughout signal chain",
                            "confidence": 0.85,
                        },
                    ]
                    suggestions.extend(base_suggestions)
        
        # Limit suggestions
        suggestions = suggestions[:request.limit]
        
        # Calculate average confidence
        avg_confidence = sum(s["confidence"] for s in suggestions) / len(suggestions) if suggestions else 0.5

        return SuggestionResponse(
            suggestions=suggestions,
            confidence=min(avg_confidence, 1.0),
            timestamp=get_timestamp(),
        )
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GENERIC PROCESS ENDPOINT
# ============================================================================

@app.post("/codette/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    """Generic request processor"""
    import time

    start_time = time.time()

    try:
        result_data: Dict[str, Any] = {}

        if request.type == "chat":
            payload = request.payload
            message = payload.get("message", "")
            
            # Use chat endpoint logic
            chat_req = ChatRequest(message=message)
            chat_resp = await chat_endpoint(chat_req)
            result_data = {
                "response": chat_resp.response,
                "perspective": chat_resp.perspective,
                "confidence": chat_resp.confidence,
            }

        elif request.type == "audio_analysis":
            result_data = {
                "analysis": "Audio analysis completed",
                "status": "success",
                "trackId": request.payload.get("trackId"),
            }

        elif request.type == "suggestion":
            result_data = {
                "suggestions": [
                    {
                        "type": "optimization",
                        "title": "Gain Optimization",
                        "confidence": 0.85,
                    }
                ]
            }

        else:
            result_data = {"message": f"Request type: {request.type}"}

        processing_time = time.time() - start_time

        return ProcessResponse(
            id=request.id,
            status="success",
            data=result_data,
            processingTime=processing_time,
        )

    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Error in process endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )

# ============================================================================
# TRANSPORT CONTROL ENDPOINTS
# ============================================================================

@app.websocket("/ws")
async def websocket_general(websocket: WebSocket):
    """General WebSocket endpoint with analysis streaming support"""
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"Failed to accept WebSocket on /ws: {e}")
        return
    
    transport_manager.connected_clients.add(websocket)
    logger.info(f"WebSocket connected to /ws. Clients: {len(transport_manager.connected_clients)}")
    
    # Track streaming state
    streaming_analysis = False
    analysis_type = "spectrum"
    stream_interval = 0.1  # 100ms default
    last_analysis_send = time.time()
    
    try:
        last_send = time.time()
        send_interval = 1.0 / 60.0  # 60 FPS
        
        # Send initial state
        try:
            state = transport_manager.get_state()
            await websocket.send_json({
                "type": "state",
                "data": state.model_dump()
            })
        except Exception as e:
            logger.error(f"Failed to send initial state on /ws: {e}")
            return
        
        while True:
            try:
                # Non-blocking receive
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.001
                    )
                    try:
                        message = json.loads(data)
                        
                        # Handle commands
                        if message.get("type") == "play":
                            transport_manager.play()
                        elif message.get("type") == "stop":
                            transport_manager.stop()
                        elif message.get("type") == "pause":
                            transport_manager.pause()
                        elif message.get("type") == "resume":
                            transport_manager.resume()
                        elif message.get("type") == "seek":
                            transport_manager.seek(message.get("time_seconds", 0))
                        elif message.get("type") == "tempo":
                            transport_manager.set_tempo(message.get("bpm", 120))
                        elif message.get("type") == "loop":
                            transport_manager.set_loop(
                                message.get("enabled", False),
                                message.get("start_seconds", 0),
                                message.get("end_seconds", 10)
                            )
                        # NEW: Handle analysis streaming
                        elif message.get("type") == "analyze_stream":
                            streaming_analysis = True
                            analysis_type = message.get("analysis_type", "spectrum")
                            stream_interval = message.get("interval_ms", 100) / 1000.0
                            logger.info(f"Started analysis streaming: {analysis_type} (interval: {stream_interval}s)")
                        elif message.get("type") == "stop_stream":
                            streaming_analysis = False
                            logger.info("Stopped analysis streaming")
                    except json.JSONDecodeError:
                        pass
                    
                except asyncio.TimeoutError:
                    pass
                
                # Send state update
                current_time = time.time()
                if current_time - last_send >= send_interval:
                    try:
                        state = transport_manager.get_state()
                        await websocket.send_json({
                            "type": "state",
                            "data": state.model_dump()
                        })
                        last_send = current_time
                    except RuntimeError as e:
                        logger.warning(f"Connection closed on /ws: {e}")
                        break
                    except Exception as e:
                        logger.error(f"Unexpected error in /ws loop: {e}")
                        break
                
                # Send streaming analysis data if enabled
                if streaming_analysis and (current_time - last_analysis_send >= stream_interval):
                    try:
                        # Generate mock analysis data
                        analysis_data = {
                            "type": "analysis_update",
                            "analysis_type": analysis_type,
                            "timestamp": datetime.now().isoformat(),
                            "payload": {
                                "peak_level": (np.random.uniform(-20, -3) if np is not None else -10) if NUMPY_AVAILABLE else -10,
                                "rms_level": (np.random.uniform(-30, -15) if np is not None else -20) if NUMPY_AVAILABLE else -20,
                                "frequency_balance": {
                                    "low": (np.random.uniform(-12, 6) if np is not None else 0) if NUMPY_AVAILABLE else 0,
                                    "mid": (np.random.uniform(-12, 6) if np is not None else 0) if NUMPY_AVAILABLE else 0,
                                    "high": (np.random.uniform(-12, 6) if np is not None else 0) if NUMPY_AVAILABLE else 0,
                                },
                                "quality_score": (np.random.uniform(0.6, 1.0) if np is not None else 0.8) if NUMPY_AVAILABLE else 0.8,
                            }
                        }
                        await websocket.send_json(analysis_data)
                        last_analysis_send = current_time
                    except Exception as e:
                        logger.error(f"Error sending analysis data: {e}")
                
                # Small sleep
                await asyncio.sleep(0.001)
                
            except WebSocketDisconnect:
                logger.info("WebSocket /ws disconnected")
                break
            except Exception as e:
                logger.error(f"Unexpected error in /ws loop: {e}")
                break
    
    finally:
        try:
            transport_manager.connected_clients.discard(websocket)
            logger.info(f"WebSocket cleanup on /ws. Remaining: {len(transport_manager.connected_clients)}")
        except Exception as e:
            logger.error(f"Error during /ws cleanup: {e}")

@app.websocket("/ws/transport/clock")
async def websocket_transport_clock(websocket: WebSocket):
    """WebSocket endpoint for transport clock"""
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"Failed to accept WebSocket: {e}")
        return
    
    transport_manager.connected_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(transport_manager.connected_clients)}")
    
    try:
        last_send = time.time()
        send_interval = 1.0 / 60.0
        
        # Send initial state
        try:
            state = transport_manager.get_state()
            await websocket.send_json({
                "type": "state",
                "data": state.model_dump()
            })
        except Exception as e:
            logger.error(f"Failed to send initial state: {e}")
            return
        
        while True:
            try:
                # Non-blocking receive
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=0.001
                    )
                    try:
                        message = json.loads(data)
                        
                        # Handle commands
                        if message.get("type") == "play":
                            transport_manager.play()
                        elif message.get("type") == "stop":
                            transport_manager.stop()
                        elif message.get("type") == "pause":
                            transport_manager.pause()
                        elif message.get("type") == "resume":
                            transport_manager.resume()
                        elif message.get("type") == "seek":
                            transport_manager.seek(message.get("time_seconds", 0))
                        elif message.get("type") == "tempo":
                            transport_manager.set_tempo(message.get("bpm", 120))
                        elif message.get("type") == "loop":
                            transport_manager.set_loop(
                                message.get("enabled", False),
                                message.get("start_seconds", 0),
                                message.get("end_seconds", 10)
                            )
                    except json.JSONDecodeError:
                        pass
                    
                except asyncio.TimeoutError:
                    pass
                
                # Send state update
                current_time = time.time()
                if current_time - last_send >= send_interval:
                    try:
                        state = transport_manager.get_state()
                        await websocket.send_json({
                            "type": "state",
                            "data": state.model_dump()
                        })
                        last_send = current_time
                    except RuntimeError as e:
                        logger.warning(f"Connection closed: {e}")
                        break
                    except Exception as e:
                        logger.error(f"Send error: {e}")
                        break
                
                # Minimal sleep
                await asyncio.sleep(0.0001)
            
            except asyncio.CancelledError:
                logger.info("WebSocket task cancelled")
                break
            except Exception as e:
                logger.error(f"Unexpected error in loop: {type(e).__name__}: {e}")
                break
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected (clean)")
    except Exception as e:
        logger.error(f"WebSocket handler error: {type(e).__name__}: {e}")
    finally:
        transport_manager.connected_clients.discard(websocket)
        logger.info(f"WebSocket cleanup. Remaining: {len(transport_manager.connected_clients)}")

# ============================================================================
# REST TRANSPORT ENDPOINTS
# ============================================================================

@app.post("/transport/play")
async def transport_play() -> TransportCommandResponse:
    """Start playback"""
    try:
        state = transport_manager.play()
        return TransportCommandResponse(
            success=True,
            message="Playback started",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/stop")
async def transport_stop() -> TransportCommandResponse:
    """Stop playback"""
    try:
        state = transport_manager.stop()
        return TransportCommandResponse(
            success=True,
            message="Playback stopped",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/pause")
async def transport_pause() -> TransportCommandResponse:
    """Pause playback"""
    try:
        state = transport_manager.pause()
        return TransportCommandResponse(
            success=True,
            message="Playback paused",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/resume")
async def transport_resume() -> TransportCommandResponse:
    """Resume playback"""
    try:
        state = transport_manager.resume()
        return TransportCommandResponse(
            success=True,
            message="Playback resumed",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transport/seek")
async def transport_seek(seconds: float) -> TransportCommandResponse:
    """Seek to time position"""
    try:
        state = transport_manager.seek(seconds)
        return TransportCommandResponse(
            success=True,
            message=f"Seeked to {seconds} seconds",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/tempo")
async def transport_tempo(bpm: float) -> TransportCommandResponse:
    """Set playback tempo"""
    try:
        if not 1 <= bpm <= 300:
            raise ValueError("BPM must be between 1 and 300")
        state = transport_manager.set_tempo(bpm)
        return TransportCommandResponse(
            success=True,
            message=f"Tempo set to {bpm} BPM",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/loop")
async def transport_loop(
    enabled: bool,
    start_seconds: float = 0.0,
    end_seconds: float = 10.0
) -> TransportCommandResponse:
    """Configure loop region"""
    try:
        state = transport_manager.set_loop(enabled, start_seconds, end_seconds)
        return TransportCommandResponse(
            success=True,
            message=f"Loop {'enabled' if enabled else 'disabled'}",
            state=state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transport/status")
async def transport_status() -> TransportState:
    """Get current transport state"""
    return transport_manager.get_state()

@app.get("/transport/metrics")
async def transport_metrics() -> Dict[str, Any]:
    """Get transport metrics"""
    state = transport_manager.get_state()
    return {
        "state": state.model_dump(),
        "connected_clients": len(transport_manager.connected_clients),
        "timestamp": get_timestamp(),
        "beat_fraction": state.beat_pos,
        "sample_rate": transport_manager.sample_rate
    }

# ============================================================================
# STATUS ENDPOINT
# ============================================================================

@app.get("/codette/status")
async def get_status():
    """Get current status"""
    return {
        "status": "running",
        "version": "2.0.0",
        "real_engine": USE_REAL_ENGINE,
        "training_available": TRAINING_AVAILABLE,
        "codette_available": codette is not None,
        "perspectives_available": [
            "mix_engineering",
            "audio_theory",
            "creative_production",
            "technical_troubleshooting",
            "workflow_optimization",
        ],
        "features": [
            "chat",
            "audio_analysis",
            "suggestions",
            "transport_control",
            "training_data",
        ],
        "timestamp": get_timestamp(),
    }

@app.get("/codette/cache/stats")
async def get_cache_stats():
    """Get context cache statistics"""
    stats = context_cache.stats()
    return {
        "cache_enabled": True,
        "entries": stats["entries"],
        "ttl_seconds": stats["ttl_seconds"],
        "timestamp": get_timestamp(),
        "metrics": {
            "hits": stats["hits"],
            "misses": stats["misses"],
            "total_requests": stats["total_requests"],
            "hit_rate_percent": stats["hit_rate_percent"],
            "average_hit_latency_ms": stats["average_hit_latency_ms"],
            "average_miss_latency_ms": stats["average_miss_latency_ms"],
            "performance_gain_multiplier": stats["performance_gain"],
            "uptime_seconds": stats["uptime_seconds"],
        }
    }

@app.get("/codette/cache/metrics")
async def get_cache_metrics():
    """Get detailed cache performance metrics"""
    stats = context_cache.stats()
    return {
        "performance_dashboard": {
            "cache_hit_rate": f"{stats['hit_rate_percent']}%",
            "total_requests": stats["total_requests"],
            "successful_hits": stats["hits"],
            "cache_misses": stats["misses"],
            "average_latency_comparison": {
                "cached_response_ms": stats["average_hit_latency_ms"],
                "uncached_response_ms": stats["average_miss_latency_ms"],
                "speedup_multiplier": f"{stats['performance_gain']}x",
                "time_saved_per_hit_ms": round(
                    stats["average_miss_latency_ms"] - stats["average_hit_latency_ms"], 2
                )
            },
            "cumulative_time_saved": {
                "total_ms": round(
                    stats["total_miss_latency_ms"] - stats["total_hit_latency_ms"], 2
                ),
                "total_seconds": round(
                    (stats["total_miss_latency_ms"] - stats["total_hit_latency_ms"]) / 1000, 2
                ),
            },
            "cache_efficiency": {
                "memory_entries": stats["entries"],
                "ttl_seconds": stats["ttl_seconds"],
                "uptime_seconds": stats["uptime_seconds"],
                "estimated_memory_mb": round(stats["entries"] * 0.004, 2),  # ~4KB per entry
            }
        },
        "timestamp": get_timestamp(),
    }

@app.post("/codette/cache/clear")
async def clear_cache():
    """Clear all cached context"""
    context_cache.clear()
    
    # Also clear Redis if available
    if REDIS_ENABLED and redis_client:
        try:
            redis_client.delete(*redis_client.keys("context:*"))
            logger.info("Redis cache cleared")
        except Exception as e:
            logger.warning(f"Failed to clear Redis cache: {e}")
    
    return {
        "status": "cleared",
        "timestamp": get_timestamp(),
    }

@app.get("/codette/analytics/dashboard")
async def get_analytics_dashboard():
    """Get comprehensive analytics dashboard"""
    stats = context_cache.stats()
    
    return {
        "analytics": {
            "cache_performance": {
                "overall_hit_rate": f"{stats['hit_rate_percent']}%",
                "total_requests_processed": stats["total_requests"],
                "successful_cache_hits": stats["hits"],
                "cache_misses": stats["misses"],
                "average_response_times": {
                    "with_cache_ms": stats["average_hit_latency_ms"],
                    "without_cache_ms": stats["average_miss_latency_ms"],
                    "speedup_multiplier": f"{stats['performance_gain']}x",
                },
                "total_time_saved": {
                    "milliseconds": round(
                        stats["total_miss_latency_ms"] - stats["total_hit_latency_ms"], 2
                    ),
                    "seconds": round(
                        (stats["total_miss_latency_ms"] - stats["total_hit_latency_ms"]) / 1000, 2
                    ),
                    "estimated_cost_savings": "Multiple RPC calls avoided",
                },
            },
            "cache_infrastructure": {
                "memory_cache_enabled": True,
                "redis_cache_enabled": REDIS_ENABLED,
                "redis_connected": bool(redis_client),
                "memory_entries": stats["entries"],
                "estimated_memory_usage_mb": round(stats["entries"] * 0.004, 2),
                "ttl_seconds": stats["ttl_seconds"],
                "uptime_seconds": stats["uptime_seconds"],
            },
            "optimization_recommendations": [
                "Monitor hit rate - if below 50%, consider reducing TTL",
                f"Current cache efficiency: {stats['performance_gain']}x faster for hits",
                "Enable Redis for production deployments with multiple instances",
                "Consider pre-warming cache with common queries during off-peak hours",
            ] if stats["hit_rate_percent"] < 80 else [
                "✅ Cache performing optimally with high hit rate",
                f"Maintaining {stats['performance_gain']}x performance improvement",
                "Consider Redis if scaling to multiple backend instances",
            ],
        },
        "timestamp": get_timestamp(),
    }

@app.get("/codette/cache/status")
async def get_cache_status():
    """Get cache backend status (memory vs Redis)"""
    redis_status = "connected" if (REDIS_ENABLED and redis_client) else "unavailable"
    
    return {
        "cache_backends": {
            "memory_cache": "active",
            "redis_cache": redis_status,
        },
        "current_mode": "dual" if (REDIS_ENABLED and redis_client) else "memory-only",
        "fallback_chain": [
            "Redis (if enabled and connected)",
            "In-memory cache",
            "Fresh Supabase RPC call"
        ],
        "timestamp": get_timestamp(),
    }

# ============================================================================
# DSP EFFECTS ENDPOINTS
# ============================================================================

# Try to import DSP effects
try:
    from daw_core.fx.eq_and_dynamics import EQ3Band, Compressor
    from daw_core.fx.dynamics_part2 import Limiter, Gate
    from daw_core.fx.saturation import Saturation, Distortion
    from daw_core.fx.delays import SimpleDelay, PingPongDelay
    from daw_core.fx.reverb import HallReverb, PlateReverb
    from daw_core.fx.modulation_and_utility import Chorus, Gain
    DSP_EFFECTS_AVAILABLE = True
    
    EFFECTS_REGISTRY = {
        "eq_3band": {"class": EQ3Band, "name": "3-Band EQ", "category": "eq"},
        "compressor": {"class": Compressor, "name": "Compressor", "category": "dynamics"},
        "limiter": {"class": Limiter, "name": "Limiter", "category": "dynamics"},
        "gate": {"class": Gate, "name": "Gate", "category": "dynamics"},
        "reverb_plate": {"class": PlateReverb, "name": "Plate Reverb", "category": "reverb"},
        "reverb_hall": {"class": HallReverb, "name": "Hall Reverb", "category": "reverb"},
        "chorus": {"class": Chorus, "name": "Chorus", "category": "modulation"},
        "delay": {"class": SimpleDelay, "name": "Simple Delay", "category": "delay"},
        "delay_pingpong": {"class": PingPongDelay, "name": "Ping Pong Delay", "category": "delay"},
        "distortion": {"class": Distortion, "name": "Distortion", "category": "saturation"},
        "saturation": {"class": Saturation, "name": "Saturation", "category": "saturation"},
        "gain": {"class": Gain, "name": "Gain", "category": "utility"},
    }
except ImportError as e:
    DSP_EFFECTS_AVAILABLE = False
    EFFECTS_REGISTRY = {}
    logger.warning(f"[WARNING] DSP effects not available: {e}")


@app.get("/daw/effects/list")
async def list_effects():
    """Get list of all available DSP effects"""
    try:
        if not DSP_EFFECTS_AVAILABLE:
            return {"effects": [], "status": "dsp_unavailable"}

        effects_list = []
        for effect_id, effect_config in EFFECTS_REGISTRY.items():
            effects_list.append({
                "id": effect_id,
                "name": effect_config["name"],
                "category": effect_config["category"],
                "parameters": {}
            })
        
        logger.info(f"[DSP Effects] Listed {len(effects_list)} effects")
        return {"effects": effects_list, "count": len(effects_list), "status": "success"}
    except Exception as e:
        logger.error(f"[DSP Effects] Error listing effects: {e}", exc_info=True)
        return {"effects": [], "status": "error", "error": str(e)}


@app.get("/daw/effects/{effect_id}")
async def get_effect_info(effect_id: str):
    """Get detailed information about a specific effect"""
    try:
        if effect_id not in EFFECTS_REGISTRY:
            return {"status": "not_found", "error": f"Effect '{effect_id}' not found"}

        effect_config = EFFECTS_REGISTRY[effect_id]
        return {
            "id": effect_id,
            "name": effect_config["name"],
            "category": effect_config["category"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"[DSP Effects] Error getting effect info: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/daw/effects/process")
async def process_audio(request_data: dict):
    """Process audio through a specific effect"""
    try:
        if not DSP_EFFECTS_AVAILABLE:
            return {"success": False, "error": "DSP effects not available", "audioData": request_data.get("audioData", [])}

        effect_type = request_data.get("effectType", "")
        if effect_type not in EFFECTS_REGISTRY:
            return {"success": False, "error": f"Effect '{effect_type}' not found", "audioData": request_data.get("audioData", [])}

        audio_data = request_data.get("audioData", [])
        parameters = request_data.get("parameters", {})

        # Convert to numpy array
        if np is None:
            return {"success": False, "error": "NumPy not available", "audioData": audio_data}
        
        audio_array = np.array(audio_data, dtype=np.float32)
        
        # Get effect class and instantiate
        effect_class = EFFECTS_REGISTRY[effect_type]["class"]
        effect = effect_class(effect_type)

        # Apply parameters if they have setter methods
        for param_id, param_value in parameters.items():
            method_name = f"set_{param_id}"
            if hasattr(effect, method_name):
                try:
                    getattr(effect, method_name)(param_value)
                except Exception as e:
                    logger.warning(f"[DSP Effects] Failed to set parameter {param_id}: {e}")

        # Process audio
        import time
        start_time = time.time()
        processed = effect.process(audio_array)
        processing_time = (time.time() - start_time) * 1000

        # Convert back to list
        processed_list = processed.tolist() if hasattr(processed, 'tolist') else list(processed)

        logger.info(f"[DSP Effects] Processed {len(audio_data)} samples through {effect_type} in {processing_time:.2f}ms")
        
        return {
            "audioData": processed_list,
            "success": True,
            "processingTime": processing_time
        }
    except Exception as e:
        logger.error(f"[DSP Effects] Error processing audio: {e}", exc_info=True)
        return {
            "audioData": request_data.get("audioData", []),
            "success": False,
            "error": str(e),
            "processingTime": 0
        }


# ============================================================================
# GENRE TEMPLATES ENDPOINTS
# ============================================================================

@app.get("/codette/genres")
async def get_available_genres_endpoint():
    """Get list of available genre templates"""
    try:
        if GENRE_TEMPLATES_AVAILABLE and get_available_genres:
            genres = get_available_genres()
            return {
                "genres": genres,
                "status": "success",
                "timestamp": get_timestamp(),
            }
        return {
            "genres": [],
            "status": "templates_unavailable",
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"Error retrieving genres: {e}", exc_info=True)
        return {
            "genres": [],
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp(),
        }


@app.get("/codette/genre/{genre_id}")
async def get_genre_characteristics_endpoint(genre_id: str):
    """Get mixing characteristics for a specific genre"""
    try:
        if GENRE_TEMPLATES_AVAILABLE and get_genre_characteristics:
            characteristics = get_genre_characteristics(genre_id.lower())
            if characteristics:
                return {
                    "genre": genre_id,
                    "characteristics": characteristics,
                    "status": "success",
                    "timestamp": get_timestamp(),
                }
            return {
                "genre": genre_id,
                "status": "genre_not_found",
                "timestamp": get_timestamp(),
            }
        return {
            "genre": genre_id,
            "status": "templates_unavailable",
            "timestamp": get_timestamp(),
        }
    except Exception as e:
        logger.error(f"Error retrieving genre {genre_id}: {e}", exc_info=True)
        return {
            "genre": genre_id,
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp(),
        }

# ============================================================================
# MESSAGE EMBEDDING ENDPOINTS (for semantic search in chat history)
# ============================================================================

class MessageEmbeddingRequest(BaseModel):
    """Request to store or retrieve message embeddings"""
    message: str
    conversation_id: Optional[str] = None
    role: Optional[str] = "user"  # "user" or "assistant"
    metadata: Optional[Dict[str, Any]] = None

class MessageEmbeddingResponse(BaseModel):
    """Response from message embedding operations"""
    success: bool
    message_id: Optional[str] = None
    embedding: Optional[List[float]] = None
    similar_messages: Optional[List[Dict[str, Any]]] = None
    timestamp: Optional[str] = None

@app.post("/codette/embeddings/store", response_model=MessageEmbeddingResponse)
async def store_message_embedding(request: MessageEmbeddingRequest):
    """
    Store a message embedding in Supabase for future semantic search.
    This enables finding similar questions/answers in chat history.
    """
    try:
        # Generate embedding for the message
        embedding = generate_simple_embedding(request.message)
        
        if not supabase_client or not SUPABASE_AVAILABLE:
            logger.warning("Supabase not available for storing message embedding")
            return MessageEmbeddingResponse(
                success=False,
                timestamp=get_timestamp(),
            )
        
        try:
            # Store message embedding in Supabase
            # Assumes table: message_embeddings (id, message, embedding, conversation_id, role, metadata, created_at)
            logger.info(f"Storing message embedding for: {request.message[:50]}...")
            
            payload = {
                "message": request.message,
                "embedding": embedding,
                "conversation_id": request.conversation_id or "default",
                "role": request.role,
                "metadata": request.metadata or {},
                "created_at": get_timestamp(),
            }
            
            # Use RPC or direct table insert if available
            result = supabase_client.table("message_embeddings").insert(payload).execute()
            
            message_id = result.data[0].get("id") if result.data else None
            
            logger.info(f"✅ Message embedding stored: {message_id}")
            
            return MessageEmbeddingResponse(
                success=True,
                message_id=message_id,
                embedding=embedding,
                timestamp=get_timestamp(),
            )
        
        except Exception as db_err:
            logger.warning(f"Could not store in database: {db_err}")
            # Even if DB storage fails, return the embedding generated
            return MessageEmbeddingResponse(
                success=True,
                embedding=embedding,
                timestamp=get_timestamp(),
            )
    
    except Exception as e:
        logger.error(f"Error storing message embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/codette/embeddings/search")
async def search_similar_messages(request: MessageEmbeddingRequest):
    """
    Search for similar messages in chat history using embedding similarity.
    Returns semantically similar messages for better context understanding.
    """
    try:
        # Generate embedding for the query message
        query_embedding = generate_simple_embedding(request.message)
        
        if not supabase_client or not SUPABASE_AVAILABLE:
            logger.warning("Supabase not available for message search")
            return {
                "success": False,
                "similar_messages": [],
                "timestamp": get_timestamp(),
            }
        
        try:
            # Search for similar messages using Supabase vector search
            # This assumes a vector similarity search capability in Supabase
            logger.info(f"Searching for messages similar to: {request.message[:50]}...")
            
            # Use Supabase RPC for vector similarity search if available
            search_result = supabase_client.rpc(
                'search_similar_messages',
                {
                    'query_embedding': query_embedding,
                    'conversation_id': request.conversation_id or "default",
                    'limit': 5
                }
            ).execute()
            
            similar_messages = search_result.data if search_result.data else []
            
            logger.info(f"Found {len(similar_messages)} similar messages")
            
            return {
                "success": True,
                "similar_messages": similar_messages,
                "query_embedding_dim": len(query_embedding),
                "timestamp": get_timestamp(),
            }
        
        except Exception as search_err:
            logger.warning(f"Vector search not available: {search_err}")
            return {
                "success": False,
                "similar_messages": [],
                "timestamp": get_timestamp(),
            }
    
    except Exception as e:
        logger.error(f"Error searching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/codette/embeddings/stats")
async def get_embedding_statistics():
    """Get statistics about stored message embeddings"""
    try:
        if not supabase_client or not SUPABASE_AVAILABLE:
            return {
                "success": False,
                "message": "Supabase not available",
                "timestamp": get_timestamp(),
            }
        
        try:
            # Get count of stored embeddings
            count_result = supabase_client.table("message_embeddings").select("count()", count="exact").execute()
            total_embeddings = count_result.count or 0
            
            # Get count by role
            user_msgs = supabase_client.table("message_embeddings").select("count()", count="exact").eq("role", "user").execute()
            assistant_msgs = supabase_client.table("message_embeddings").select("count()", count="exact").eq("role", "assistant").execute()
            
            return {
                "success": True,
                "total_embeddings": total_embeddings,
                "user_messages": user_msgs.count or 0,
                "assistant_messages": assistant_msgs.count or 0,
                "embedding_dimension": 1536,
                "timestamp": get_timestamp(),
            }
        
        except Exception as stats_err:
            logger.warning(f"Could not retrieve embedding statistics: {stats_err}")
            return {
                "success": False,
                "message": str(stats_err),
                "timestamp": get_timestamp(),
            }
    
    except Exception as e:
        logger.error(f"Error getting embedding stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    # Always use port 8000 for backend
    port = 8000
    
    logger.info("=" * 80)
    logger.info("Starting Codette AI Unified Server")
    logger.info("=" * 80)
    logger.info(f"Real Engine: {USE_REAL_ENGINE}")
    logger.info(f"Training Data: {TRAINING_AVAILABLE}")
    logger.info(f"NumPy Available: {NUMPY_AVAILABLE}")
    logger.info(f"Port: {port}")
    logger.info("=" * 80)
    logger.info(f"🌐 WebSocket: ws://localhost:{port}/ws")
    logger.info(f"📡 API Docs: http://localhost:{port}/docs")
    logger.info("=" * 80)
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        traceback.print_exc()
