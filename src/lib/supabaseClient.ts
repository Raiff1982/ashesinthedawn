/**
 * Supabase Client Configuration
 * Handles authentication and database connections
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ChatHistory,
  MusicKnowledge,
  UserFeedback,
  CodetteFile,
} from '../types/supabase';

// Export operation groups types
interface ApiMetric {
  id: string;
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  created_at?: string;
}

interface BenchmarkResult {
  id: string;
  benchmark_type: string;
  score: number;
  created_at?: string;
}

// Get Supabase credentials from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle Supabase errors with consistent formatting
 */
export const handleSupabaseError = (error: any): string => {
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  if (typeof error === 'string') return error;
  return 'An error occurred with the database';
};

/**
 * Execute Supabase query with error handling
 */
export const executeQuery = async <T,>(
  query: any
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    const error = handleSupabaseError(err);
    console.error('Supabase query error:', error);
    return { data: null, error };
  }
};

// ============================================================================
// CHAT HISTORY OPERATIONS
// ============================================================================

export const chatHistoryOps = {
  /**
   * Get or create chat history for user
   */
  async getOrCreate(userId: string): Promise<{ data: ChatHistory | null; error: string | null }> {
    return executeQuery(
      supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(async (result) => {
          if (result.error?.code === 'PGRST116') {
            // No row found, create one
            return supabase.from('chat_history').insert({
              user_id: userId,
              messages: [],
            });
          }
          return result;
        })
    );
  },

  /**
   * Add message to chat history
   */
  async addMessage(userId: string, message: any) {
    const { data: chat, error: fetchError } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (fetchError) return { data: null, error: handleSupabaseError(fetchError) };

    const messages = chat?.messages || [];
    messages.push(message);

    return executeQuery(
      supabase
        .from('chat_history')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    );
  },

  /**
   * Clear chat history
   */
  async clear(userId: string) {
    return executeQuery(
      supabase
        .from('chat_history')
        .update({ messages: [], updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    );
  },
};

// ============================================================================
// MUSIC KNOWLEDGE OPERATIONS
// ============================================================================

export const musicKnowledgeOps = {
  /**
   * Search music knowledge with similarity search using embeddings
   */
  async searchBySimilarity(
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<{ data: MusicKnowledge[] | null; error: string | null }> {
    return executeQuery(
      supabase.rpc('search_music_knowledge', {
        query_embedding: embedding,
        match_count: limit,
        similarity_threshold: threshold,
      })
    );
  },

  /**
   * Search music knowledge by text (full-text search)
   */
  async searchByText(query: string, limit: number = 10) {
    return executeQuery(
      supabase
        .from('music_knowledge')
        .select('*')
        .or(`fts.match.'${query}',topic.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit)
    );
  },

  /**
   * Get music knowledge by category
   */
  async getByCategory(category: string, limit: number = 20) {
    return executeQuery(
      supabase
        .from('music_knowledge')
        .select('*')
        .eq('category', category)
        .order('confidence', { ascending: false })
        .limit(limit)
    );
  },

  /**
   * Add new music knowledge
   */
  async add(knowledge: Omit<MusicKnowledge, 'id' | 'created_at' | 'updated_at'>) {
    return executeQuery(supabase.from('music_knowledge').insert(knowledge));
  },

  /**
   * Update music knowledge
   */
  async update(id: string, updates: Partial<MusicKnowledge>) {
    return executeQuery(
      supabase
        .from('music_knowledge')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
    );
  },
};

// ============================================================================
// CODETTE FILES OPERATIONS
// ============================================================================

export const codetteFilesOps = {
  /**
   * List all files by type
   */
  async getByType(fileType: string) {
    return executeQuery(
      supabase.from('codette_files').select('*').eq('file_type', fileType).order('uploaded_at', {
        ascending: false,
      })
    );
  },

  /**
   * Upload file metadata
   */
  async uploadMetadata(metadata: Omit<CodetteFile, 'id'>) {
    return executeQuery(supabase.from('codette_files').insert(metadata));
  },

  /**
   * Delete file metadata
   */
  async deleteMetadata(id: string) {
    return executeQuery(supabase.from('codette_files').delete().eq('id', id));
  },
};

// ============================================================================
// API METRICS OPERATIONS
// ============================================================================

export const apiMetricsOps = {
  /**
   * Log API request metrics
   */
  async logMetric(metric: Omit<ApiMetric, 'id' | 'created_at'>) {
    return executeQuery(supabase.from('api_metrics').insert(metric));
  },

  /**
   * Get average response time for endpoint
   */
  async getAverageResponseTime(endpoint: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return executeQuery(
      supabase.rpc('get_avg_response_time', {
        endpoint_path: endpoint,
        since_date: since,
      })
    );
  },
};

// ============================================================================
// BENCHMARK OPERATIONS
// ============================================================================

export const benchmarkOps = {
  /**
   * Record benchmark result
   */
  async recordResult(result: Omit<BenchmarkResult, 'id' | 'created_at'>) {
    return executeQuery(supabase.from('benchmark_results').insert(result));
  },

  /**
   * Get average score by test type
   */
  async getAverageScoreByType(testType: string) {
    return executeQuery(
      supabase.rpc('get_benchmark_average', {
        test_type_filter: testType,
      })
    );
  },

  /**
   * Get latest benchmarks
   */
  async getLatest(limit: number = 10) {
    return executeQuery(
      supabase
        .from('benchmark_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },
};

// ============================================================================
// FEEDBACK OPERATIONS
// ============================================================================

export const feedbackOps = {
  /**
   * Submit user feedback
   */
  async submit(feedback: Omit<UserFeedback, 'id' | 'created_at'>) {
    return executeQuery(supabase.from('user_feedback').insert(feedback));
  },

  /**
   * Get average rating
   */
  async getAverageRating(taskId?: string) {
    let query = supabase.from('user_feedback').select('rating');
    if (taskId) query = query.eq('task_id', taskId);
    return executeQuery(query);
  },
};

export default supabase;
