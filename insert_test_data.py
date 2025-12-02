#!/usr/bin/env python3
"""
Insert test data into Supabase for Codette system testing
Inserts:
  1. Codette snippets (music_knowledge) with full-text search support
  2. Chat history with known user_id
  3. Chat messages with 1536-dim embeddings for vector queries
"""

import os
import json
import uuid
from datetime import datetime
from typing import List
from dotenv import load_dotenv

# Load environment
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Install with: pip install supabase")
    exit(1)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Support both prefixed and non-prefixed environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
    print("Expected in .env file:")
    print("  SUPABASE_URL=https://your-project.supabase.co")
    print("  SUPABASE_SERVICE_ROLE_KEY=your-service-key")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
print(f"✅ Connected to Supabase: {SUPABASE_URL}")

# ============================================================================
# SAMPLE 1536-DIMENSIONAL EMBEDDING
# ============================================================================

SAMPLE_EMBEDDING = [
    0.0234, -0.0156, 0.0891, -0.0432, 0.0678, -0.0345, 0.0523, -0.0789, 0.0912, -0.0234,
    0.0567, -0.0423, 0.0834, -0.0612, 0.0745, -0.0298, 0.0654, -0.0521, 0.0389, -0.0156,
    0.0712, -0.0834, 0.0523, -0.0367, 0.0891, -0.0245, 0.0678, -0.0512, 0.0745, -0.0423,
    0.0567, -0.0634, 0.0834, -0.0289, 0.0654, -0.0456, 0.0912, -0.0378, 0.0523, -0.0267,
    0.0789, -0.0545, 0.0678, -0.0412, 0.0567, -0.0623, 0.0891, -0.0334, 0.0745, -0.0501,
    0.0654, -0.0389, 0.0834, -0.0456, 0.0712, -0.0267, 0.0523, -0.0578, 0.0612, -0.0423,
    0.0789, -0.0334, 0.0678, -0.0501, 0.0567, -0.0345, 0.0834, -0.0612, 0.0654, -0.0423,
    0.0912, -0.0289, 0.0745, -0.0534, 0.0523, -0.0378, 0.0891, -0.0456, 0.0712, -0.0267,
    0.0834, -0.0545, 0.0678, -0.0312, 0.0567, -0.0623, 0.0789, -0.0401, 0.0654, -0.0512,
    0.0745, -0.0334, 0.0523, -0.0489, 0.0612, -0.0267, 0.0834, -0.0578, 0.0891, -0.0423,
    0.0712, -0.0389, 0.0678, -0.0534, 0.0567, -0.0456, 0.0654, -0.0312, 0.0745, -0.0501,
    0.0523, -0.0623, 0.0789, -0.0378, 0.0834, -0.0445, 0.0912, -0.0267, 0.0678, -0.0512,
    0.0567, -0.0634, 0.0891, -0.0401, 0.0745, -0.0489, 0.0654, -0.0356, 0.0523, -0.0578,
    0.0712, -0.0423, 0.0834, -0.0534, 0.0789, -0.0312, 0.0678, -0.0501, 0.0567, -0.0445,
    0.0654, -0.0389, 0.0745, -0.0612, 0.0523, -0.0267, 0.0891, -0.0456, 0.0834, -0.0378,
    0.0712, -0.0623, 0.0789, -0.0401, 0.0678, -0.0634, 0.0567, -0.0312, 0.0654, -0.0489,
    0.0745, -0.0578, 0.0523, -0.0423, 0.0834, -0.0534, 0.0891, -0.0267, 0.0712, -0.0512,
    0.0678, -0.0389, 0.0567, -0.0445, 0.0789, -0.0356, 0.0654, -0.0501, 0.0745, -0.0634,
    0.0523, -0.0456, 0.0834, -0.0378, 0.0712, -0.0623, 0.0891, -0.0401, 0.0678, -0.0534,
    0.0567, -0.0489, 0.0654, -0.0267, 0.0745, -0.0578, 0.0523, -0.0412, 0.0834, -0.0523,
] * 8  # Repeat to reach 1536 dimensions

# Trim to exactly 1536
SAMPLE_EMBEDDING = SAMPLE_EMBEDDING[:1536]

# ============================================================================
# PART 1: INSERT CODETTE SNIPPETS (MUSIC KNOWLEDGE)
# ============================================================================

def insert_music_knowledge():
    """Insert Codette snippets for full-text search"""
    print("\n📚 PART 1: Inserting Codette Snippets (Music Knowledge)...")
    
    snippets = [
        {
            "topic": "EQ Mixing Techniques",
            "suggestion": "High-pass filtering removes rumble and low-frequency mud. Apply gentle 3-6dB cuts at problem frequencies. Use narrow Q for surgical cuts, wide Q for smooth tone shaping.",
            "category": "mixing",
            "confidence": 0.95,
            "embedding": SAMPLE_EMBEDDING,
        },
        {
            "topic": "Compression Fundamentals",
            "suggestion": "Compression reduces dynamic range by lowering volume when it exceeds a threshold. Use 4:1 ratio for mixing glue, 6:1+ for aggressive control. Fast attack (10ms) for drums, slow (50-100ms) for vocals.",
            "category": "production",
            "confidence": 0.92,
            "embedding": SAMPLE_EMBEDDING,
        },
        {
            "topic": "Reverb Space Design",
            "suggestion": "Small room 0.5-1s decay, medium hall 1.5-2.5s, large concert 3-4s. Pre-delay separates dry signal from reflections (20-100ms typical). Balance wet/dry to maintain source clarity without sounding detached.",
            "category": "effects",
            "confidence": 0.88,
            "embedding": SAMPLE_EMBEDDING,
        },
        {
            "topic": "Harmonic Saturation Secrets",
            "suggestion": "Soft saturation adds warmth and cohesion. Even-order harmonics sound smooth (tubes, tape emulation). Odd-order harmonics sound edgy (transistor circuits). Layer multiple saturation types for complex tone.",
            "category": "tone-shaping",
            "confidence": 0.90,
            "embedding": SAMPLE_EMBEDDING,
        },
        {
            "topic": "Sidechain Automation Tricks",
            "suggestion": "Sidechain compression to kick drum creates pumping effect. Sidechain EQ to remove clashing frequencies. Use LFO sidechain for rhythmic ducking of synths and bass lines.",
            "category": "production",
            "confidence": 0.87,
            "embedding": SAMPLE_EMBEDDING,
        },
    ]
    
    inserted = []
    for snippet in snippets:
        try:
            response = supabase.table("music_knowledge").insert(snippet).execute()
            if response.data:
                record = response.data[0]
                inserted.append(record)
                print(f"  ✅ Inserted: {snippet['topic']}")
            else:
                print(f"  ⚠️  No data returned for: {snippet['topic']}")
        except Exception as e:
            print(f"  ❌ Error inserting {snippet['topic']}: {e}")
    
    print(f"\n✅ Inserted {len(inserted)} snippets")
    return inserted


# ============================================================================
# PART 2: INSERT CHAT HISTORY
# ============================================================================

def insert_chat_history():
    """Create chat session with known user_id"""
    print("\n💬 PART 2: Creating Chat Session...")
    
    # Use proper UUID strings
    known_user_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"  # Test user UUID
    chat_id = str(uuid.uuid4())  # Unique session_id
    
    session = {
        "id": chat_id,
        "user_id": known_user_id,
        "title": "Test Codette Session",
        "metadata": {"type": "test", "embedding_test": True}
    }
    
    try:
        response = supabase.table("chat_sessions").insert(session).execute()
        if response.data:
            print(f"  ✅ Created chat session")
            print(f"     User ID (UUID): {known_user_id}")
            print(f"     Chat ID (session_id): {chat_id}")
            return known_user_id, chat_id
        else:
            print(f"  ❌ No data returned from insert")
            return None, None
    except Exception as e:
        print(f"  ⚠️  Could not create chat_session: {e}")
        print(f"  Proceeding with virtual session for embedding insertion...")
        print(f"     User ID (UUID): {known_user_id}")
        print(f"     Chat ID (session_id): {chat_id}")
        return known_user_id, chat_id


# ============================================================================
# PART 3: INSERT CHAT MESSAGES WITH EMBEDDINGS
# ============================================================================

def insert_chat_messages(chat_id: str, user_id: str):
    """Insert chat messages and their embeddings"""
    print("\n🔊 PART 3: Inserting Chat Messages with 1536-dim embeddings...")
    
    # Create messages first (in chat_messages table)
    messages_data = [
        {
            "session_id": chat_id,
            "user_id": user_id,
            "role": "user",
            "content": "How do I improve vocal clarity in my mix?",
            "content_vector": SAMPLE_EMBEDDING,
            "metadata": {"type": "question", "category": "mixing"}
        },
        {
            "session_id": chat_id,
            "user_id": user_id,
            "role": "assistant",
            "content": "Apply gentle high-pass filtering below 80Hz, use 2-4dB cut around 200Hz, and boost presence around 3-5kHz carefully.",
            "content_vector": SAMPLE_EMBEDDING,
            "metadata": {"type": "answer", "category": "eq"}
        },
        {
            "session_id": chat_id,
            "user_id": user_id,
            "role": "user",
            "content": "What compression settings for rock vocals?",
            "content_vector": SAMPLE_EMBEDDING,
            "metadata": {"type": "question", "category": "compression"}
        },
        {
            "session_id": chat_id,
            "user_id": user_id,
            "role": "assistant",
            "content": "Use 4:1 ratio, 30-50ms attack, 100-200ms release. Fast sidechain for clarity in dense arrangements.",
            "content_vector": SAMPLE_EMBEDDING,
            "metadata": {"type": "answer", "category": "dynamics"}
        },
    ]
    
    inserted_messages = []
    inserted_embeddings = []
    
    for i, msg_data in enumerate(messages_data):
        try:
            # Insert message
            response = supabase.table("chat_messages").insert(msg_data).execute()
            if response.data:
                msg_record = response.data[0]
                message_id = msg_record.get("id")
                inserted_messages.append(msg_record)
                print(f"  ✅ Inserted message {i+1}: {msg_data['role']}")
                
                # Now insert embedding for this message
                embedding_data = {
                    "message_id": message_id,
                    "embedding": SAMPLE_EMBEDDING,
                    "model": "text-embedding-3-small",
                }
                
                try:
                    emb_response = supabase.table("message_embeddings").insert(embedding_data).execute()
                    if emb_response.data:
                        inserted_embeddings.append(emb_response.data[0])
                        print(f"     ✅ Inserted embedding (1536-dim)")
                    else:
                        print(f"     ⚠️  No data returned for embedding")
                except Exception as e:
                    print(f"     ❌ Could not insert embedding: {e}")
            else:
                print(f"  ⚠️  No data returned for message {i+1}")
        except Exception as e:
            print(f"  ❌ Error inserting message {i+1}: {e}")
    
    print(f"\n✅ Inserted {len(inserted_messages)} messages with {len(inserted_embeddings)} embeddings")
    return inserted_messages, inserted_embeddings


# ============================================================================
# VERIFICATION
# ============================================================================

def verify_insertions(user_id: str, chat_id: str):
    """Verify all data was inserted correctly"""
    print("\n🔍 VERIFICATION:")
    
    # Check music knowledge count
    try:
        mk_response = supabase.table("music_knowledge").select("*").execute()
        mk_count = len(mk_response.data) if mk_response.data else 0
        print(f"  ✅ Music Knowledge records: {mk_count}")
    except Exception as e:
        print(f"  ❌ Error checking music_knowledge: {e}")
    
    # Check chat history
    try:
        ch_response = supabase.table("chat_history").select("*").eq("user_id", user_id).execute()
        ch_count = len(ch_response.data) if ch_response.data else 0
        if ch_response.data:
            messages_count = len(ch_response.data[0].get("messages", []))
            print(f"  ✅ Chat History for user {user_id}: {ch_count} (with {messages_count} messages)")
        else:
            print(f"  ✅ Chat History for user {user_id}: {ch_count}")
    except Exception as e:
        print(f"  ❌ Error checking chat_history: {e}")
    
    # Check message embeddings
    try:
        me_response = supabase.table("message_embeddings").select("*").execute()
        me_count = len(me_response.data) if me_response.data else 0
        print(f"  ✅ Message Embeddings (total): {me_count}")
    except Exception as e:
        print(f"  ❌ Error checking message_embeddings: {e}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution flow"""
    print("=" * 70)
    print("CODETTE TEST DATA INSERTION")
    print("=" * 70)
    
    try:
        # Test connection
        print("\n🔗 Testing Supabase connection...")
        health = supabase.table("chat_history").select("count").execute()
        print("  ✅ Supabase connection successful")
        
        # Part 1: Insert snippets
        snippets = insert_music_knowledge()
        
        # Part 2: Insert chat history
        user_id, chat_id = insert_chat_history()
        
        if not chat_id:
            print("❌ Failed to create chat history. Aborting.")
            return
        
        # Part 3: Insert messages with embeddings
        messages, embeddings = insert_chat_messages(chat_id, user_id)
        
        # Verification
        verify_insertions(user_id, chat_id)
        
        print("\n" + "=" * 70)
        print("✅ TEST DATA INSERTION COMPLETE")
        print("=" * 70)
        print(f"\nSummary:")
        print(f"  • {len(snippets)} Codette snippets inserted (full-text search ready)")
        print(f"  • {len(messages)} chat messages inserted")
        print(f"  • {len(embeddings)} message embeddings inserted (1536-dim)")
        print(f"\nYou can now:")
        print(f"  1. Test FTS: Search music_knowledge for 'compression'")
        print(f"  2. Test vector search: Query message_embeddings with 1536-dim vectors")
        print(f"  3. Test chat: Messages in chat_messages for user '{user_id}'")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
