#!/usr/bin/env python
"""
Supabase PostgreSQL Function Setup
Creates get_codette_context() function for intelligent context retrieval
"""

import os
import sys
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Supabase library not installed - providing manual SQL instead")

def get_env_var(name: str, vite_name: Optional[str] = None) -> Optional[str]:
    """Get environment variable, checking both standard and Vite format"""
    # Try standard name first
    value = os.getenv(name)
    if value:
        return value
    
    # Try Vite format if provided
    if vite_name:
        value = os.getenv(vite_name)
        if value:
            return value
    
    return None

def setup_codette_function():
    """Setup the get_codette_context PostgreSQL function"""
    
    print("=" * 80)
    print("📊 SUPABASE CODETTE CONTEXT FUNCTION SETUP")
    print("=" * 80)
    print()
    
    # SQL function definition
    sql_function = """
    CREATE OR REPLACE FUNCTION public.get_codette_context(input_prompt text, optionally_filename text DEFAULT NULL)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    AS $body$
    DECLARE
      result jsonb := '{}'::jsonb;
      snippets jsonb;
      file_row jsonb;
      history jsonb;
    BEGIN
      -- Find matching codette snippets using full-text search
      SELECT jsonb_agg(jsonb_build_object(
        'filename', c."FileName", 
        'snippet', c."ContentSnippet"
      ))
        INTO snippets
      FROM public.codette c
      WHERE to_tsvector('english', coalesce(c."ContentSnippet", '')) @@ plainto_tsquery('english', input_prompt)
      LIMIT 10;

      -- Get file metadata if filename provided
      IF optionally_filename IS NOT NULL THEN
        SELECT jsonb_build_object(
          'id', cf.id,
          'filename', cf.filename,
          'file_type', cf.file_type,
          'storage_path', cf.storage_path,
          'uploaded_at', cf.uploaded_at
        )
        INTO file_row
        FROM public.codette_files cf
        WHERE cf.filename = optionally_filename
        LIMIT 1;
      END IF;

      -- Pull recent chat history for user or UUID
      SELECT jsonb_agg(jsonb_build_object(
        'id', ch.id, 
        'user_id', ch.user_id, 
        'messages', ch.messages, 
        'updated_at', ch.updated_at
      ) ORDER BY ch.updated_at DESC)
        INTO history
      FROM public.chat_history ch
      WHERE (ch.user_id = input_prompt)
         OR (input_prompt ~* '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' 
             AND ch.user_id = (regexp_match(input_prompt, '([0-9a-fA-F\\-]{36})'))[1])
      LIMIT 5;

      -- Build result object
      result = result || jsonb_build_object('snippets', coalesce(snippets, '[]'::jsonb));
      result = result || jsonb_build_object('file', coalesce(file_row, 'null'::jsonb));
      result = result || jsonb_build_object('chat_history', coalesce(history, '[]'::jsonb));

      RETURN result;
    END;
    $body$;

    -- Grant execute to authenticated role
    GRANT EXECUTE ON FUNCTION public.get_codette_context(text, text) TO authenticated;
    """
    
    # Get Supabase credentials
    supabase_url = get_env_var("SUPABASE_URL", "VITE_SUPABASE_URL")
    supabase_key = get_env_var("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_key:
        supabase_key = get_env_var("SUPABASE_KEY", "VITE_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("⚠️  Supabase credentials not found in environment")
        print()
        print("📍 Required environment variables:")
        print("   • SUPABASE_URL or VITE_SUPABASE_URL")
        print("   • SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY")
        print()
    else:
        print(f"✅ Found Supabase URL: {supabase_url[:50]}...")
        print()
    
    # Try to execute via Supabase if credentials available
    if SUPABASE_AVAILABLE and supabase_url and supabase_key:
        try:
            print("🔗 Connecting to Supabase...")
            client: Client = create_client(supabase_url, supabase_key)
            
            # For execute, try using exec or raw SQL call
            print("📝 Executing SQL function creation...")
            
            # Try direct RPC call if available
            try:
                response = client.rpc('exec_sql', {'sql': sql_function})
                print("✅ Function created via RPC!")
            except Exception as rpc_error:
                # Fallback: try using admin API
                print(f"⚠️  RPC execution not available: {str(rpc_error)[:50]}...")
                print()
                raise
                
        except Exception as e:
            print(f"⚠️  Could not execute via Supabase API")
            print(f"   Error: {str(e)[:80]}...")
            print()
    
    # Always provide manual instructions
    print("=" * 80)
    print("📋 TO CREATE FUNCTION MANUALLY IN SUPABASE:")
    print("=" * 80)
    print()
    print("1. Go to: https://app.supabase.com")
    print("2. Select your project")
    print("3. Click 'SQL Editor' in left sidebar")
    print("4. Click 'New Query'")
    print("5. Copy the SQL below and paste it:")
    print()
    print("-" * 80)
    print(sql_function)
    print("-" * 80)
    print()
    print("6. Click 'Run'")
    print()
    
    print("=" * 80)
    print("📌 FUNCTION SIGNATURE")
    print("=" * 80)
    print()
    print("Function: get_codette_context(input_prompt text, optionally_filename text DEFAULT NULL)")
    print()
    print("Parameters:")
    print("  • input_prompt: text - Search query or user ID (UUID)")
    print("  • optionally_filename: text (optional) - Filter by filename")
    print()
    print("Returns: jsonb object with three keys:")
    print("  • snippets - Array of matching code snippets (max 10)")
    print("  • file - File metadata object (if filename provided)")
    print("  • chat_history - Array of user chat history (max 5)")
    print()
    print("Example usage:")
    print("  SELECT * FROM get_codette_context('mixing optimization');")
    print("  SELECT * FROM get_codette_context('123e4567-e89b-12d3-a456-426614174000');")
    print("  SELECT * FROM get_codette_context('audio analysis', 'effect_chain.ts');")
    print()
    
    print("=" * 80)
    print("✅ SETUP INSTRUCTIONS PROVIDED")
    print("=" * 80)
    print()
    print("Note: This function enables Codette to:")
    print("  • Search code snippets with full-text search")
    print("  • Retrieve file metadata from storage")
    print("  • Access user chat history for context")
    print("  • Provide intelligent, context-aware responses")
    print()

if __name__ == "__main__":
    setup_codette_function()
