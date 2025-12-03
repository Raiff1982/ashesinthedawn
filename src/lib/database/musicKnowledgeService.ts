import { supabase } from '../supabase';
import type { MusicKnowledge } from '../../types/supabase';

/**
 * Music Knowledge Service
 * Manages music production suggestions and knowledge base
 */

export interface MusicSuggestion extends MusicKnowledge {
  relevanceScore?: number;
}

/**
 * Get music knowledge suggestions by category
 */
export async function getMusicSuggestions(
  category: string,
  limit: number = 10
): Promise<{ success: boolean; data?: MusicSuggestion[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('music_knowledge')
      .select('*')
      .eq('category', category)
      .limit(limit);

    if (error) {
      console.error('[MusicKnowledgeService] Get suggestions error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[MusicKnowledgeService] Retrieved ${data?.length || 0} suggestions`);
    return { success: true, data: (data || []) as MusicSuggestion[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[MusicKnowledgeService] Get suggestions failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Search music knowledge by topic
 */
export async function searchMusicKnowledge(
  topic: string,
  limit: number = 5
): Promise<{ success: boolean; data?: MusicSuggestion[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('music_knowledge')
      .select('*')
      .ilike('topic', `%${topic}%`)
      .limit(limit);

    if (error) {
      console.error('[MusicKnowledgeService] Search error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[MusicKnowledgeService] Found ${data?.length || 0} results for "${topic}"`);
    return { success: true, data: (data || []) as MusicSuggestion[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[MusicKnowledgeService] Search failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Save new music knowledge entry
 */
export async function saveMusicKnowledge(
  topic: string,
  category: string,
  suggestion: Record<string, unknown>,
  confidence: number = 0.85
): Promise<{ success: boolean; data?: MusicSuggestion; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('music_knowledge')
      .insert({
        topic,
        category,
        suggestion,
        confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[MusicKnowledgeService] Save error:', error);
      return { success: false, error: error.message };
    }

    console.log('[MusicKnowledgeService] Knowledge entry saved:', topic);
    return { success: true, data: data as MusicSuggestion };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[MusicKnowledgeService] Save failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get all categories
 */
export async function getMusicCategories(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('music_knowledge')
      .select('category');

    if (error) {
      console.error('[MusicKnowledgeService] Get categories error:', error);
      return { success: false, error: error.message };
    }

    // Deduplicate categories
    const categories = [...new Set((data || []).map((row: any) => row.category))];
    console.log('[MusicKnowledgeService] Found categories:', categories);
    return { success: true, data: categories };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[MusicKnowledgeService] Get categories failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get high-confidence suggestions
 */
export async function getTopSuggestions(
  minConfidence: number = 0.8,
  limit: number = 10
): Promise<{ success: boolean; data?: MusicSuggestion[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('music_knowledge')
      .select('*')
      .gte('confidence', minConfidence)
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[MusicKnowledgeService] Get top suggestions error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[MusicKnowledgeService] Retrieved ${data?.length || 0} top suggestions`);
    return { success: true, data: (data || []) as MusicSuggestion[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[MusicKnowledgeService] Get top suggestions failed:', msg);
    return { success: false, error: msg };
  }
}
