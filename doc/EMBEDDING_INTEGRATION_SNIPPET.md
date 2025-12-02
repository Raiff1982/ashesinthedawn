"""
Integration snippet for codette_server_unified.py
Add this to enable the /api/upsert-embeddings endpoint
"""

# ============================================================================
# ADD THESE IMPORTS AT THE TOP OF codette_server_unified.py
# ============================================================================

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import hashlib


# ============================================================================
# ADD THIS ROUTER SETUP SECTION
# ============================================================================

class EmbedRow(BaseModel):
    id: str
    text: str


class UpsertRequest(BaseModel):
    rows: List[EmbedRow]


embeddings_router = APIRouter(prefix="/api", tags=["embeddings"])


def generate_simple_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Generate a simple deterministic embedding from text.
    
    In production, replace with a real embedding API:
    - OpenAI: text-embedding-3-small
    - Cohere: embed-english-v3.0
    - HuggingFace: all-MiniLM-L6-v2
    """
    # Create a deterministic hash from text
    hash_bytes = hashlib.sha256(text.encode()).digest()
    hash_ints = [int.from_bytes(hash_bytes[i:i+4], 'big') for i in range(0, len(hash_bytes), 4)]
    
    # Generate pseudo-random embedding based on hash
    embedding = np.zeros(dim, dtype=np.float32)
    for i in range(dim):
        seed_val = hash_ints[i % len(hash_ints)] + i
        embedding[i] = np.sin(seed_val / 1000.0) * np.cos(seed_val / 2000.0)
    
    # Normalize to unit vector (L2 norm)
    magnitude = np.linalg.norm(embedding)
    if magnitude > 0:
        embedding = embedding / magnitude
    
    return embedding.tolist()


@embeddings_router.post("/upsert-embeddings")
async def upsert_embeddings(request: UpsertRequest):
    """
    Generate embeddings for music knowledge rows and update database.
    
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
            return {"error": "No rows provided"}, 400
        
        logger.info(f"[embeddings] Processing {len(request.rows)} rows")
        
        # Generate embeddings
        updates = []
        for row in request.rows:
            embedding = generate_simple_embedding(row.text)
            updates.append({
                "id": row.id,
                "embedding": embedding
            })
        
        logger.info(f"[embeddings] Generated {len(updates)} embeddings")
        
        # TODO: Update Supabase database with embeddings
        # When ready, uncomment and integrate:
        # try:
        #     response = supabase.table("music_knowledge").upsert(updates).execute()
        #     logger.info(f"[embeddings] Database update: {len(response.data)} rows")
        # except Exception as db_err:
        #     logger.error(f"[embeddings] Database error: {db_err}")
        #     return {"error": str(db_err)}, 500
        
        return {
            "success": True,
            "processed": len(request.rows),
            "updated": len(updates),
            "message": f"Successfully processed {len(updates)} embeddings"
        }
    
    except Exception as e:
        logger.error(f"[embeddings] Error: {e}")
        return {"error": str(e)}, 500


# ============================================================================
# ADD THIS IN YOUR APP SETUP (around line where you create FastAPI app)
# ============================================================================

# Include embeddings router
app.include_router(embeddings_router)

# This creates the endpoint: POST /api/upsert-embeddings


# ============================================================================
# TEST COMMAND (in Python terminal)
# ============================================================================

"""
# After restarting the server, test with:

import requests
import json

response = requests.post(
    "http://localhost:8000/api/upsert-embeddings",
    json={
        "rows": [
            {"id": "test-1", "text": "Peak Level Optimization"},
            {"id": "test-2", "text": "Dynamic Range Compression"}
        ]
    }
)

print(json.dumps(response.json(), indent=2))
# Expected output:
# {
#   "success": true,
#   "processed": 2,
#   "updated": 2,
#   "message": "Successfully processed 2 embeddings"
# }
"""
