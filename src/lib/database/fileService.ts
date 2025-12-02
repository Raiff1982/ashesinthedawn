import { supabase } from '../supabase';

/**
 * File Service
 * Manages Codette files (presets, configurations, audio analysis results)
 * with user authentication
 */

export interface CodetteFile {
  id: string;
  user_id?: string;
  filename: string;
  storage_path: string;
  file_type: string;
  uploaded_at: string;
  created_at: string;
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user;
}

/**
 * Fetch all files for authenticated user
 * Ordered by most recent first
 * Optimized query: selects only necessary fields for better performance
 */
export async function getUserFiles(
  fileType?: string
): Promise<{ success: boolean; data?: CodetteFile[]; error?: string }> {
  try {
    const user = await getCurrentUser();

    // Build query with selected fields for performance
    let query = supabase
      .from('codette_files')
      .select('id, user_id, filename, storage_path, file_type, uploaded_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FileService] Fetch error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.log('[FileService] No files found for user');
      return { success: true, data: [] };
    }

    console.log('[FileService] Files fetched:', data.length);
    return { success: true, data: data as CodetteFile[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Fetch failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Upload/create a new file metadata entry
 */
export async function createFile(
  filename: string,
  storagePath: string,
  fileType: string
): Promise<{ success: boolean; data?: CodetteFile; error?: string }> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('codette_files')
      .insert({
        user_id: user.id,
        filename,
        storage_path: storagePath,
        file_type: fileType,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[FileService] Create error:', error);
      return { success: false, error: error.message };
    }

    console.log('[FileService] File created:', data);
    return { success: true, data: data as CodetteFile };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Create failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Delete a file by ID
 * (user can only delete their own files)
 */
export async function deleteFile(
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    // First verify the file belongs to this user
    const { data: file } = await supabase
      .from('codette_files')
      .select('id, user_id')
      .eq('id', fileId)
      .single();

    if (!file || file.user_id !== user.id) {
      return {
        success: false,
        error: 'Unauthorized: File not found or does not belong to user',
      };
    }

    const { error } = await supabase
      .from('codette_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.error('[FileService] Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('[FileService] File deleted:', fileId);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Delete failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get file by ID
 */
export async function getFileById(
  fileId: string
): Promise<{ success: boolean; data?: CodetteFile; error?: string }> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('codette_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[FileService] Get error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: 'File not found or does not belong to user',
      };
    }

    return { success: true, data: data as CodetteFile };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Get failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Search files by filename
 */
export async function searchFiles(
  searchTerm: string
): Promise<{ success: boolean; data?: CodetteFile[]; error?: string }> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('codette_files')
      .select('*')
      .eq('user_id', user.id)
      .ilike('filename', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FileService] Search error:', error);
      return { success: false, error: error.message };
    }

    console.log('[FileService] Search results:', data?.length || 0);
    return { success: true, data: data as CodetteFile[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Search failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get files by type (e.g., 'preset', 'analysis', 'config')
 */
export async function getFilesByType(
  fileType: string
): Promise<{ success: boolean; data?: CodetteFile[]; error?: string }> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('codette_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_type', fileType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FileService] Get by type error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CodetteFile[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FileService] Get by type failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Quick fetch - get minimal file info (id, filename, created_at)
 * Optimized for fast queries with reduced data transfer
 */
export async function getFileMetadata(): Promise<
  { id: string; filename: string; created_at: string }[]
> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('codette_files')
      .select('id, filename, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FileService] Metadata fetch error:', error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error('[FileService] Metadata fetch failed:', err);
    return [];
  }
}

/**
 * Paginated file fetch with optional limit and page offset
 * Optimized for large file lists with pagination support
 */
export async function getFileMetadataPaginated(
  limit?: number | null,
  page: number = 0
): Promise<{
  data: { id: string; filename: string; created_at: string }[];
  hasMore: boolean;
  total?: number;
}> {
  try {
    const user = await getCurrentUser();

    let query = supabase
      .from('codette_files')
      .select('id, filename, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply pagination if limit is provided and valid
    if (limit && Number.isInteger(limit) && limit > 0) {
      const start = page * limit;
      const end = start + limit - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[FileService] Paginated fetch error:', error);
      return { data: [], hasMore: false };
    }

    // Determine if there are more results
    const hasMore =
      limit && count ? (page + 1) * limit < count : false;

    console.log(
      `[FileService] Paginated fetch: page ${page}, limit ${limit}, total ${count}`
    );

    return {
      data: data ?? [],
      hasMore,
      total: count ?? undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[FileService] Paginated fetch failed:', msg);
    return { data: [], hasMore: false };
  }
}

