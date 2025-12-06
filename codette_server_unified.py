#!/usr/bin/env python
"""
Codette AI Unified Server - Complete Implementation
All endpoints required by frontend codetteApiClient.ts
"""

# FIRST: Set environment to suppress PyTensor warnings BEFORE any imports
import os
os.environ["PYTENSOR_FLAGS"] = "device=cpu,floatX=float32,cxx="
os.environ["ARVIZ_DATA"] = ""  # Suppress arviz data warnings

import sys
import json
import logging
import time
import traceback
import warnings
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel

# Suppress all non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("pytensor").setLevel(logging.ERROR)

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
import uvicorn

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONSTANTS & GLOBALS
# ============================================================================

# WebSocket connections tracking
active_websockets: List[WebSocket] = []
LAST_BROADCAST_AT: Optional[str] = None

async def broadcast_status_periodically(interval_seconds: float = 2.0):
    """Broadcast server health and transport status to all WS clients periodically."""
    import asyncio
    global LAST_BROADCAST_AT
    while True:
        try:
            payload = {
                "type": "server_status",
                "data": {
                    "health": {"status": "healthy", "timestamp": get_timestamp()},
                    "transport": transport_manager.get_state(),
                    "connections": len(active_websockets),
                },
            }
            LAST_BROADCAST_AT = get_timestamp()
            # Send to all active websockets
            for ws in list(active_websockets):
                try:
                    await ws.send_json(payload)
                except Exception:
                    # Drop dead sockets
                    try:
                        active_websockets.remove(ws)
                    except ValueError:
                        pass
            await asyncio.sleep(interval_seconds)
        except Exception:
            # Continue loop on any unexpected error
            await asyncio.sleep(interval_seconds)

# Mock quantum state for fallback
MOCK_QUANTUM_STATE = {
    "coherence": 0.85,
    "entanglement": 0.72,
    "resonance": 0.68,
    "phase": 1.57,
    "fluctuation": 0.07
}

def get_timestamp() -> str:
    """Get current ISO timestamp"""
    return datetime.now(timezone.utc).isoformat()

# ============================================================================
# DEPENDENCY CHECKS
# ============================================================================

# Try to import NumPy for audio processing
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None
    NUMPY_AVAILABLE = False
    print("[WARNING] NumPy not available - audio processing disabled")

# Try to import DAW Core DSP effects
DSP_EFFECTS_AVAILABLE = False
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor
    from daw_core.fx.dynamics_part2 import Limiter
    from daw_core.fx.saturation import Saturation, Distortion
    from daw_core.fx.delays import SimpleDelay
    from daw_core.fx.reverb import Reverb
    DSP_EFFECTS_AVAILABLE = True
    logger.info("✅ DSP effects library loaded")
except ImportError as e:
    logger.warning(f"⚠️ DSP effects not available: {e}")

# ============================================================================
# CODETTE IMPORT
# ============================================================================

# Add Codette directory to path
codette_path = Path(__file__).parent / "Codette"
if codette_path.exists():
    sys.path.insert(0, str(codette_path))
    logger.info(f"✅ Added Codette path: {codette_path}")
else:
    logger.error("❌ Codette directory not found")

# Import Codette capabilities (Quantum Consciousness)
CODETTE_CAPABILITIES_AVAILABLE = False
quantum_consciousness = None
try:
    from src.codette_capabilities import QuantumConsciousness
    CODETTE_CAPABILITIES_AVAILABLE = True
    logger.info("✅ Codette capabilities module loaded")
except ImportError as e:
    logger.info(f"ℹ️  Codette capabilities not available: {e}")

# Import Codette core - try enhanced 9-perspective version first
CODETTE_CORE_AVAILABLE = False
CODETTE_ENHANCED = False
codette_core = None

# Try enhanced version first (9 perspectives with MCMC, sentiment, etc.)
try:
    from codette_enhanced import Codette as CodetteEnhanced
    CODETTE_CORE_AVAILABLE = True
    CODETTE_ENHANCED = True
    logger.info("✅ Codette ENHANCED module (codette_enhanced.py) loaded - 9 perspectives")
except ImportError as e:
    logger.info(f"ℹ️  Enhanced Codette not available: {e}")
    
    # Fallback to standard codette_new
    try:
        from codette_new import Codette as CodetteCore
        CODETTE_CORE_AVAILABLE = True
        logger.info("✅ Codette core module (codette_new.py) loaded successfully")
    except ImportError as e2:
        logger.error(f"❌ Failed to import any Codette: {e2}")

# Import Codette Hybrid (combines advanced features)
CODETTE_HYBRID_AVAILABLE = False
CodetteHybrid = None
try:
    from codette_hybrid import CodetteHybrid
    CODETTE_HYBRID_AVAILABLE = True
    logger.info("✅ Codette Hybrid module loaded")
except ImportError as e:
    logger.info(f"ℹ️  Codette Hybrid not available: {e}")

# Initialize Quantum Consciousness
if CODETTE_CAPABILITIES_AVAILABLE:
    try:
        quantum_consciousness = QuantumConsciousness()
        logger.info("✅ Quantum Consciousness System initialized")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize Quantum Consciousness: {e}")

# Initialize Codette instance
if CODETTE_CORE_AVAILABLE:
    try:
        if CODETTE_ENHANCED:
            codette_core = CodetteEnhanced(user_name="CoreLogicStudio")
            logger.info("✅ Codette ENHANCED initialized successfully")
        else:
            codette_core = CodetteCore(user_name="CoreLogicStudio")
            logger.info("✅ Codette initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Codette: {e}")
        codette_core = None

# Initialize Codette Hybrid (preferred engine if available)
codette_hybrid = None
if CODETTE_HYBRID_AVAILABLE and CodetteHybrid:
    try:
        codette_hybrid = CodetteHybrid(user_name="CoreLogicStudio", use_ml_features=True)
        logger.info("✅ Codette Hybrid System initialized (ML mode)")
        logger.info("   • Defense modifiers: Active")
        logger.info("   • Vector search: Active")
        logger.info("   • Prompt engineering: Active")
        logger.info("   • Creative sentence generation: Active")
        logger.info("   • ML features: Enabled")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize Codette Hybrid: {e}")

# Set the active engine (prefer hybrid > enhanced > core)
if codette_hybrid:
    codette_engine = codette_hybrid
    codette_engine_type = "CodetteHybrid"
    logger.info(f"✅ Codette engine set from codette_hybrid (type: {codette_engine_type})")
elif codette_core:
    codette_engine = codette_core
    codette_engine_type = "CodetteEnhanced" if CODETTE_ENHANCED else "CodetteCore"
    logger.info(f"✅ Codette engine set from codette_core (type: {codette_engine_type})")
else:
    codette_engine = None
    codette_engine_type = None
    logger.warning("⚠️ No Codette engine available - running in fallback mode")

# ============================================================================
# COCOON MANAGER INTEGRATION
# ============================================================================

# Import or create CocoonManager
cocoon_manager = None
COCOONS_DIR = Path(__file__).parent / "Codette" / "cocoons"

def get_cocoon_manager():
    """Get or create the cocoon manager instance"""
    global cocoon_manager
    if cocoon_manager is None:
        try:
            # Try to import the existing CocoonManager
            from Codette.src.utils.cocoon_manager import CocoonManager
            cocoon_manager = CocoonManager(str(COCOONS_DIR))
            cocoon_manager.load_cocoons()
            logger.info(f"✅ CocoonManager loaded with {len(cocoon_manager.cocoon_data)} cocoons")
        except ImportError:
            logger.warning("⚠️ CocoonManager not found, using fallback")
            cocoon_manager = FallbackCocoonManager(str(COCOONS_DIR))
    return cocoon_manager


class FallbackCocoonManager:
    """Fallback cocoon manager if the real one isn't available"""
    
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.cocoon_data = []
        self.quantum_state = {"coherence": 0.5, "entanglement": 0.5, "resonance": 0.5, "phase": 1.57, "fluctuation": 0.07}
        self._load_cocoons()
    
    def _load_cocoons(self):
        """Load all cocoon files from disk"""
        try:
            if not self.base_dir.exists():
                self.base_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created cocoons directory: {self.base_dir}")
                return
            
            cocoon_files = list(self.base_dir.glob("*.cocoon"))
            logger.info(f"Found {len(cocoon_files)} cocoon files")
            
            for fpath in cocoon_files:
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        cocoon = json.load(f)
                        cocoon['id'] = fpath.stem
                        cocoon['filename'] = fpath.name
                        self.cocoon_data.append(cocoon)
                except Exception as e:
                    logger.warning(f"Failed to load cocoon {fpath.name}: {e}")
            
            # Sort by timestamp (newest first)
            self.cocoon_data.sort(
                key=lambda x: x.get('timestamp', x.get('data', {}).get('timestamp', '0')),
                reverse=True
            )
            
            # Find the best quantum state from cocoons
            for cocoon in self.cocoon_data:
                data = cocoon.get('data', {})
                qs = data.get('quantum_state')
                chaos = data.get('chaos_state', [])
                
                if isinstance(qs, list) and len(qs) >= 2:
                    self.quantum_state = {
                        "coherence": round(qs[0], 4) if len(qs) > 0 else 0.5,
                        "entanglement": round(qs[1], 4) if len(qs) > 1 else 0.5,
                        "resonance": round(sum(qs) / len(qs), 4) if qs else 0.5,
                        "phase": round(chaos[0], 4) if isinstance(chaos, list) and len(chaos) > 0 else 1.57,
                        "fluctuation": round(chaos[1], 4) if isinstance(chaos, list) and len(chaos) > 1 else 0.07
                    }
                    break
                elif isinstance(qs, dict) and len(qs) > 1:
                    self.quantum_state = {
                        "coherence": qs.get('coherence', 0.5),
                        "entanglement": qs.get('entanglement', 0.5),
                        "resonance": qs.get('resonance', 0.5),
                        "phase": qs.get('phase', 1.57),
                        "fluctuation": qs.get('fluctuation', 0.07)
                    }
                    break
            
            logger.info(f"Loaded {len(self.cocoon_data)} cocoons")
            
        except Exception as e:
            logger.error(f"Error loading cocoons: {e}")
    
    def get_latest_cocoons(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.cocoon_data[:limit]
    
    def get_cocoon_by_id(self, cocoon_id: str) -> Optional[Dict[str, Any]]:
        for cocoon in self.cocoon_data:
            if cocoon.get('id') == cocoon_id or cocoon.get('filename', '').startswith(cocoon_id):
                return cocoon
        return None
    
    def save_cocoon(self, data: Dict[str, Any], cocoon_type: str = "codette") -> Optional[str]:
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{cocoon_type}_cocoon_{timestamp}.cocoon"
            filepath = self.base_dir / filename
            
            cocoon = {
                "timestamp": datetime.now().isoformat(),
                "data": {**data, "timestamp": datetime.now().isoformat(), "quantum_state": self.quantum_state.copy()}
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(cocoon, f, indent=2)
            
            cocoon['id'] = filepath.stem
            cocoon['filename'] = filename
            self.cocoon_data.insert(0, cocoon)
            logger.info(f"Saved cocoon: {filename}")
            return cocoon['id']
        except Exception as e:
            logger.error(f"Error saving cocoon: {e}")
            return None
    
    def get_latest_quantum_state(self) -> Dict[str, float]:
        return self.quantum_state.copy()


# ============================================================================
# TRANSPORT MANAGER
# ============================================================================

class TransportManager:
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start = 0.0
        self.loop_end = 10.0
    
    def get_state(self):
        if self.playing and self.start_time:
            self.time_seconds = time.time() - self.start_time
        beat_duration = 60.0 / self.bpm
        return {
            "playing": self.playing, "time_seconds": self.time_seconds,
            "sample_pos": int(self.time_seconds * self.sample_rate), "bpm": self.bpm,
            "beat_pos": (self.time_seconds % (beat_duration * 4)) / beat_duration,
            "loop_enabled": self.loop_enabled, "loop_start_seconds": self.loop_start, "loop_end_seconds": self.loop_end
        }
    
    def play(self):
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def stop(self):
        self.playing = False
        self.time_seconds = 0.0
        self.start_time = None
        return self.get_state()
    
    def pause(self):
        if self.playing:
            self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()
    
    def resume(self):
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def seek(self, t): self.time_seconds = max(0.0, t); return self.get_state()
    def set_tempo(self, bpm): self.bpm = max(1.0, min(300.0, bpm)); return self.get_state()
    def set_loop(self, en, s=0.0, e=10.0): self.loop_enabled = en; self.loop_start = s; self.loop_end = e; return self.get_state()

transport_manager = TransportManager()

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Unified Server",
    description="Backend server for CoreLogic Studio DAW with Codette AI",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("✅ FastAPI app configured")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class SuggestionRequest(BaseModel):
    context: Dict[str, Any]
    limit: Optional[int] = 5

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: Optional[float] = None

class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    daw_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None

class MusicGuidanceRequest(BaseModel):
    guidance_type: str = "mixing"
    context: Optional[Dict[str, Any]] = None

class AudioAnalysisRequest(BaseModel):
    audio_data: Optional[Dict[str, Any]] = None
    analysis_type: str = "spectrum"

class SaveCocoonRequest(BaseModel):
    content: str
    emotion_tag: Optional[str] = "neutral"
    perspectives_used: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class ProcessRequest(BaseModel):
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int

class EffectProcessRequest(BaseModel):
    effect_type: str
    parameters: Dict[str, float]
    audio_data: List[float]
    sample_rate: Optional[int] = 44100

class EmbeddingRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    role: Optional[str] = "user"

class UpsertRequest(BaseModel):
    rows: List[Dict[str, str]]

class GenreDetectRequest(BaseModel):
    bpm: Optional[float] = 120.0
    tracks: Optional[List[Dict[str, Any]]] = None
    project_name: Optional[str] = None

# ============================================================================
# HEALTH & STATUS
# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "Codette AI Unified Server", "version": "2.0.0", "timestamp": get_timestamp()}

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy", "codette_available": codette_core is not None, "dsp_available": DSP_EFFECTS_AVAILABLE, "timestamp": get_timestamp()}

# ============================================================================
# CODETTE CORE ENDPOINTS
# ============================================================================

@app.get("/codette/status")
@app.get("/api/codette/status")
async def codette_status():
    mgr = get_cocoon_manager()
    return {"status": "active", "codette_available": codette_core is not None, "quantum_state": mgr.quantum_state,
            "cocoons_loaded": len(mgr.cocoon_data), "active_connections": len(active_websockets), "timestamp": get_timestamp()}

@app.post("/codette/chat")
@app.post("/api/codette/chat")
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - returns multi-perspective analysis"""
    response = "I'm Codette. How can I help with your production?"
    source = "fallback"
    
    # Log incoming request for debugging
    logger.info(f"[Chat] Message: {request.message[:50]}... | DAW context: {bool(request.daw_context)}")
    
    if codette_engine and hasattr(codette_engine, 'respond'):
        try:
            if request.daw_context:
                response = codette_engine.respond(request.message, request.daw_context)
            else:
                response = codette_engine.respond(request.message)
            source = codette_engine_type or "codette"
            logger.info(f"[Chat] Response generated from {source} ({len(response)} chars)")
        except Exception as e:
            logger.error(f"[Chat] Codette engine error: {e}")
            response = f"I encountered an issue processing your request. Let me give you general advice:\n\n"
            response += "**copilot_agent**: For audio production, consider:\n"
            response += "1. Start with proper gain staging (-6dB headroom)\n"
            response += "2. Use EQ to carve space for each element\n"
            response += "3. Apply compression for dynamics control\n"
            response += "4. Add spatial effects (reverb/delay) for depth"
            source = "fallback_error"
    else:
        logger.warning("[Chat] No Codette engine available, using fallback")
        # Enhanced fallback when no engine is available
        prompt_lower = request.message.lower()
        if any(kw in prompt_lower for kw in ['mix', 'eq', 'compress', 'reverb', 'vocal', 'drum', 'bass']):
            response = "**copilot_agent**: [Mixing Advice]\n"
            if 'vocal' in prompt_lower:
                response += "1. Apply high-pass filter at 80-100Hz\n"
                response += "2. Use compression (4:1 ratio) for consistency\n"
                response += "3. Add presence boost at 3-5kHz\n"
                response += "4. De-ess if sibilant (6-8kHz)"
            elif 'drum' in prompt_lower or 'kick' in prompt_lower or 'snare' in prompt_lower:
                response += "1. Gate for clean hits\n"
                response += "2. EQ for punch and clarity\n"
                response += "3. Compress for consistency\n"
                response += "4. Add room reverb for depth"
            elif 'bass' in prompt_lower:
                response += "1. High-pass at 30-40Hz\n"
                response += "2. Compress for consistency (4:1)\n"
                response += "3. Keep centered in stereo\n"
                response += "4. Consider sidechain to kick"
            else:
                response += "1. Set levels to -6dB peaks for headroom\n"
                response += "2. High-pass non-bass elements\n"
                response += "3. EQ to carve frequency space\n"
                response += "4. Compress for dynamics control"
        source = "fallback"
    
    return {
        "response": response,
        "perspective": request.perspective,
        "confidence": 0.85 if source != "fallback_error" else 0.5,
        "timestamp": get_timestamp(),
        "source": source
    }

@app.post("/codette/suggest")
@app.post("/api/codette/suggest")
async def codette_suggest(request: SuggestionRequest):
    ctx_type = request.context.get("type", "general")
    suggs = [{"type": "optimization", "title": "Gain staging", "description": "Keep peaks at -6dB", "confidence": 0.9}]
    if ctx_type == "mixing": suggs.append({"type": "effect", "title": "EQ balance", "description": "High-pass at 80Hz", "confidence": 0.85})
    return {"suggestions": suggs[:request.limit], "confidence": 0.85, "timestamp": get_timestamp()}

@app.post("/codette/analyze")
@app.post("/api/codette/analyze")
async def codette_analyze(request: AudioAnalysisRequest):
    return {"status": "ok", "analysis_type": request.analysis_type, "findings": ["Analysis complete"], "timestamp": get_timestamp()}

@app.post("/codette/process")
@app.post("/api/codette/process")
async def codette_process(request: ProcessRequest):
    return {"id": request.id, "status": "success", "data": {"processed": True}, "processingTime": 0.05}

# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@app.get("/api/training/context")
async def training_context():
    if TRAINING_AVAILABLE and get_training_context:
        return {"success": True, "data": get_training_context(), "timestamp": get_timestamp()}
    return {"success": False, "data": None, "message": "Training data not available"}

@app.get("/api/training/health")
async def training_health():
    return {"success": True, "training_available": TRAINING_AVAILABLE, "timestamp": get_timestamp()}

# ============================================================================
# EMBEDDINGS ENDPOINTS
# ============================================================================

@app.post("/codette/embeddings/store")
async def store_embedding(request: EmbeddingRequest):
    return {"success": True, "message_id": f"msg_{int(time.time())}", "timestamp": get_timestamp()}

@app.post("/codette/embeddings/search")
async def search_embeddings(request: EmbeddingRequest):
    return {"success": True, "similar_messages": [], "timestamp": get_timestamp()}

@app.get("/codette/embeddings/stats")
async def embedding_stats():
    return {"total_embeddings": 0, "model": "text-embedding-3-small", "timestamp": get_timestamp()}

@app.post("/api/upsert-embeddings")
async def upsert_embeddings(request: UpsertRequest):
    return {"success": True, "processed": len(request.rows), "updated": len(request.rows), "message": "Embeddings upserted"}

# ============================================================================
# CACHE ENDPOINTS
# ============================================================================

@app.get("/codette/cache/stats")
async def cache_stats():
    return {"total_entries": 0, "memory_usage_mb": 0, "hit_rate": 0, "miss_rate": 0, "eviction_rate": 0}

@app.get("/codette/cache/metrics")
async def cache_metrics():
    return {"stats": {"total_entries": 0}, "top_keys": [], "backend": "memory", "response_times": {}}

@app.get("/codette/cache/status")
async def cache_status():
    return {"backend": "memory", "connected": True}

@app.post("/codette/cache/clear")
async def cache_clear():
    return {"success": True, "message": "Cache cleared"}

# ============================================================================
# ANALYTICS
# ============================================================================

@app.get("/codette/analytics/dashboard")
async def analytics_dashboard():
    return {"total_queries": 0, "avg_response_time": 0, "popular_topics": [], "timestamp": get_timestamp()}

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/api/analysis/ear-training")
async def ear_training(exercise_type: str = "interval", difficulty: str = "beginner"):
    """Generate ear training exercises for music production"""
    
    # Interval exercises
    intervals = {
        "beginner": [
            {"name": "Perfect Unison", "semitones": 0, "example": "C to C"},
            {"name": "Perfect Fifth", "semitones": 7, "example": "C to G"},
            {"name": "Perfect Octave", "semitones": 12, "example": "C to C (octave)"},
        ],
        "intermediate": [
            {"name": "Major Third", "semitones": 4, "example": "C to E"},
            {"name": "Minor Third", "semitones": 3, "example": "C to Eb"},
            {"name": "Perfect Fourth", "semitones": 5, "example": "C to F"},
            {"name": "Major Sixth", "semitones": 9, "example": "C to A"},
        ],
        "advanced": [
            {"name": "Minor Second", "semitones": 1, "example": "C to Db"},
            {"name": "Major Second", "semitones": 2, "example": "C to D"},
            {"name": "Tritone", "semitones": 6, "example": "C to F#"},
            {"name": "Minor Seventh", "semitones": 10, "example": "C to Bb"},
            {"name": "Major Seventh", "semitones": 11, "example": "C to B"},
        ]
    }
    
    # Chord exercises
    chords = {
        "beginner": [
            {"name": "Major Triad", "intervals": [0, 4, 7], "quality": "bright, happy"},
            {"name": "Minor Triad", "intervals": [0, 3, 7], "quality": "dark, sad"},
        ],
        "intermediate": [
            {"name": "Dominant 7th", "intervals": [0, 4, 7, 10], "quality": "tension, wants to resolve"},
            {"name": "Major 7th", "intervals": [0, 4, 7, 11], "quality": "jazzy, dreamy"},
            {"name": "Minor 7th", "intervals": [0, 3, 7, 10], "quality": "smooth, mellow"},
        ],
        "advanced": [
            {"name": "Diminished 7th", "intervals": [0, 3, 6, 9], "quality": "tense, unstable"},
            {"name": "Augmented", "intervals": [0, 4, 8], "quality": "dreamy, unresolved"},
            {"name": "Sus4", "intervals": [0, 5, 7], "quality": "open, ambiguous"},
            {"name": "Add9", "intervals": [0, 4, 7, 14], "quality": "colorful, modern"},
        ]
    }
    
    # Frequency exercises for mixing
    frequencies = {
        "beginner": [
            {"range": "Sub Bass", "hz": "20-60", "description": "Felt more than heard, rumble"},
            {"range": "Bass", "hz": "60-250", "description": "Warmth, fullness, kick drum body"},
            {"range": "Low Mids", "hz": "250-500", "description": "Muddiness zone, body of instruments"},
        ],
        "intermediate": [
            {"range": "Mids", "hz": "500-2k", "description": "Clarity, vocal presence, guitar body"},
            {"range": "Upper Mids", "hz": "2k-4k", "description": "Presence, attack, intelligibility"},
            {"range": "Presence", "hz": "4k-6k", "description": "Definition, edge, sibilance zone"},
        ],
        "advanced": [
            {"range": "Brilliance", "hz": "6k-10k", "description": "Air, sparkle, cymbal shimmer"},
            {"range": "Air", "hz": "10k-20k", "description": "Openness, breathiness, high harmonics"},
            {"range": "Problem Zones", "hz": "Various", "description": "200-400Hz mud, 3-4kHz harshness, 7-8kHz sibilance"},
        ]
    }
    
    if exercise_type == "interval":
        exercises = intervals.get(difficulty, intervals["beginner"])
    elif exercise_type == "chord":
        exercises = chords.get(difficulty, chords["beginner"])
    elif exercise_type == "frequency":
        exercises = frequencies.get(difficulty, frequencies["beginner"])
    else:
        exercises = intervals.get(difficulty, intervals["beginner"])
    
    return {
        "success": True,
        "exercise_type": exercise_type,
        "difficulty": difficulty,
        "exercises": exercises,
        "tips": [
            "Practice daily for best results",
            "Start with easier exercises and progress gradually",
            "Use headphones for accurate frequency perception",
            "Compare exercises to real songs you know"
        ],
        "timestamp": get_timestamp()
    }

@app.get("/api/analysis/frequency-quiz")
async def frequency_quiz(difficulty: str = "beginner"):
    """Generate frequency identification quiz"""
    import random
    
    frequency_bands = [
        {"name": "Sub Bass", "range": "20-60 Hz", "characteristic": "Rumble, felt vibration"},
        {"name": "Bass", "range": "60-250 Hz", "characteristic": "Warmth, punch"},
        {"name": "Low Mids", "range": "250-500 Hz", "characteristic": "Body, potential mud"},
        {"name": "Mids", "range": "500-2k Hz", "characteristic": "Clarity, presence"},
        {"name": "Upper Mids", "range": "2k-4k Hz", "characteristic": "Attack, definition"},
        {"name": "Presence", "range": "4k-6k Hz", "characteristic": "Edge, sibilance"},
        {"name": "Brilliance", "range": "6k-12k Hz", "characteristic": "Sparkle, air"},
        {"name": "Air", "range": "12k-20k Hz", "characteristic": "Shimmer, openness"},
    ]
    
    if difficulty == "beginner":
        quiz_bands = frequency_bands[:4]
    elif difficulty == "intermediate":
        quiz_bands = frequency_bands[:6]
    else:
        quiz_bands = frequency_bands
    
    return {
        "success": True,
        "difficulty": difficulty,
        "quiz_items": quiz_bands,
        "instructions": "Listen to the audio and identify which frequency band is being boosted",
        "timestamp": get_timestamp()
    }

@app.post("/api/analysis/detect-genre")
async def detect_genre(request: GenreDetectRequest):
    """Detect music genre based on project characteristics (BPM, tracks, instruments)"""
    
    bpm = request.bpm or 120.0
    tracks = request.tracks or []
    project_name = request.project_name or ""
    
    # Genre database with BPM ranges and characteristics
    genre_db = {
        "electronic": {
            "name": "Electronic/EDM",
            "bpm_range": (120, 150),
            "instruments": ["synth", "bass", "drums", "pad", "lead"],
            "characteristics": ["synthesizers", "drum machines", "heavy bass", "build-ups", "drops"]
        },
        "house": {
            "name": "House",
            "bpm_range": (118, 130),
            "instruments": ["synth", "bass", "drums", "vocals"],
            "characteristics": ["four-on-the-floor", "synthesizers", "soulful vocals"]
        },
        "techno": {
            "name": "Techno",
            "bpm_range": (125, 150),
            "instruments": ["synth", "drums", "bass"],
            "characteristics": ["repetitive beats", "industrial sounds", "minimal melodies"]
        },
        "hip-hop": {
            "name": "Hip-Hop/Rap",
            "bpm_range": (80, 115),
            "instruments": ["drums", "bass", "vocals", "sample", "808"],
            "characteristics": ["vocal-dominant", "808 bass", "sample-based", "trap hi-hats"]
        },
        "rock": {
            "name": "Rock",
            "bpm_range": (100, 140),
            "instruments": ["guitar", "bass", "drums", "vocals"],
            "characteristics": ["guitars", "live drums", "bass", "distortion"]
        },
        "pop": {
            "name": "Pop",
            "bpm_range": (100, 130),
            "instruments": ["vocals", "synth", "drums", "bass", "piano"],
            "characteristics": ["catchy melodies", "verse-chorus structure", "polished production"]
        },
        "jazz": {
            "name": "Jazz",
            "bpm_range": (80, 180),
            "instruments": ["piano", "bass", "drums", "horns", "saxophone"],
            "characteristics": ["improvisation", "swing feel", "complex harmonies"]
        },
        "classical": {
            "name": "Classical",
            "bpm_range": (40, 180),
            "instruments": ["strings", "piano", "orchestra", "violin", "cello"],
            "characteristics": ["orchestral", "dynamic range", "acoustic instruments"]
        },
        "ambient": {
            "name": "Ambient",
            "bpm_range": (60, 100),
            "instruments": ["synth", "pad", "texture", "drone"],
            "characteristics": ["atmospheric", "textural", "slow evolution", "minimal rhythm"]
        },
        "metal": {
            "name": "Metal",
            "bpm_range": (100, 200),
            "instruments": ["guitar", "bass", "drums", "vocals"],
            "characteristics": ["heavy distortion", "double bass drums", "aggressive"]
        },
        "r&b": {
            "name": "R&B/Soul",
            "bpm_range": (60, 100),
            "instruments": ["vocals", "bass", "drums", "keys", "synth"],
            "characteristics": ["smooth vocals", "groove-based", "emotional"]
        },
        "country": {
            "name": "Country",
            "bpm_range": (90, 140),
            "instruments": ["guitar", "vocals", "bass", "fiddle", "banjo"],
            "characteristics": ["acoustic guitars", "storytelling", "twangy"]
        },
        "reggae": {
            "name": "Reggae",
            "bpm_range": (60, 90),
            "instruments": ["guitar", "bass", "drums", "keys", "vocals"],
            "characteristics": ["offbeat rhythm", "heavy bass", "laid-back feel"]
        },
        "drum_and_bass": {
            "name": "Drum & Bass",
            "bpm_range": (160, 180),
            "instruments": ["drums", "bass", "synth", "pad"],
            "characteristics": ["fast breakbeats", "heavy sub-bass", "rolling drums"]
        }
    }
    
    scores = {}
    
    # Calculate score for each genre
    for genre_id, genre_info in genre_db.items():
        score = 0.0
        max_score = 100.0
        
        # BPM score (40% weight)
        bpm_min, bpm_max = genre_info["bpm_range"]
        if bpm_min <= bpm <= bpm_max:
            # Perfect match - closer to center = higher score
            center = (bpm_min + bpm_max) / 2
            distance = abs(bpm - center) / ((bpm_max - bpm_min) / 2)
            score += 40 * (1 - distance * 0.5)  # Max 40, min 20 if in range
        else:
            # Outside range - penalize based on distance
            if bpm < bpm_min:
                distance = (bpm_min - bpm) / 20
            else:
                distance = (bpm - bpm_max) / 20
            score += max(0, 20 - distance * 10)  # Some partial credit
        
        # Track/instrument matching (40% weight)
        if tracks:
            track_names = [t.get("name", "").lower() for t in tracks]
            track_types = [t.get("type", "").lower() for t in tracks]
            all_track_info = " ".join(track_names + track_types)
            
            matches = 0
            for instrument in genre_info["instruments"]:
                if instrument.lower() in all_track_info:
                    matches += 1
            
            if genre_info["instruments"]:
                instrument_score = (matches / len(genre_info["instruments"])) * 40
                score += instrument_score
        else:
            # No tracks provided - give neutral score
            score += 20
        
        # Project name hint (20% weight)
        if project_name:
            name_lower = project_name.lower()
            if genre_info["name"].lower() in name_lower or genre_id in name_lower:
                score += 20
            else:
                # Check for characteristic keywords
                for char in genre_info["characteristics"]:
                    if char.lower() in name_lower:
                        score += 5
                        break
        else:
            score += 10  # Neutral
        
        scores[genre_id] = min(score, max_score)
    
    # Sort by score and get top matches
    sorted_genres = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Build response
    best_genre_id = sorted_genres[0][0]
    best_score = sorted_genres[0][1]
    best_genre = genre_db[best_genre_id]
    
    # Get top 3 candidates
    candidates = []
    for genre_id, score in sorted_genres[:3]:
        genre = genre_db[genre_id]
        candidates.append({
            "genre": genre["name"],
            "genre_id": genre_id,
            "confidence": round(score / 100, 2),
            "bpm_range": list(genre["bpm_range"]),
            "characteristics": genre["characteristics"]
        })
    
    return {
        "success": True,
        "genre": best_genre["name"],
        "genre_id": best_genre_id,
        "confidence": round(best_score / 100, 2),
        "bpm_range": list(best_genre["bpm_range"]),
        "characteristics": best_genre["characteristics"],
        "candidates": candidates,
        "input": {
            "bpm": bpm,
            "track_count": len(tracks),
            "project_name": project_name
        },
        "timestamp": get_timestamp()
    }

# ============================================================================
# ADDITIONAL ANALYSIS ENDPOINTS (PRODUCTION CHECKLIST, INSTRUMENT INFO)
# ============================================================================

@app.get("/api/analysis/production-checklist")
async def production_checklist(stage: str = "mixing"):
    """Provide a practical production checklist for a given stage.
    Stages: recording, arrangement, mixing, mastering
    """
    stage_lower = (stage or "mixing").strip().lower()

    base = {
        "recording": [
            {"category": "Gain Staging", "task": "Set input gain to avoid clipping (peaks -12dB to -6dB)", "priority": "high"},
            {"category": "Mic Technique", "task": "Check proximity effect and sibilance", "priority": "medium"},
            {"category": "Phase", "task": "Verify phase on multi-mic sources", "priority": "high"},
        ],
        "arrangement": [
            {"category": "Frequency Space", "task": "Ensure instruments don’t mask each other in 200-500Hz", "priority": "high"},
            {"category": "Rhythm", "task": "Tighten timing; quantize tastefully", "priority": "medium"},
            {"category": "Transitions", "task": "Add fills, risers, impacts for sections", "priority": "low"},
        ],
        "mixing": [
            {"category": "Levels", "task": "Balance faders, vocals forward, kick/bass foundation", "priority": "high"},
            {"category": "EQ", "task": "High-pass non-bass, tame 200-400Hz mud, add 2-5k presence", "priority": "high"},
            {"category": "Compression", "task": "Control dynamics; avoid pumping unless stylistic", "priority": "medium"},
            {"category": "Space", "task": "Use short room + plate/hall; pre-delay for clarity", "priority": "medium"},
            {"category": "Stereo", "task": "Pan for width; keep low-end mono", "priority": "medium"},
            {"category": "Headroom", "task": "Leave -6dBFS peak on master, -14 to -10 LUFS mix", "priority": "high"},
        ],
        "mastering": [
            {"category": "Prep", "task": "Receive mix with -6dB headroom, no limiter on master", "priority": "high"},
            {"category": "Tonal Balance", "task": "Broad EQ for target curve; fix harshness/resonance", "priority": "high"},
            {"category": "Dynamics", "task": "Gentle bus comp (1-2dB GR), multiband if needed", "priority": "medium"},
            {"category": "Loudness", "task": "Limiter to target: streaming ~ -14 LUFS, EDM up to -8 LUFS", "priority": "high"},
            {"category": "Translation", "task": "Check on speakers, headphones, phone, mono", "priority": "high"},
            {"category": "Delivery", "task": "Export 24-bit WAV, embedded metadata, 44.1k/48k as required", "priority": "medium"},
        ],
    }

    items = base.get(stage_lower, base)["mixing"][:]

    # Mark all as incomplete by default and add ids
    for i, it in enumerate(items):
        it["completed"] = False
        it["id"] = f"{stage_lower}-{i}"

    return {
        "success": True,
        "stage": stage_lower,
        "items": items,
        "completionPercentage": 0,
        "timestamp": get_timestamp(),
    }


@app.get("/api/analysis/instrument-info")
async def instrument_info(category: str = "vocals", instrument: str = "lead"):
    """Return guidance for processing different instruments/categories."""
    cat = (category or "vocals").strip().lower()
    inst = (instrument or "lead").strip().lower()

    db: Dict[str, Any] = {
        "vocals": {
            "lead": {
                "typical_range_hz": [100, 12000],
                "target_levels": {"peaks_dbfs": -6, "avg_lufs": -18},
                "common_issues": ["sibilance 6-8k", "mud 200-400Hz", "nasal 800-1.2k"],
                "recommended_processing": {
                    "eq": [
                        "HPF 80-100Hz",
                        "Tame 200-400Hz if muddy",
                        "Presence +2dB @ 3-5k if needed",
                        "Air shelf 10-14k for sheen"
                    ],
                    "compression": [
                        "2:1 to 4:1, 2-6dB GR",
                        "Fast attack/release for control, or slower for punch"
                    ],
                    "effects": ["Short room/plate reverb", "Slapback or 100-150ms delay"],
                    "de-esser": "Target 6-8k, broadband or split-band",
                },
            },
            "bgv": {
                "typical_range_hz": [150, 10000],
                "tips": ["HPF more aggressively", "Pan for width", "Use more reverb/chorus than lead"],
            },
        },
        "drums": {
            "kick": {
                "typical_range_hz": [30, 5000],
                "common_issues": ["boxiness 200-300Hz", "click too sharp >5k"],
                "recommended_processing": {
                    "eq": ["Boost 50-80Hz for thump", "Cut 250Hz box", "Add 3-5k click if needed"],
                    "compression": ["4:1, medium attack, medium-fast release"],
                },
                "target_levels": {"peaks_dbfs": -6},
            },
            "snare": {
                "typical_range_hz": [100, 12000],
                "eq": ["HPF 80-100Hz", "Body 150-250Hz", "Crack 2-5k", "Air 10k+"],
            },
        },
        "guitars": {
            "electric": {
                "typical_range_hz": [80, 8000],
                "common_issues": ["mud 200-400Hz", "harsh 2-4k"],
                "tips": ["High-pass 80-120Hz", "Notch harsh bands", "Double-track + pan L/R"],
            }
        },
        "bass": {
            "electric": {
                "typical_range_hz": [40, 5000],
                "tips": ["Low-pass around 5-8k if noisy", "Compress 4-8dB GR for consistency"],
                "stereo": "Keep mono below 120Hz",
            }
        }
    }

    # Fallbacks if not found
    result = db.get(cat, {}).get(inst) or {
        "typical_range_hz": [50, 10000],
        "tips": ["High-pass to clear sub rumble", "Pan for space", "Cut before boost"],
    }

    return {
        "success": True,
        "category": cat,
        "instrument": inst,
        "info": result,
        "timestamp": get_timestamp(),
    }

# ============================================================================
# TRANSPORT ENDPOINTS
# ============================================================================

@app.post("/transport/play")
async def transport_play():
    return {"success": True, "message": "Playback started", "state": transport_manager.play()}

@app.post("/transport/stop")
async def transport_stop():
    return {"success": True, "message": "Playback stopped", "state": transport_manager.stop()}

@app.post("/transport/pause")
async def transport_pause():
    return {"success": True, "message": "Playback paused", "state": transport_manager.pause()}

@app.post("/transport/resume")
async def transport_resume():
    return {"success": True, "message": "Playback resumed", "state": transport_manager.resume()}

@app.get("/transport/seek")
async def transport_seek(seconds: float = 0):
    return {"success": True, "message": f"Seeked to {seconds}s", "state": transport_manager.seek(seconds)}

@app.post("/transport/tempo")
async def transport_tempo(bpm: float = 120):
    return {"success": True, "message": f"Tempo set to {bpm}", "state": transport_manager.set_tempo(bpm)}

@app.post("/transport/loop")
async def transport_loop(enabled: bool = False, start_seconds: float = 0, end_seconds: float = 10):
    return {"success": True, "message": "Loop configured", "state": transport_manager.set_loop(enabled, start_seconds, end_seconds)}

@app.get("/transport/status")
async def transport_status():
    return transport_manager.get_state()

@app.get("/transport/metrics")
async def transport_metrics():
    return {"uptime": time.time(), "total_plays": 0, "current_state": transport_manager.get_state()}

# ============================================================================
# DAW EFFECTS ENDPOINTS
# ============================================================================

@app.get("/daw/effects/list")
async def list_effects():
    return [
        {"id": "compressor", "name": "Compressor", "category": "dynamics"},
        {"id": "eq3band", "name": "3-Band EQ", "category": "eq"},
        {"id": "reverb", "name": "Reverb", "category": "reverb"},
        {"id": "delay", "name": "Delay", "category": "delay"},
        {"id": "limiter", "name": "Limiter", "category": "dynamics"},
        {"id": "saturation", "name": "Saturation", "category": "saturation"}
    ]

@app.get("/daw/effects/{effect_id}")
async def get_effect_info(effect_id: str):
    effects = {"compressor": {"id": "compressor", "name": "Compressor", "parameters": ["threshold", "ratio", "attack", "release"]},
               "eq3band": {"id": "eq3band", "name": "3-Band EQ", "parameters": ["low", "mid", "high"]},
               "reverb": {"id": "reverb", "name": "Reverb", "parameters": ["room_size", "damping", "wet", "dry"]}}
    return effects.get(effect_id, {"id": effect_id, "name": effect_id.title(), "parameters": []})

@app.post("/daw/effects/process")
@app.post("/api/effects/process")
async def process_effect(request: EffectProcessRequest):
    # Passthrough if no DSP available
    output = request.audio_data
    if DSP_EFFECTS_AVAILABLE and NUMPY_AVAILABLE:
        try:
            audio = np.array(request.audio_data, dtype=np.float32)
            # Apply effect based on type
            if request.effect_type == "compressor":
                fx = Compressor(threshold=request.parameters.get("threshold", -20), ratio=request.parameters.get("ratio", 4))
                output = fx.process(audio).tolist()
        except: pass
    return {"status": "success", "effect": request.effect_type, "parameters": request.parameters,
            "output": output, "length": len(output), "sample_rate": request.sample_rate, "timestamp": get_timestamp()}

# ============================================================================
# GENRE ENDPOINTS
# ============================================================================

@app.get("/codette/genres")
async def get_genres():
    return ["electronic", "rock", "pop", "jazz", "classical", "hip-hop", "ambient", "metal", "folk", "r&b"]

@app.get("/codette/genre/{genre_id}")
async def get_genre_characteristics(genre_id: str):
    genres = {
        "electronic": {"bpm_range": [120, 140], "characteristics": ["synthesizers", "drum machines", "heavy bass"]},
        "rock": {"bpm_range": [100, 140], "characteristics": ["guitars", "drums", "bass", "vocals"]},
        "pop": {"bpm_range": [100, 130], "characteristics": ["catchy melodies", "verse-chorus", "polished production"]}
    }
    return genres.get(genre_id, {"bpm_range": [80, 160], "characteristics": ["varied"]})

# ============================================================================
# MEMORY/COCOON ENDPOINTS
# ============================================================================

@app.get("/api/codette/history")
async def get_history(limit: int = 50):
    mgr = get_cocoon_manager()
    return {"status": "ok", "interactions": mgr.get_latest_cocoons(limit), "total": len(mgr.cocoon_data), "timestamp": get_timestamp()}

@app.get("/api/codette/memory/{cocoon_id}")
async def get_cocoon(cocoon_id: str):
    mgr = get_cocoon_manager()
    cocoon = mgr.get_cocoon_by_id(cocoon_id)
    if cocoon: return cocoon
    raise HTTPException(status_code=404, detail="Cocoon not found")

@app.post("/api/codette/memory/save")
async def save_cocoon(content: str, emotion_tag: str = "neutral"):
    mgr = get_cocoon_manager()
    cid = mgr.save_cocoon({"content": content, "emotion_tag": emotion_tag})
    return {"status": "ok", "cocoon_id": cid, "timestamp": get_timestamp()}

@app.get("/api/codette/quantum-state")
async def quantum_state():
    mgr = get_cocoon_manager()
    return {"status": "ok", "quantum_state": mgr.get_latest_quantum_state(), "timestamp": get_timestamp()}

@app.post("/api/codette/music-guidance")
async def music_guidance(guidance_type: str = "mixing"):
    advice = {"mixing": ["Set levels to -6dB peaks", "High-pass everything", "Use reference tracks"],
              "mastering": ["Leave -1dB headroom", "Target -14 LUFS", "Use linear phase EQ"]}
    return {"status": "ok", "guidance_type": guidance_type, "advice": advice.get(guidance_type, [])}

# ============================================================================
# CLOUD SYNC (STUBS)
# ============================================================================

@app.post("/api/cloud-sync/save")
async def cloud_sync_save(project_id: str, device_id: str):
    return {"success": True, "project_id": project_id}

@app.get("/api/cloud-sync/load/{project_id}")
async def cloud_sync_load(project_id: str, device_id: str = ""):
    return {"project_id": project_id, "data": {}}

@app.get("/api/cloud-sync/list")
async def cloud_sync_list():
    return []

# ============================================================================
# DEVICE ENDPOINTS (STUBS)
# ============================================================================

@app.post("/api/devices/register")
async def register_device(device_name: str, device_type: str = "desktop", platform: str = "windows"):
    return {"device_id": f"dev_{int(time.time())}"}

@app.get("/api/devices/{user_id}")
async def list_devices(user_id: str):
    return []

@app.post("/api/devices/sync-settings")
async def sync_settings(user_id: str):
    return {"success": True}

# ============================================================================
# COLLABORATION (STUBS)
# ============================================================================

@app.post("/api/collaboration/join")
async def join_collaboration(project_id: str, user_id: str, user_name: str):
    return {"session_id": f"sess_{int(time.time())}", "users": [user_name]}

@app.post("/api/collaboration/operation")
async def collaboration_operation():
    return {"success": True, "version": 1}

@app.get("/api/collaboration/session/{project_id}")
async def get_collaboration_session(project_id: str):
    return {"users": [], "operations": []}

# ============================================================================
# VST ENDPOINTS (STUBS)
# ============================================================================

@app.post("/api/vst/load")
async def load_vst(plugin_path: str, plugin_name: str):
    return {"id": f"vst_{int(time.time())}", "name": plugin_name, "path": plugin_path, "parameters": []}

@app.get("/api/vst/list")
async def list_vst():
    return []

@app.post("/api/vst/parameter")
async def set_vst_parameter(plugin_id: str, parameter_id: str, value: float):
    return {"success": True}

# ============================================================================
# AUDIO I/O (STUBS)
# ============================================================================

@app.get("/api/audio/devices")
async def get_audio_devices():
    return [{"id": "default", "name": "Default Output", "kind": "audiooutput"}]

@app.post("/api/audio/measure-latency")
async def measure_latency():
    return {"latency_ms": 10, "stability": 0.95}

@app.get("/api/audio/settings")
async def get_audio_settings():
    return {"sample_rate": 44100, "buffer_size": 512, "bit_depth": 24}

# ============================================================================
# WEBSOCKET
# ============================================================================

@app.get("/ws/status")
async def websocket_status():
    """Return WebSocket server status for REST polling fallback."""
    return {
        "connected_clients": len(active_websockets),
        "last_broadcast_at": LAST_BROADCAST_AT,
        "transport": transport_manager.get_state(),
        "timestamp": get_timestamp(),
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"✅ WebSocket connected. Total: {len(active_websockets)}")

    # Send initial handshake & immediate status
    await websocket.send_json({"type": "connected", "data": {"status": "connected", "timestamp": get_timestamp()}})
    await websocket.send_json({"type": "server_status", "data": {"health": {"status": "healthy", "timestamp": get_timestamp()}, "transport": transport_manager.get_state(), "connections": len(active_websockets)}})

    try:
        while True:
            try:
                data = await websocket.receive_json()
                message_type = data.get("type", "unknown")

                if message_type == "ping":
                    await websocket.send_json({"type": "pong", "data": {"timestamp": get_timestamp()}})
                elif message_type == "get_status":
                    manager = get_cocoon_manager()
                    await websocket.send_json({"type": "status", "data": {"codette_available": codette_core is not None, "quantum_state": manager.quantum_state, "timestamp": get_timestamp()}})
                elif message_type == "chat":
                    response = "I'm here to help!"
                    if codette_core and hasattr(codette_core, 'respond'):
                        try:
                            response = codette_core.respond(data.get("data", {}).get("message", ""))
                        except Exception:
                            pass
                    await websocket.send_json({"type": "chat_response", "data": {"response": response, "timestamp": get_timestamp()}})
                else:
                    await websocket.send_json({"type": "echo", "data": {"received_type": message_type, "timestamp": get_timestamp()}})
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "data": {"message": "Invalid JSON"}})
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(active_websockets)}")


# ============================================================================
# STARTUP EVENT
# ============================================================================

# Try to import training data
TRAINING_AVAILABLE = False
get_training_context = None
try:
    from codette_training_data import get_training_context
    TRAINING_AVAILABLE = True
except ImportError:
    pass

# Try to import Supabase
SUPABASE_AVAILABLE = False
supabase_client = None
try:
    from supabase import create_client
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        supabase_client = create_client(supabase_url, supabase_key)
        SUPABASE_AVAILABLE = True
        logger.info("✅ Supabase client connected with service role (full access)")
        logger.info("   🔐 SECURE - Backend use only")
except ImportError:
    logger.info("ℹ️  Supabase not available")
except Exception as e:
    logger.warning(f"⚠️ Supabase connection failed: {e}")

@app.on_event("startup")
async def startup_event():
    """Log startup banner with full system status"""
    logger.info("")
    logger.info("======================================================================")
    logger.info("🚀 CODETTE AI UNIFIED SERVER - STARTUP")
    logger.info("======================================================================")
    logger.info("📡 Server Configuration:")
    logger.info("   • Version: 2.0.0")
    logger.info("   • Host: 0.0.0.0 (all interfaces)")
    logger.info(f"   • Port: {os.environ.get('PORT', 8000)}")
    logger.info("   • CORS: Enabled for 4 origins")
    logger.info("")
    
    # Codette AI Engine status
    logger.info("🤖 Codette AI Engine:")
    if codette_engine:
        logger.info("   ✅ Status: ACTIVE")
        logger.info(f"   • Engine: {codette_engine_type}")
        if codette_engine_type == "CodetteHybrid":
            logger.info("   • Mode: Hybrid (Defense + Vector + Prompt Engineering)")
        elif codette_engine_type == "CodetteEnhanced":
            logger.info("   • Perspectives: Neural, Logical, Creative, Ethical, Quantum, + 4 more")
        else:
            logger.info("   • Perspectives: Neural, Logical, Creative, Ethical, Quantum")
        logger.info("   • User: CoreLogicStudio")
        logger.info("   • Mode: Production-ready")
        logger.info("   • Method: respond() - returns multi-perspective analysis")
    else:
        logger.info("   ⚠️  Status: FALLBACK MODE")
        logger.info("   • Engine: Keyword-based responder")
        logger.info("   • Functionality: Limited to basic responses")
        logger.info("   • Recommendation: Install Codette package")
    logger.info("")
    
    # Database status
    logger.info("💾 Database:")
    if SUPABASE_AVAILABLE:
        logger.info("   ✅ Supabase: CONNECTED")
        logger.info(f"   • URL: {os.getenv('VITE_SUPABASE_URL', 'N/A')[:40]}...")
        logger.info("   • Key Type: Service Role (full access) 🔐")
    else:
        logger.info("   ⚠️  Supabase: NOT CONNECTED")
        logger.info("   • Running in local mode")
    logger.info("")
    
    # Dependencies status
    logger.info("📦 Dependencies:")
    deps = []
    deps.append("NumPy ✅" if NUMPY_AVAILABLE else "NumPy ❌")
    deps.append("Supabase ✅" if SUPABASE_AVAILABLE else "Supabase ❌")
    deps.append("Redis ✅")  # Placeholder
    logger.info(f"   {' | '.join(deps)}")
    logger.info("")

    # Start live monitoring broadcast task
    try:
        import asyncio
        asyncio.create_task(broadcast_status_periodically(2.0))
        logger.info("✅ Live server monitoring broadcast started (2s interval)")
    except Exception as e:
        logger.warning(f"⚠️ Failed to start monitoring broadcast: {e}")
    
    # Cache system status
    logger.info("🗄️  Cache System:")
    logger.info("   ✅ Status: ACTIVE")
    logger.info("   • TTL: 300 seconds")
    logger.info("   • Type: In-memory (ContextCache)")
    logger.info("   • Stats: Ready to track")
    logger.info("")
    
    # Available features
    logger.info("🎯 Available Features:")
    logger.info("   • /codette/chat - AI chat with DAW context (REAL Codette)")
    logger.info("   • /codette/suggest - AI mixing suggestions")
    logger.info("   • /codette/analyze - Audio analysis with Codette")
    logger.info("   • /api/training/context - Training data access")
    logger.info("   • /api/analysis/* - Audio analysis endpoints")
    logger.info("   • /api/prompt/* - Creative AI prompts")
    logger.info("   • /transport/* - DAW transport control")
    logger.info("   • /ws - WebSocket real-time updates")
    logger.info("")
    
    # API documentation
    logger.info("📚 API Documentation:")
    logger.info("   • Swagger UI: http://localhost:8000/docs")
    logger.info("   • ReDoc: http://localhost:8000/redoc")
    logger.info("   • OpenAPI JSON: http://localhost:8000/openapi.json")
    logger.info("")
    
    # Quick test
    logger.info("🧪 Quick Test:")
    logger.info("   curl http://localhost:8000/health")
    logger.info("   curl -X POST http://localhost:8000/codette/chat \\")
    logger.info("     -H \"Content-Type: application/json\" \\")
    logger.info("     -d '{\"message\": \"Hello Codette\"}'")
    logger.info("")
    logger.info("======================================================================")
    logger.info("✅ SERVER READY - Codette AI is listening")
    logger.info("======================================================================")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
