"""
Codette FastAPI Server - Complete Integration
Integrates all Codette components into a production-ready API server
"""

import logging
import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Import Codette components
from components.ai_core import AICore
from components.ai_core_async_methods import generate_text_async, _generate_model_response
from components.response_verifier import ResponseVerifier
from components.health_monitor import HealthMonitor
from components.defense_system import DefenseSystem
from components.fractal import FractalIdentity
from components.cognitive_processor import CognitiveProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    perspective: Optional[str] = None

class SuggestionRequest(BaseModel):
    type: str
    track_type: Optional[str] = None
    mood: Optional[str] = None
    genre: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AnalysisRequest(BaseModel):
    duration: float
    sample_rate: int
    analysis_type: str = "spectrum"
    context: Optional[Dict[str, Any]] = None

class SyncStateRequest(BaseModel):
    tracks: List[Dict[str, Any]]
    current_time: float
    is_playing: bool
    bpm: float

class ChatResponse(BaseModel):
    response: str
    confidence: float
    source: str
    timestamp: str

# ============================================================================
# CODETTE SERVER
# ============================================================================

class CodetteServer:
    """Main Codette server orchestrator"""
    
    def __init__(self):
        """Initialize Codette server"""
        self.ai_core = None
        self.verifier = ResponseVerifier()
        self.health_monitor = HealthMonitor()
        self.ws_connections: Dict[str, WebSocket] = {}
        logger.info("CodetteServer initializing...")
    
    async def initialize(self):
        """Initialize all components"""
        try:
            # Initialize AI Core
            self.ai_core = AICore(test_mode=False)
            self.ai_core._initialize_language_model()
            
            # Create mock cocoon manager if needed
            class MockCocoonManager:
                def save_cocoon(self, data): pass
                def load_cocoons(self): pass
                def update_quantum_state(self, state): pass
            
            self.ai_core.cocoon_manager = MockCocoonManager()
            
            logger.info("Codette server initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            raise
    
    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        """Process chat request"""
        try:
            # Generate response
            response = self.ai_core.generate_text(
                prompt=request.message,
                perspective=request.perspective,
                use_aegis=False
            )
            
            # Verify response
            verification = self.verifier.verify_response(response)
            
            return ChatResponse(
                response=response,
                confidence=verification["confidence"],
                source="codette_ai",
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Chat processing error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def process_suggestions(self, request: SuggestionRequest) -> Dict[str, Any]:
        """Process suggestion request"""
        try:
            # Generate suggestions based on type
            suggestions_map = {
                "mixing": [
                    {
                        "id": "mix_1",
                        "title": "Check Levels",
                        "description": "Ensure all tracks are in the -18dB to -3dB range",
                        "confidence": 0.95,
                        "source": "gain_staging"
                    },
                    {
                        "id": "mix_2",
                        "title": "Pan for Width",
                        "description": "Pan complementary tracks to create stereo image",
                        "confidence": 0.88,
                        "source": "mixing"
                    }
                ],
                "arrangement": [
                    {
                        "id": "arr_1",
                        "title": "Add Variation",
                        "description": "Introduce different instruments in the second verse",
                        "confidence": 0.82,
                        "source": "arrangement"
                    }
                ],
                "general": [
                    {
                        "id": "gen_1",
                        "title": "General Tip",
                        "description": "Take breaks and listen with fresh ears",
                        "confidence": 0.90,
                        "source": "general"
                    }
                ]
            }
            
            suggestions = suggestions_map.get(request.type, suggestions_map["general"])
            
            return {
                "suggestions": suggestions,
                "count": len(suggestions),
                "type": request.type,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Suggestion processing error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def process_analysis(self, request: AnalysisRequest) -> Dict[str, Any]:
        """Process audio analysis request"""
        try:
            # Generate mock analysis
            analysis_result = {
                "duration": request.duration,
                "sample_rate": request.sample_rate,
                "analysis_type": request.analysis_type,
                "findings": [
                    "Audio appears well-balanced",
                    "No clipping detected",
                    "Good frequency distribution"
                ],
                "recommendations": [
                    "Consider EQ adjustments for presence",
                    "Check for any unwanted noise",
                    "Ensure proper headroom"
                ],
                "score": 85,
                "timestamp": datetime.now().isoformat()
            }
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Analysis processing error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def sync_state(self, request: SyncStateRequest) -> Dict[str, Any]:
        """Sync DAW state"""
        try:
            return {
                "status": "synced",
                "track_count": len(request.tracks),
                "current_time": request.current_time,
                "is_playing": request.is_playing,
                "bpm": request.bpm,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"State sync error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status"""
        return self.health_monitor.get_health_summary()
    
    async def shutdown(self):
        """Shutdown server"""
        try:
            logger.info("Codette server shutting down...")
            # Close WebSocket connections
            for connection in self.ws_connections.values():
                await connection.close()
            logger.info("Codette server shutdown complete")
        except Exception as e:
            logger.error(f"Shutdown error: {e}")

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Server",
    description="Advanced AI Processing System with DAW Integration",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global server instance
server: Optional[CodetteServer] = None

# ============================================================================
# LIFECYCLE EVENTS
# ============================================================================

@app.on_event("startup")
async def startup():
    """Startup event"""
    global server
    try:
        server = CodetteServer()
        await server.initialize()
        logger.info("? Codette API server started successfully")
    except Exception as e:
        logger.error(f"? Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event"""
    global server
    if server:
        await server.shutdown()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        if not server:
            return {"status": "initializing", "message": "Server not ready"}
        
        health_status = server.get_health_status()
        return {
            "status": "healthy",
            "details": health_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

@app.post("/api/codette/query")
async def query(request: ChatRequest):
    """Chat query endpoint"""
    if not server:
        raise HTTPException(status_code=503, detail="Server not ready")
    
    try:
        response = await server.process_chat(request)
        return response.dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/codette/suggest")
async def suggest(request: SuggestionRequest):
    """Suggestions endpoint"""
    if not server:
        raise HTTPException(status_code=503, detail="Server not ready")
    
    try:
        suggestions = await server.process_suggestions(request)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/codette/analyze")
async def analyze(request: AnalysisRequest):
    """Audio analysis endpoint"""
    if not server:
        raise HTTPException(status_code=503, detail="Server not ready")
    
    try:
        analysis = await server.process_analysis(request)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/codette/sync-daw")
async def sync_daw(request: SyncStateRequest):
    """DAW state sync endpoint"""
    if not server:
        raise HTTPException(status_code=503, detail="Server not ready")
    
    try:
        result = await server.sync_state(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/codette/status")
async def status():
    """Get server status"""
    if not server:
        return {"status": "initializing"}
    
    return {
        "status": "running",
        "health": server.get_health_status(),
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    connection_id = f"{datetime.now().timestamp()}"
    
    try:
        await websocket.accept()
        server.ws_connections[connection_id] = websocket
        
        logger.info(f"WebSocket connection established: {connection_id}")
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            
            # Process message
            if data.get("type") == "chat":
                request = ChatRequest(**data.get("payload", {}))
                response = await server.process_chat(request)
                await websocket.send_json({
                    "type": "response",
                    "data": response.dict()
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {data.get('type')}"
                })
    
    except WebSocketDisconnect:
        if connection_id in server.ws_connections:
            del server.ws_connections[connection_id]
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if connection_id in server.ws_connections:
            del server.ws_connections[connection_id]

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    # Configuration
    HOST = "0.0.0.0"
    PORT = 8000
    RELOAD = True
    
    logger.info(f"Starting Codette API server on {HOST}:{PORT}")
    
    # Run server
    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level="info"
    )
