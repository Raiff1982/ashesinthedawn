/**
 * Effect Chain Context Adapter
 * Bridges TrackEffectChainManager into DAWContext with DSP Bridge integration
 * 
 * Phase 9: Effect Chain Integration for DAWContext
 * This file provides all the effect chain functions that need to be integrated
 * into DAWContext without modifying that large file directly.
 */

import { useRef, useState, useCallback } from 'react';
import {
  getEffectChainManager,
  TrackEffectChain,
  EffectInstanceState,
} from './trackEffectChainManager';
import { processEffect as dspProcessEffect } from './dspBridge';

export interface EffectChainContextAPI {
  effectChainsByTrack: Map<string, TrackEffectChain>;
  getTrackEffects: (trackId: string) => EffectInstanceState[];
  addEffectToTrack: (trackId: string, effectType: string) => EffectInstanceState;
  removeEffectFromTrack: (trackId: string, effectId: string) => boolean;
  updateEffectParameter: (trackId: string, effectId: string, paramName: string, value: unknown) => boolean;
  enableDisableEffect: (trackId: string, effectId: string, enabled: boolean) => boolean;
  setEffectWetDry: (trackId: string, effectId: string, wetDry: number) => boolean;
  getEffectChainForTrack: (trackId: string) => TrackEffectChain | undefined;
  processTrackEffects: (trackId: string, audio: Float32Array, sampleRate: number) => Promise<Float32Array>;
  hasActiveEffects: (trackId: string) => boolean;
}

/**
 * Hook to initialize and manage effect chain API with DSP Bridge integration
 * Used internally by DAWProvider
 */
export function useEffectChainAPI(): EffectChainContextAPI {
  const effectChainManagerRef = useRef(getEffectChainManager());
  const [, setEffectChainVersion] = useState(0);

  const getTrackEffects = useCallback((trackId: string): EffectInstanceState[] => {
    const manager = effectChainManagerRef.current;
    return manager.getEffectsForTrack(trackId);
  }, []);

  const addEffectToTrack = useCallback(
    (trackId: string, effectType: string): EffectInstanceState => {
      const manager = effectChainManagerRef.current;
      const effect = manager.addEffectToTrack(trackId, effectType);
      setEffectChainVersion((v) => v + 1);
      console.log(`[EffectChain] Added ${effectType} effect to track ${trackId}`);
      return effect;
    },
    []
  );

  const removeEffectFromTrack = useCallback(
    (trackId: string, effectId: string): boolean => {
      const manager = effectChainManagerRef.current;
      const success = manager.removeEffectFromTrack(trackId, effectId);
      if (success) {
        setEffectChainVersion((v) => v + 1);
        console.log(`[EffectChain] Removed effect ${effectId} from track ${trackId}`);
      }
      return success;
    },
    []
  );

  const updateEffectParameter = useCallback(
    (trackId: string, effectId: string, paramName: string, value: unknown): boolean => {
      const manager = effectChainManagerRef.current;
      const success = manager.updateEffectParameter(trackId, effectId, paramName, value);
      if (success) {
        setEffectChainVersion((v) => v + 1);
      }
      return success;
    },
    []
  );

  const enableDisableEffect = useCallback(
    (trackId: string, effectId: string, enabled: boolean): boolean => {
      const manager = effectChainManagerRef.current;
      const success = manager.toggleEffect(trackId, effectId, enabled);
      if (success) {
        setEffectChainVersion((v) => v + 1);
        console.log(
          `[EffectChain] Effect ${effectId} on track ${trackId} ${
            enabled ? "enabled" : "disabled"
          }`
        );
      }
      return success;
    },
    []
  );

  const setEffectWetDry = useCallback(
    (trackId: string, effectId: string, wetDry: number): boolean => {
      const manager = effectChainManagerRef.current;
      const success = manager.setWetDry(trackId, effectId, wetDry);
      if (success) {
        setEffectChainVersion((v) => v + 1);
      }
      return success;
    },
    []
  );

  const getEffectChainForTrack = useCallback(
    (trackId: string): TrackEffectChain | undefined => {
      const manager = effectChainManagerRef.current;
      return manager.getChainForTrack(trackId);
    },
    []
  );

  /**
   * Process audio through effect chain using DSP Bridge
   * This is where the actual audio processing happens!
   */
  const processTrackEffects = useCallback(
    async (
      trackId: string,
      audio: Float32Array,
      sampleRate: number
    ): Promise<Float32Array> => {
      const manager = effectChainManagerRef.current;
      const chain = manager.getChainForTrack(trackId);

      if (!chain || !manager.hasActiveEffects(trackId)) {
        return audio;
      }

      try {
        manager.setProcessingState(trackId, true);
        
        // Get all active effects for this track
        const effects = manager.getEffectsForTrack(trackId)
          .filter(effect => effect.enabled && !effect.bypass);
        
        if (effects.length === 0) {
          manager.setProcessingState(trackId, false);
          return audio;
        }

        let processedAudio = audio;
        
        // Process through each effect in the chain
        for (const effect of effects) {
          try {
            // Convert parameters to numeric-only format for DSP bridge
            const numericParameters: Record<string, number> = {};
            for (const [key, value] of Object.entries(effect.parameters)) {
              if (typeof value === 'number') {
                numericParameters[key] = value;
              } else if (typeof value === 'string') {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                  numericParameters[key] = parsed;
                }
              }
            }
            
            // Process audio through DSP bridge
            const effectOutput = await dspProcessEffect(
              effect.effectType,
              processedAudio,
              numericParameters,
              sampleRate
            );
            
            // Apply wet/dry mix
            const wetAmount = effect.wetDry;
            const dryAmount = 1 - wetAmount;
            
            const mixedOutput = new Float32Array(processedAudio.length);
            for (let i = 0; i < processedAudio.length; i++) {
              mixedOutput[i] = processedAudio[i] * dryAmount + effectOutput[i] * wetAmount;
            }
            
            processedAudio = mixedOutput;
            
            console.log(`[EffectChain] Processed ${effect.effectType} on track ${trackId}`);
          } catch (error) {
            console.error(`[EffectChain] Failed to process ${effect.effectType}:`, error);
            // Continue with previous audio on error
          }
        }
        
        manager.setProcessingState(trackId, false);
        return processedAudio;
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        manager.setError(trackId, err);
        console.error(
          `[EffectChain] Error processing effects for track ${trackId}:`,
          error
        );
        return audio;
      }
    },
    []
  );

  const hasActiveEffects = useCallback((trackId: string): boolean => {
    const manager = effectChainManagerRef.current;
    return manager.hasActiveEffects(trackId);
  }, []);

  return {
    effectChainsByTrack: effectChainManagerRef.current.getAllChains(),
    getTrackEffects,
    addEffectToTrack,
    removeEffectFromTrack,
    updateEffectParameter,
    enableDisableEffect,
    setEffectWetDry,
    getEffectChainForTrack,
    processTrackEffects,
    hasActiveEffects,
  };
}

/**
 * INTEGRATION INSTRUCTIONS FOR DAWContext:
 * 
 * 1. Import this hook at the top of DAWContext.tsx:
 *    import { useEffectChainAPI, EffectChainContextAPI } from '../lib/effectChainContextAdapter';
 * 
 * 2. In the DAWProvider component, call this hook:
 *    const effectChainAPI = useEffectChainAPI();
 * 
 * 3. Add these types to DAWContextType interface:
 *    (Copy from EffectChainContextAPI interface above)
 * 
 * 4. Spread effectChainAPI into the contextValue object:
 *    const contextValue = {
 *      // ...existing properties...
 *      ...effectChainAPI,
 *    };
 * 
 * 5. The effect chain manager will automatically clean up on unmount via the hook's ref
 */
