-- Migration: Fix Schema Issues
-- Date: 2025-12-01
-- Description: Fix embedding types, rename tables, fix composite keys

-- 1. Fix music_knowledge table - change embedding to vector type
ALTER TABLE public.music_knowledge 
  ADD COLUMN embedding vector(1536);

-- 2. Rename what_to_do table to what_to_do (fix table name with spaces)
ALTER TABLE IF EXISTS public."what to do" 
  RENAME TO what_to_do;

-- 3. Fix codette_files - simplify primary key (should be just id)
-- Drop old table and recreate
DROP TABLE IF EXISTS public.codette_files;

CREATE TABLE public.codette_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT codette_files_pkey PRIMARY KEY (id)
);

-- 4. Remove duplicate tables - keep music_knowledge only
-- (cocoons and quantum_cocoons are duplicates - keep cocoons, drop quantum_cocoons)
DROP TABLE IF EXISTS public.quantum_cocoons;

-- 5. Create index for music_knowledge embeddings for faster similarity search
CREATE INDEX music_knowledge_embedding_idx ON public.music_knowledge USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 6. Create FTS index for music_knowledge text search
CREATE INDEX music_knowledge_fts_idx ON public.music_knowledge USING GIN (fts);

-- 7. Create index for chat_history user_id lookups
CREATE INDEX chat_history_user_id_idx ON public.chat_history(user_id);

-- 8. Create index for api_metrics endpoint performance
CREATE INDEX api_metrics_endpoint_idx ON public.api_metrics(endpoint, created_at DESC);

-- 9. Create index for benchmark_results test_type
CREATE INDEX benchmark_results_test_type_idx ON public.benchmark_results(test_type, created_at DESC);

-- 10. Create index for competitor_analysis
CREATE INDEX competitor_analysis_competitor_idx ON public.competitor_analysis(competitor, test_date DESC);

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable PostGIS for geospatial queries (optional)
-- CREATE EXTENSION IF NOT EXISTS postgis;
