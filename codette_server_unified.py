#!/usr/bin/env python
"""
Codette AI Unified Server
Combined FastAPI server for CoreLogic Studio DAW integration
Includes both standard endpoints and production-optimized features
"""

# FIRST: Set environment to suppress PyTensor warnings BEFORE any imports
import os
os.environ["PYTENSOR_FLAGS"] = "device=cpu,floatX=float32,cxx="
os.environ["ARVIZ_DATA"] = ""  # Suppress arviz data warnings

import sys
import json
import logging
import asyncio
import time
import traceback
import hashlib
import uuid
import warnings
from pathlib import Path
from typing import Optional, Dict, Any, List, Set
from datetime import datetime, timezone
from functools import lru_cache
from pydantic import BaseModel

# Suppress all non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("pytensor").setLevel(logging.ERROR)
logging.getLogger("arviz").setLevel(logging.ERROR)

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
    logger.info("✅ DSP effects library loaded successfully")
except ImportError as dsp_error:
    DSP_EFFECTS_AVAILABLE = False
    logger.warning(f"⚠️  DSP effects not available: {dsp_error}")

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

# ============================================================================
# CONSTANTS
# ============================================================================

MOCK_QUANTUM_STATE = {
    "coherence": 0.87,
    "entanglement": 0.65,
    "resonance": 0.72,
    "phase": 1.5707963267948966,
    "fluctuation": 0.07
}

# WebSocket connections tracking
active_websockets: List[Any] = []

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Unified Server",
    description="Backend server for CoreLogic Studio DAW with Codette AI",
    version="2.0.0"
)

# Enable CORS for React frontend
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

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_timestamp() -> str:
    """Get ISO timestamp for responses"""
    return datetime.now(timezone.utc).isoformat()

# ============================================================================
# HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "Codette AI Unified Server",
        "version": "2.0.0",
        "codette_available": codette_core is not None,
        "timestamp": get_timestamp()
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Codette AI Unified Server",
        "codette_available": codette_core is not None,
        "timestamp": get_timestamp()
    }

# ============================================================================
# LEGACY CODETTE ENDPOINTS (Without /api prefix - for frontend compatibility)
# ============================================================================

@app.get("/codette/status")
async def codette_status():
    """
    Get Codette AI status including transport state (legacy endpoint)
    Frontend codetteBridge.ts calls this endpoint for getTransportState()
    """
    try:
        memory_size = 0
        if codette_core and hasattr(codette_core, 'memory'):
            memory_size = len(codette_core.memory) if codette_core.memory else 0
        
        return {
            "status": "active",
            "codette_available": codette_core is not None,
            "engine_type": type(codette_core).__name__ if codette_core else "None",
            "memory_size": memory_size,
            "quantum_state": MOCK_QUANTUM_STATE,
            "active_connections": len(active_websockets),
            # Transport state fields for frontend compatibility
            "is_playing": False,
            "current_time": 0,
            "bpm": 120,
            "time_signature": [4, 4],
            "loop_enabled": False,
            "loop_start": 0,
            "loop_end": 10,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"ERROR in /codette/status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/codette/suggest")
async def codette_suggest(request: SuggestionRequest):
    """
    Get AI suggestions for mixing, mastering, or general production (legacy endpoint)
    Frontend codetteBridge.ts and useCodette.ts call this endpoint
    """
    try:
        suggestions = []
        context_type = request.context.get("type", "general") if request.context else "general"
        
        # Generate context-aware suggestions
        if context_type == "gain-staging":
            suggestions = [
                {
                    "type": "optimization",
                    "title": "Peak Level Optimization",
                    "description": "Maintain -3dB headroom as per industry standard",
                    "confidence": 0.92,
                    "source": "MIXING_STANDARDS"
                },
                {
                    "type": "optimization",
                    "title": "Clipping Prevention",
                    "description": "Ensure no signal exceeds 0dBFS to prevent digital clipping",
                    "confidence": 0.95,
                    "source": "MIXING_STANDARDS"
                },
            ]
        elif context_type == "mixing":
            suggestions = [
                {
                    "type": "effect",
                    "title": "EQ for Balance",
                    "description": "Apply EQ to balance frequency content - use low/mid/high energy distribution",
                    "confidence": 0.88,
                    "source": "PLUGIN_CATEGORIES"
                },
                {
                    "type": "routing",
                    "title": "Bus Architecture",
                    "description": "Create buses for drum group, bass, guitars, vocals - improves mix control",
                    "confidence": 0.85,
                    "source": "MIXING_STANDARDS"
                },
                {
                    "type": "effect",
                    "title": "Compression for Cohesion",
                    "description": "Use gentle compression (4:1 ratio) to glue tracks together",
                    "confidence": 0.82,
                    "source": "PLUGIN_CATEGORIES"
                },
            ]
        elif context_type == "mastering":
            suggestions = [
                {
                    "type": "optimization",
                    "title": "Loudness Target",
                    "description": "Target -14 LUFS for streaming platforms (Spotify, Apple Music standard)",
                    "confidence": 0.93,
                    "source": "MIXING_STANDARDS"
                },
                {
                    "type": "effect",
                    "title": "Linear Phase EQ",
                    "description": "Use linear phase EQ in mastering to avoid phase distortion",
                    "confidence": 0.87,
                    "source": "PLUGIN_CATEGORIES"
                },
                {
                    "type": "optimization",
                    "title": "Headroom Margin",
                    "description": "Leave -1dB to -2dB headroom below 0dBFS for streaming",
                    "confidence": 0.90,
                    "source": "MIXING_STANDARDS"
                },
            ]
        else:
            # General suggestions for all contexts
            suggestions = [
                {
                    "type": "optimization",
                    "title": "Gain Optimization",
                    "description": "Maintain proper gain levels throughout the signal chain for optimal quality",
                    "confidence": 0.85,
                    "source": "TRAINING_DATA"
                },
                {
                    "type": "mixing",
                    "title": "Frequency Balance",
                    "description": "Check low/mid/high frequency balance for a clear mix",
                    "confidence": 0.80,
                    "source": "MIXING_STANDARDS"
                },
            ]
        
        # Limit results
        limit = request.limit or 5
        suggestions = suggestions[:limit]
        
        return SuggestionResponse(
            suggestions=suggestions,
            confidence=0.85
        )
    except Exception as e:
        logger.error(f"ERROR in /codette/suggest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/codette/chat")
async def codette_chat(request: ChatRequest):
    """
    Chat with Codette AI - passes DAW context for intelligent responses
    """
    try:
        response_text = "I'm Codette, your AI assistant for CoreLogic Studio. How can I help you with your audio production today?"
        confidence = 0.75
        source = "fallback"
        
        # Try to use real Codette if available
        if codette_core and hasattr(codette_core, 'respond'):
            try:
                # Pass DAW context to enhanced Codette for context-aware responses
                if request.daw_context:
                    response_text = codette_core.respond(request.message, request.daw_context)
                else:
                    response_text = codette_core.respond(request.message)
                confidence = 0.85
                source = "codette_enhanced" if CODETTE_ENHANCED else "codette_engine"
            except Exception as e:
                logger.warning(f"Codette respond failed: {e}")
                traceback.print_exc()
        
        return ChatResponse(
            response=response_text,
            perspective=request.perspective or "mix_engineering",
            confidence=confidence,
            timestamp=get_timestamp(),
            source=source
        )
    except Exception as e:
        logger.error(f"ERROR in /codette/chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    logger.info("🚀 Starting Codette AI Unified Server...")
    uvicorn.run(
        "codette_server_unified:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
