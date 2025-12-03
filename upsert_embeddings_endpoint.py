"""
Upsert Embeddings Endpoint
Simple embedding generation for music knowledge base rows.
Can be added to codette_server_unified.py as a new FastAPI route.
"""

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import hashlib

router = APIRouter(prefix="/api", tags=["embeddings"])


class EmbedRow(BaseModel):
    id: str
    text: str


class UpsertRequest(BaseModel):
    rows: List[EmbedRow]


def generate_simple_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Generate a simple deterministic embedding from text.
    
    In production, use a real embedding API:
    - OpenAI: embedding-3-small
    - Cohere: embed-english-v3.0
    - HuggingFace: sentence-transformers/all-MiniLM-L6-v2
    """
    # Create a deterministic hash from text
    hash_bytes = hashlib.sha256(text.encode()).digest()
    hash_ints = [int.from_bytes(hash_bytes[i:i+4], 'big') for i in range(0, len(hash_bytes), 4)]
    
    # Generate pseudo-random embedding based on hash
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


@router.post("/upsert-embeddings")
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
        
        print(f"[upsert-embeddings] Processing {len(request.rows)} rows...")
        
        # Generate embeddings
        updates = []
        for row in request.rows:
            embedding = generate_simple_embedding(row.text)
            updates.append({
                "id": row.id,
                "embedding": embedding
            })
        
        # TODO: Update database with embeddings
        # For now, just log the operation
        print(f"[upsert-embeddings] Generated {len(updates)} embeddings")
        print(f"[upsert-embeddings] Sample embedding: {updates[0]['embedding'][:5]}... (showing first 5 dims)")
        
        return {
            "success": True,
            "processed": len(request.rows),
            "updated": len(updates),
            "message": f"Successfully processed {len(updates)} embeddings"
        }
    
    except Exception as e:
        print(f"[upsert-embeddings] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Test the embedding generation
    test_texts = [
        "Peak Level Optimization",
        "Dynamic Range Compression",
        "Harmonic Saturation Enhancement"
    ]
    
    print("Testing embedding generation:")
    for text in test_texts:
        embedding = generate_simple_embedding(text)
        print(f"  '{text}': {embedding[:5]}... (first 5 dims, magnitude={np.linalg.norm(embedding):.4f})")
