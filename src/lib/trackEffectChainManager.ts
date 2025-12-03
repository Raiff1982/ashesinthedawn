/**
 * Track Effect Chain Manager - Manages per-track effect chains for DAWContext
 * 
 * Coordinates:
 * - Multiple effect chains (one per track)
 * - Effect state persistence
 * - Real-time audio processing
 * - DSP bridge integration
 */

export interface TrackEffectChain {
  trackId: string;
  effectIds: string[];
  effectStates: Map<string, EffectInstanceState>;
  isProcessing: boolean;
  lastError: Error | null;
}

export interface EffectInstanceState {
  effectId: string;
  effectType: string;
  enabled: boolean;
  bypass: boolean;
  wetDry: number; // 0-100
  parameters: Record<string, string | number | boolean>;
}

export class EffectChainManagerError extends Error {
  constructor(message: string, public context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EffectChainManagerError';
  }
}

/**
 * Manager for track effect chains
 */
export class TrackEffectChainManager {
  private effectChains: Map<string, TrackEffectChain> = new Map();
  private listeners: Set<(trackId: string, chain: TrackEffectChain) => void> = new Set();

  /**
   * Initialize effect chain for a track
   */
  initializeChainForTrack(trackId: string): TrackEffectChain {
    if (this.effectChains.has(trackId)) {
      return this.effectChains.get(trackId)!;
    }

    const chain: TrackEffectChain = {
      trackId,
      effectIds: [],
      effectStates: new Map(),
      isProcessing: false,
      lastError: null,
    };

    this.effectChains.set(trackId, chain);
    this.notifyListeners(trackId, chain);
    console.log(`[EffectChainManager] Initialized effect chain for track: ${trackId}`);
    return chain;
  }

  /**
   * Get effect chain for a track
   */
  getChainForTrack(trackId: string): TrackEffectChain | undefined {
    return this.effectChains.get(trackId);
  }

  /**
   * Add effect to track chain
   */
  addEffectToTrack(trackId: string, effectType: string): EffectInstanceState {
    const chain = this.initializeChainForTrack(trackId);
    const effectId = `effect-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const effectState: EffectInstanceState = {
      effectId,
      effectType,
      enabled: true,
      bypass: false,
      wetDry: 100,
      parameters: {},
    };

    chain.effectIds.push(effectId);
    chain.effectStates.set(effectId, effectState);

    this.notifyListeners(trackId, chain);
    console.log(
      `[EffectChainManager] Added effect ${effectType} (${effectId}) to track ${trackId}`
    );

    return effectState;
  }

  /**
   * Remove effect from track chain
   */
  removeEffectFromTrack(trackId: string, effectId: string): boolean {
    const chain = this.effectChains.get(trackId);
    if (!chain) return false;

    const effect = chain.effectStates.get(effectId);
    if (!effect) return false;

    chain.effectIds = chain.effectIds.filter((id) => id !== effectId);
    chain.effectStates.delete(effectId);

    this.notifyListeners(trackId, chain);
    console.log(
      `[EffectChainManager] Removed effect ${effect.effectType} (${effectId}) from track ${trackId}`
    );

    return true;
  }

  /**
   * Update effect parameter
   */
  updateEffectParameter(
    trackId: string,
    effectId: string,
    paramName: string,
    value: unknown
  ): boolean {
    const chain = this.effectChains.get(trackId);
    if (!chain) return false;

    const effect = chain.effectStates.get(effectId);
    if (!effect) return false;

    const valueAsValidType: string | number | boolean =
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
        ? value
        : String(value);

    effect.parameters[paramName] = valueAsValidType;

    this.notifyListeners(trackId, chain);
    console.debug(
      `[EffectChainManager] Updated parameter ${paramName}=${valueAsValidType} for effect ${effectId} on track ${trackId}`
    );

    return true;
  }

  /**
   * Toggle effect on/off
   */
  toggleEffect(trackId: string, effectId: string, enabled: boolean): boolean {
    const chain = this.effectChains.get(trackId);
    if (!chain) return false;

    const effect = chain.effectStates.get(effectId);
    if (!effect) return false;

    effect.enabled = enabled;
    effect.bypass = !enabled;

    this.notifyListeners(trackId, chain);
    console.log(
      `[EffectChainManager] Effect ${effectId} on track ${trackId} ${
        enabled ? 'enabled' : 'disabled'
      }`
    );

    return true;
  }

  /**
   * Set wet/dry mix for effect
   */
  setWetDry(trackId: string, effectId: string, wetDry: number): boolean {
    const chain = this.effectChains.get(trackId);
    if (!chain) return false;

    const effect = chain.effectStates.get(effectId);
    if (!effect) return false;

    effect.wetDry = Math.max(0, Math.min(100, wetDry));

    this.notifyListeners(trackId, chain);
    console.debug(
      `[EffectChainManager] Wet/Dry set to ${effect.wetDry}% for effect ${effectId} on track ${trackId}`
    );

    return true;
  }

  /**
   * Get all effects for a track
   */
  getEffectsForTrack(trackId: string): EffectInstanceState[] {
    const chain = this.effectChains.get(trackId);
    if (!chain) return [];

    return Array.from(chain.effectStates.values());
  }

  /**
   * Get effect by ID
   */
  getEffect(trackId: string, effectId: string): EffectInstanceState | undefined {
    const chain = this.effectChains.get(trackId);
    if (!chain) return undefined;

    return chain.effectStates.get(effectId);
  }

  /**
   * Clear all effects for a track
   */
  clearEffectsForTrack(trackId: string): void {
    const chain = this.effectChains.get(trackId);
    if (!chain) return;

    chain.effectIds = [];
    chain.effectStates.clear();

    this.notifyListeners(trackId, chain);
    console.log(`[EffectChainManager] Cleared all effects for track ${trackId}`);
  }

  /**
   * Get effect chain processing order
   */
  getEffectOrder(trackId: string): EffectInstanceState[] {
    const chain = this.effectChains.get(trackId);
    if (!chain) return [];

    return chain.effectIds
      .map((id) => chain.effectStates.get(id))
      .filter((effect): effect is EffectInstanceState => effect !== undefined);
  }

  /**
   * Check if track has any active effects
   */
  hasActiveEffects(trackId: string): boolean {
    const effects = this.getEffectsForTrack(trackId);
    return effects.some((e) => e.enabled && !e.bypass);
  }

  /**
   * Subscribe to effect chain changes
   */
  subscribe(
    listener: (trackId: string, chain: TrackEffectChain) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(trackId: string, chain: TrackEffectChain): void {
    this.listeners.forEach((listener) => {
      try {
        listener(trackId, chain);
      } catch (error) {
        console.error('[EffectChainManager] Error in listener:', error);
      }
    });
  }

  /**
   * Set processing state
   */
  setProcessingState(trackId: string, isProcessing: boolean): void {
    const chain = this.effectChains.get(trackId);
    if (!chain) return;

    chain.isProcessing = isProcessing;
    this.notifyListeners(trackId, chain);
  }

  /**
   * Set error state
   */
  setError(trackId: string, error: Error | null): void {
    const chain = this.effectChains.get(trackId);
    if (!chain) return;

    chain.lastError = error;
    this.notifyListeners(trackId, chain);

    if (error) {
      console.error(`[EffectChainManager] Error on track ${trackId}:`, error);
    }
  }

  /**
   * Remove all effect chains (cleanup)
   */
  dispose(): void {
    this.effectChains.clear();
    this.listeners.clear();
    console.log('[EffectChainManager] Disposed');
  }

  /**
   * Export effect chain as JSON
   */
  exportChain(trackId: string): Record<string, unknown> | null {
    const chain = this.effectChains.get(trackId);
    if (!chain) return null;

    return {
      trackId,
      effectIds: chain.effectIds,
      effectStates: Array.from(chain.effectStates.entries()).map(([id, state]) => ({
        id,
        state,
      })),
    };
  }

  /**
   * Import effect chain from JSON
   */
  importChain(trackId: string, data: unknown): boolean {
    try {
      const chainData = data as Record<string, unknown>;
      const chain = this.initializeChainForTrack(trackId);

      if (Array.isArray(chainData.effectStates)) {
        chain.effectIds = [];
        chain.effectStates.clear();

        (chainData.effectStates as Array<{ id: string; state: EffectInstanceState }>).forEach(
          (item) => {
            chain.effectIds.push(item.id);
            chain.effectStates.set(item.id, item.state);
          }
        );

        this.notifyListeners(trackId, chain);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[EffectChainManager] Failed to import chain:', error);
      return false;
    }
  }

  /**
   * Get statistics about all effect chains
   */
  getStatistics(): {
    totalTracks: number;
    totalEffects: number;
    tracksWithEffects: number;
    averageEffectsPerTrack: number;
  } {
    const totalTracks = this.effectChains.size;
    let totalEffects = 0;
    let tracksWithEffects = 0;

    this.effectChains.forEach((chain) => {
      const count = chain.effectIds.length;
      totalEffects += count;
      if (count > 0) tracksWithEffects += 1;
    });

    return {
      totalTracks,
      totalEffects,
      tracksWithEffects,
      averageEffectsPerTrack:
        tracksWithEffects > 0 ? totalEffects / tracksWithEffects : 0,
    };
  }

  /**
   * Public getter for all effect chains map. Returns a shallow copy to avoid external mutation.
   */
  getAllChains(): Map<string, TrackEffectChain> {
    return new Map(this.effectChains);
  }
}

// Singleton instance
let managerInstance: TrackEffectChainManager | null = null;

/**
 * Get or create the singleton effect chain manager
 */
export function getEffectChainManager(): TrackEffectChainManager {
  if (!managerInstance) {
    managerInstance = new TrackEffectChainManager();
  }
  return managerInstance;
}

/**
 * Reset the singleton (primarily for testing)
 */
export function resetEffectChainManager(): void {
  if (managerInstance) {
    managerInstance.dispose();
  }
  managerInstance = null;
}
