import { supabase } from '../supabase';

/**
 * Audio Analysis Service
 * Manages storing and retrieving audio analysis results
 */

export interface AnalysisResult {
  id?: string;
  user_id?: string;
  track_id: string;
  analysis_type: string; // 'general', 'spectrum', 'phase', 'health', etc.
  score: number; // 0-100
  findings: string[];
  recommendations: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Save audio analysis result
 */
export async function saveAnalysisResult(
  trackId: string,
  analysisType: string,
  score: number,
  findings: string[],
  recommendations: string[],
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; data?: AnalysisResult; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_cache') // Using ai_cache table for analysis results
      .insert({
        cache_key: `analysis_${trackId}_${analysisType}_${Date.now()}`,
        response: {
          trackId,
          analysisType,
          score,
          findings,
          recommendations,
          metadata,
          timestamp: Date.now(),
        },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (error) {
      console.error('[AnalysisService] Save error:', error);
      return { success: false, error: error.message };
    }

    console.log('[AnalysisService] Analysis result saved for track:', trackId);
    return { success: true, data: data?.response as AnalysisResult };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[AnalysisService] Save failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get analysis results for a track
 */
export async function getAnalysisResults(
  trackId: string,
  analysisType?: string
): Promise<{ success: boolean; data?: AnalysisResult[]; error?: string }> {
  try {
    let query = supabase
      .from('ai_cache')
      .select('*')
      .ilike('cache_key', `%${trackId}%`);

    if (analysisType) {
      query = query.ilike('cache_key', `%${analysisType}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AnalysisService] Get error:', error);
      return { success: false, error: error.message };
    }

    const results = (data || []).map((row: any) => row.response as AnalysisResult);
    console.log(`[AnalysisService] Retrieved ${results.length} analysis results`);
    return { success: true, data: results };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[AnalysisService] Get failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get latest analysis for a track
 */
export async function getLatestAnalysis(
  trackId: string
): Promise<{ success: boolean; data?: AnalysisResult; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('*')
      .ilike('cache_key', `%${trackId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('[AnalysisService] Get latest error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.log('[AnalysisService] No analysis found for track:', trackId);
      return { success: true, data: undefined };
    }

    console.log('[AnalysisService] Latest analysis retrieved');
    return { success: true, data: data.response as AnalysisResult };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[AnalysisService] Get latest failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Delete old analysis results (cleanup)
 */
export async function cleanupOldAnalysis(daysOld: number = 30): Promise<{
  success: boolean;
  deleted?: number;
  error?: string;
}> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('ai_cache')
      .delete()
      .lt('created_at', cutoffDate);

    if (error) {
      console.error('[AnalysisService] Cleanup error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[AnalysisService] Cleaned up analysis results older than ${daysOld} days`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[AnalysisService] Cleanup failed:', msg);
    return { success: false, error: msg };
  }
}
