/**
 * Cloud Sync Module - Supabase Integration
 * Handles project persistence, auto-backup, and conflict resolution
 */

import { Project } from '../types';
import { supabase } from './supabase';

export interface CloudSyncMetadata {
  projectId: string;
  version: number;
  lastSyncedAt: string;
  conflictResolution: 'local' | 'remote' | 'merged';
  deviceId: string;
  hash: string;
}

export interface SyncConflict {
  projectId: string;
  localVersion: number;
  remoteVersion: number;
  localHash: string;
  remoteHash: string;
  timestamp: string;
}

class CloudSyncManager {
  private syncInProgress = false;
  private syncQueue: Project[] = [];
  private lastSyncTime: Map<string, number> = new Map();
  private SYNC_DEBOUNCE_MS = 2000;
  private SYNC_INTERVAL_MS = 30000; // Auto-sync every 30s

  /**
   * Initialize cloud sync - called on app startup
   */
  async initialize(): Promise<void> {
    console.log('[CloudSync] Initializing cloud sync');
    
    // Start periodic sync
    setInterval(() => this.performAutoSync(), this.SYNC_INTERVAL_MS);
  }

  /**
   * Save project to cloud with conflict detection
   */
  async saveProjectToCloud(project: Project): Promise<{ success: boolean; hash: string }> {
    if (!project.id) {
      throw new Error('Project must have an ID before cloud sync');
    }

    const lastSync = this.lastSyncTime.get(project.id) || 0;
    const timeSinceLastSync = Date.now() - lastSync;

    // Debounce rapid saves (e.g., parameter changes during playback)
    if (timeSinceLastSync < this.SYNC_DEBOUNCE_MS) {
      return { success: true, hash: this.hashProject(project) };
    }

    try {
      this.syncInProgress = true;
      const projectHash = this.hashProject(project);
      const metadata: CloudSyncMetadata = {
        projectId: project.id,
        version: 1,
        lastSyncedAt: new Date().toISOString(),
        conflictResolution: 'local',
        deviceId: this.getDeviceId(),
        hash: projectHash,
      };

      // Try to upsert project (insert or update)
      const { error } = await supabase
        .from('projects')
        .upsert(
          {
            id: project.id,
            name: project.name,
            content: project, // Full project JSON
            metadata,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select();

      if (error) {
        console.error('[CloudSync] Save error:', error);
        return { success: false, hash: projectHash };
      }

      this.lastSyncTime.set(project.id, Date.now());
      console.log('[CloudSync] Project saved to cloud:', project.id);
      
      return { success: true, hash: projectHash };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Load project from cloud with conflict detection
   */
  async loadProjectFromCloud(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('content, metadata')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        console.warn('[CloudSync] Project not found in cloud:', projectId);
        return null;
      }

      console.log('[CloudSync] Project loaded from cloud:', projectId);
      return data.content as Project;
    } catch (err) {
      console.error('[CloudSync] Load error:', err);
      return null;
    }
  }

  /**
   * List all cloud projects for current user
   */
  async listCloudProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('content')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[CloudSync] List projects error:', error);
        return [];
      }

      return (data || []).map((item: any) => item.content as Project);
    } catch (err) {
      console.error('[CloudSync] List projects error:', err);
      return [];
    }
  }

  /**
   * Delete project from cloud
   */
  async deleteProjectFromCloud(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('[CloudSync] Delete error:', error);
        return false;
      }

      this.lastSyncTime.delete(projectId);
      console.log('[CloudSync] Project deleted from cloud:', projectId);
      return true;
    } catch (err) {
      console.error('[CloudSync] Delete error:', err);
      return false;
    }
  }

  /**
   * Detect and resolve conflicts
   */
  async detectConflict(
    projectId: string,
    localProject: Project
  ): Promise<SyncConflict | null> {
    try {
      const remoteProject = await this.loadProjectFromCloud(projectId);
      if (!remoteProject) return null;

      const localHash = this.hashProject(localProject);
      const remoteHash = this.hashProject(remoteProject);

      if (localHash !== remoteHash) {
        return {
          projectId,
          localVersion: 1,
          remoteVersion: 1,
          localHash,
          remoteHash,
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.error('[CloudSync] Conflict detection error:', err);
      return null;
    }
  }

  /**
   * Merge conflicting projects (prefer recent changes)
   */
  async resolveConflict(
    projectId: string,
    localProject: Project,
    strategy: 'local' | 'remote' | 'merged' = 'merged'
  ): Promise<Project | null> {
    try {
      const remoteProject = await this.loadProjectFromCloud(projectId);
      if (!remoteProject) return localProject;

      let resolved: Project;

      switch (strategy) {
        case 'local':
          resolved = localProject;
          break;
        case 'remote':
          resolved = remoteProject;
          break;
        case 'merged':
        default:
          // Merge strategy: take newer track modifications, combine effects
          resolved = this.mergeProjects(localProject, remoteProject);
          break;
      }

      // Save resolved version
      await this.saveProjectToCloud(resolved);
      console.log('[CloudSync] Conflict resolved using', strategy, 'strategy');

      return resolved;
    } catch (err) {
      console.error('[CloudSync] Conflict resolution error:', err);
      return localProject;
    }
  }

  /**
   * Enable auto-backup (called on every project change)
   */
  async enableAutoBackup(project: Project, intervalMs: number = 60000): Promise<void> {
    console.log('[CloudSync] Auto-backup enabled for', project.id);
    
    setInterval(() => {
      if (!this.syncInProgress) {
        this.queueSync(project);
      }
    }, intervalMs);
  }

  /**
   * Get sync status for a project
   */
  async getSyncStatus(
    projectId: string
  ): Promise<{ isSynced: boolean; lastSyncTime: string | null }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('updated_at')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        return { isSynced: false, lastSyncTime: null };
      }

      return {
        isSynced: true,
        lastSyncTime: data.updated_at,
      };
    } catch (err) {
      return { isSynced: false, lastSyncTime: null };
    }
  }

  // ========== PRIVATE METHODS ==========

  private async performAutoSync(): Promise<void> {
    while (this.syncQueue.length > 0) {
      const project = this.syncQueue.shift();
      if (project) {
        await this.saveProjectToCloud(project);
      }
    }
  }

  private queueSync(project: Project): void {
    // Deduplicate queue
    if (!this.syncQueue.find((p) => p.id === project.id)) {
      this.syncQueue.push(project);
    }
  }

  private hashProject(project: Project): string {
    // Simple hash of project content (for conflict detection)
    const key = JSON.stringify({
      id: project.id,
      name: project.name,
      bpm: project.bpm,
      trackCount: project.tracks.length,
      updatedAt: project.updatedAt,
    });
    return btoa(key).substring(0, 16); // Simple hash
  }

  private mergeProjects(local: Project, remote: Project): Project {
    // Merge strategy: combine tracks, keep newer timestamps
    const merged: Project = {
      ...remote,
      ...local,
      updatedAt: new Date().toISOString(),
      tracks: this.mergeTracks(local.tracks, remote.tracks),
    };
    return merged;
  }

  private mergeTracks(localTracks: any[], remoteTracks: any[]) {
    const trackMap = new Map();

    // Add remote tracks first
    remoteTracks.forEach((track) => trackMap.set(track.id, track));

    // Merge local tracks, preferring local versions if ID matches
    localTracks.forEach((track) => {
      if (trackMap.has(track.id)) {
        // Keep local version (assume user's most recent work)
        trackMap.set(track.id, track);
      } else {
        // New track in local
        trackMap.set(track.id, track);
      }
    });

    return Array.from(trackMap.values());
  }

  private getDeviceId(): string {
    // Get or create device ID
    let deviceId = localStorage.getItem('corelogic_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('corelogic_device_id', deviceId);
    }
    return deviceId;
  }
}

// Export singleton instance
export const cloudSyncManager = new CloudSyncManager();
