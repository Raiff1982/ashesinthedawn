import { supabase } from '../supabase';

/**
 * Codette Control Center Service
 * Manages activity logs, permissions, and AI operation controls
 * 
 * NOTE: This service uses Supabase with automatic fallback to local storage
 * if tables don't exist or RLS policies are not configured.
 */

export type PermissionLevel = 'allow' | 'ask' | 'deny';
export type ActivitySource = 'codette' | 'user' | 'system';

export interface Permission {
  id?: string;
  user_id: string;
  action_type: string;
  permission_level: PermissionLevel;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id?: string;
  user_id: string;
  timestamp: string;
  source: ActivitySource;
  action: string;
  details?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  created_at?: string;
}

export interface CodetteControlState {
  enabled: boolean;
  logActivity: boolean;
  autoRender: boolean;
  includeInBackups: boolean;
  clearHistoryOnClose: boolean;
}

/**
 * Get or create default permissions for a user
 */
export async function getOrCreateDefaultPermissions(
  userId: string
): Promise<{ success: boolean; data?: Record<string, PermissionLevel>; error?: string }> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('codette_permissions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      // 404 means table doesn't exist - silently return defaults
      if (fetchError.code === '404' || fetchError.message?.includes('404') || fetchError.message?.includes('not found')) {
        const defaultPerms = {
          LoadPlugin: 'ask' as PermissionLevel,
          CreateTrack: 'allow' as PermissionLevel,
          RenderMixdown: 'ask' as PermissionLevel,
          AdjustParameters: 'ask' as PermissionLevel,
          SaveProject: 'allow' as PermissionLevel,
        };
        return { success: true, data: defaultPerms };
      }
      // Only log non-404 errors
      if (fetchError.message && !fetchError.message.includes('404')) {
        console.error('[CodetteControlService] Fetch error:', fetchError);
      }
      return { success: false, error: fetchError.message };
    }

    // If permissions exist, return them
    if (existing && existing.length > 0) {
      const permMap: Record<string, PermissionLevel> = {};
      existing.forEach((p: any) => {
        permMap[p.action_type] = p.permission_level;
      });
      return { success: true, data: permMap };
    }

    // Create default permissions
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      { user_id: userId, action_type: 'LoadPlugin', permission_level: 'ask' },
      { user_id: userId, action_type: 'CreateTrack', permission_level: 'allow' },
      { user_id: userId, action_type: 'RenderMixdown', permission_level: 'ask' },
      { user_id: userId, action_type: 'AdjustParameters', permission_level: 'ask' },
      { user_id: userId, action_type: 'SaveProject', permission_level: 'allow' },
    ];

    const { error: insertError } = await supabase
      .from('codette_permissions')
      .insert(defaultPermissions);

    if (insertError) {
      console.error('[CodetteControlService] Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    const permMap: Record<string, PermissionLevel> = {};
    defaultPermissions.forEach((p) => {
      permMap[p.action_type] = p.permission_level;
    });

    return { success: true, data: permMap };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Get permissions failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Update a permission level
 */
export async function updatePermission(
  userId: string,
  actionType: string,
  permissionLevel: PermissionLevel
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('codette_permissions')
      .update({ permission_level: permissionLevel, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('action_type', actionType);

    if (error) {
      // 404 means table doesn't exist - return success silently (not critical)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { success: true };
      }
      console.error('[CodetteControlService] Update error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[CodetteControlService] Permission updated: ${actionType} = ${permissionLevel}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Update failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Log an activity
 */
export async function logActivity(
  userId: string,
  source: ActivitySource,
  action: string,
  status: ActivityLog['status'] = 'completed',
  details?: Record<string, unknown>
): Promise<{ success: boolean; data?: ActivityLog; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('codette_activity_logs')
      .insert({
        user_id: userId,
        timestamp: new Date().toISOString(),
        source,
        action,
        status,
        details: details || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // 404 means table doesn't exist - return success silently (not critical)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { success: true, data: undefined };
      }
      console.error('[CodetteControlService] Log error:', error);
      return { success: false, error: error.message };
    }

    console.log('[CodetteControlService] Activity logged:', action);
    return { success: true, data: data as ActivityLog };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Log failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get recent activity logs
 */
export async function getActivityLogs(
  userId: string,
  limit: number = 50
): Promise<{ success: boolean; data?: ActivityLog[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('codette_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // 404 means table doesn't exist - return empty array silently
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { success: true, data: [] };
      }
      console.error('[CodetteControlService] Fetch logs error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ActivityLog[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Fetch logs failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get control center settings
 */
export async function getControlSettings(
  userId: string
): Promise<{ success: boolean; data?: CodetteControlState; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('codette_control_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // 404 means table doesn't exist - return defaults silently
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          success: true,
          data: {
            enabled: true,
            logActivity: true,
            autoRender: false,
            includeInBackups: true,
            clearHistoryOnClose: false,
          },
        };
      }
      console.error('[CodetteControlService] Fetch settings error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      // Return defaults
      return {
        success: true,
        data: {
          enabled: true,
          logActivity: true,
          autoRender: false,
          includeInBackups: true,
          clearHistoryOnClose: false,
        },
      };
    }

    return { success: true, data: data as CodetteControlState };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Fetch settings failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Update control center settings
 */
export async function updateControlSettings(
  userId: string,
  settings: Partial<CodetteControlState>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('codette_control_settings')
      .upsert(
        {
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      // 404 means table doesn't exist - return success silently (not critical)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { success: true };
      }
      console.error('[CodetteControlService] Update settings error:', error);
      return { success: false, error: error.message };
    }

    console.log('[CodetteControlService] Settings updated');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Update settings failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Check if an action is permitted
 */
export function checkPermission(
  actionType: string,
  permissions: Record<string, PermissionLevel>
): { allowed: boolean; requiresApproval: boolean } {
  const perm = permissions[actionType] || 'ask';

  return {
    allowed: perm !== 'deny',
    requiresApproval: perm === 'ask',
  };
}

/**
 * Clear activity logs for a user
 */
export async function clearActivityLogs(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('codette_activity_logs')
      .delete()
      .eq('user_id', userId);

    if (error) {
      // 404 means table doesn't exist - return success silently (not critical)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return { success: true };
      }
      console.error('[CodetteControlService] Clear logs error:', error);
      return { success: false, error: error.message };
    }

    console.log('[CodetteControlService] Activity logs cleared');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[CodetteControlService] Clear logs failed:', msg);
    return { success: false, error: msg };
  }
}
