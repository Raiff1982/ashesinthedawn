/**
 * Effect Chain Manager
 * 
 * Manages serial and parallel effect chains for audio processing.
 * Supports real-time parameter updates and effect routing.
 * Integrates with DSP Bridge and Codette AI for intelligent processing.
 */

import { processEffect } from "./dspBridge";
import { CodetteSmartEffectChain } from "./codetteAIDSP";
import type { Track } from "../types";

export interface EffectNode {
  id: string;
  effect: string;
  parameters: Record<string, number>;
  enabled: boolean;
  bypass: boolean;
  wet: number; // 0-1, blend between dry and wet
  order: number;
}

export interface ChainRouting {
  mode: "serial" | "parallel";
  nodes: EffectNode[];
  drySignal: number; // 0-1, amount of unprocessed audio in parallel mode
  mixPoint: "pre" | "post"; // Mixing point for parallel processing
}

/**
 * Effect Chain Processor
 */
export class EffectChain {
  private routing: ChainRouting;
  private isProcessing: boolean = false;
  private lastProcessTime: number = 0;

  constructor(_track: Track, _sampleRate: number = 44100) {
    this.routing = {
      mode: "serial",
      nodes: [],
      drySignal: 0,
      mixPoint: "post",
    };
  }

  /**
   * Add effect to chain
   */
  addEffect(
    effect: string,
    parameters: Record<string, number>,
    order?: number
  ): string {
    const id = `effect-${Date.now()}-${Math.random()}`;
    const effectNode: EffectNode = {
      id,
      effect,
      parameters,
      enabled: true,
      bypass: false,
      wet: 1.0,
      order: order ?? this.routing.nodes.length,
    };

    this.routing.nodes.push(effectNode);
    this.routing.nodes.sort((a, b) => a.order - b.order);

    return id;
  }

  /**
   * Remove effect from chain
   */
  removeEffect(effectId: string): boolean {
    const index = this.routing.nodes.findIndex((n) => n.id === effectId);
    if (index >= 0) {
      this.routing.nodes.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update effect parameters
   */
  updateEffect(
    effectId: string,
    updates: Partial<EffectNode>
  ): boolean {
    const node = this.routing.nodes.find((n) => n.id === effectId);
    if (node) {
      Object.assign(node, updates);
      return true;
    }
    return false;
  }

  /**
   * Get effect node
   */
  getEffect(effectId: string): EffectNode | undefined {
    return this.routing.nodes.find((n) => n.id === effectId);
  }

  /**
   * Set chain mode (serial or parallel)
   */
  setMode(mode: "serial" | "parallel"): void {
    this.routing.mode = mode;
  }

  /**
   * Process audio through entire chain
   */
  async process(audioData: Float32Array): Promise<Float32Array> {
    if (this.isProcessing) {
      return audioData;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      let output: Float32Array;

      if (this.routing.mode === "serial") {
        output = await this.processSerial(audioData);
      } else {
        output = await this.processParallel(audioData);
      }

      this.lastProcessTime = performance.now() - startTime;
      console.log(
        `✓ Effect chain processed in ${this.lastProcessTime.toFixed(2)}ms`
      );

      return output;
    } catch (error) {
      console.error("Effect chain processing failed:", error);
      return audioData;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Serial processing: audio passes through each effect sequentially
   */
  private async processSerial(audioData: Float32Array): Promise<Float32Array> {
    let output = audioData;

    for (const node of this.routing.nodes) {
      if (!node.enabled || node.bypass) continue;

      try {
        const processed = await processEffect(
          node.effect,
          output,
          node.parameters
        );

        // Apply wet/dry mix
        output = this.mixWetDry(output, processed, node.wet);
      } catch (error) {
        console.error(`Failed to process ${node.effect}:`, error);
        // Continue with unprocessed audio
      }
    }

    return output;
  }

  /**
   * Parallel processing: effects run independently, then mixed
   */
  private async processParallel(audioData: Float32Array): Promise<Float32Array> {
    const processedSignals: Float32Array[] = [];
    let drySignal: Float32Array;

    // Process dry signal
    if (this.routing.mixPoint === "pre") {
      drySignal = audioData;
    } else {
      drySignal = new Float32Array(audioData);
    }

    // Process each effect in parallel
    const promises = this.routing.nodes
      .filter((n) => n.enabled && !n.bypass)
      .map(async (node) => {
        try {
          const processed = await processEffect(
            node.effect,
            audioData,
            node.parameters
          );
          return { signal: processed, wet: node.wet };
        } catch (error) {
          console.error(`Failed to process ${node.effect}:`, error);
          return { signal: audioData, wet: 0 };
        }
      });

    const results = await Promise.all(promises);
    processedSignals.push(...results.map((r) => r.signal));

    // Mix all signals
    let output = drySignal.slice(); // Clone dry signal

    for (let i = 0; i < processedSignals.length; i++) {
      const wetAmount = results[i].wet;
      const dry = 1 - wetAmount;

      for (let j = 0; j < output.length; j++) {
        output[j] = output[j] * dry + processedSignals[i][j] * wetAmount;
      }
    }

    // Apply dry signal amount if parallel mode
    if (this.routing.mode === "parallel") {
      for (let i = 0; i < output.length; i++) {
        output[i] =
          output[i] * (1 - this.routing.drySignal) +
          drySignal[i] * this.routing.drySignal;
      }
    }

    return output;
  }

  /**
   * Mix wet and dry signals
   */
  private mixWetDry(
    dry: Float32Array,
    wet: Float32Array,
    amount: number
  ): Float32Array {
    const output = new Float32Array(dry.length);
    const dryAmount = 1 - amount;

    for (let i = 0; i < dry.length; i++) {
      output[i] = dry[i] * dryAmount + wet[i] * amount;
    }

    return output;
  }

  /**
   * Get chain info for display
   */
  getChainInfo(): string {
    if (this.routing.nodes.length === 0) {
      return "No effects";
    }

    const effectNames = this.routing.nodes
      .filter((n) => n.enabled && !n.bypass)
      .map((n) => n.effect)
      .join(" → ");

    return `${this.routing.mode === "serial" ? "Serial" : "Parallel"}: ${effectNames}`;
  }

  /**
   * Get processing time from last process call
   */
  getLastProcessTime(): number {
    return this.lastProcessTime;
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.routing.nodes = [];
  }

  /**
   * Export chain configuration as JSON
   */
  export(): ChainRouting {
    return JSON.parse(JSON.stringify(this.routing));
  }

  /**
   * Import chain configuration from JSON
   */
  import(config: ChainRouting): void {
    this.routing = JSON.parse(JSON.stringify(config));
  }

  /**
   * Get all nodes
   */
  getNodes(): EffectNode[] {
    return this.routing.nodes;
  }

  /**
   * Get routing mode
   */
  getMode(): "serial" | "parallel" {
    return this.routing.mode;
  }
}

/**
 * Track Effect Manager
 * Manages effect chains for a specific track
 */
export class TrackEffectManager {
  private track: Track;
  private effectChain: EffectChain;
  private presets: Map<string, ChainRouting> = new Map();
  private sampleRate: number;

  constructor(track: Track, sampleRate: number = 44100) {
    this.track = track;
    this.sampleRate = sampleRate;
    this.effectChain = new EffectChain(track, sampleRate);
  }

  /**
   * Add preset configuration
   */
  savePreset(name: string): void {
    this.presets.set(name, this.effectChain.export());
  }

  /**
   * Load preset configuration
   */
  loadPreset(name: string): boolean {
    const preset = this.presets.get(name);
    if (preset) {
      this.effectChain.import(preset);
      return true;
    }
    return false;
  }

  /**
   * Get available presets
   */
  getPresets(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Process audio through effects
   */
  async processAudio(audioData: Float32Array): Promise<Float32Array> {
    return this.effectChain.process(audioData);
  }

  /**
   * Build smart chain using Codette AI
   */
  async buildSmartChain(
    audioData: Float32Array,
    genre?: string
  ): Promise<void> {
    const smartChain = new CodetteSmartEffectChain(
      this.track,
      audioData,
      this.sampleRate,
      genre
    );
    await smartChain.buildChain();

    // Clear existing effects
    this.effectChain.clear();

    // Add effects from smart chain
    for (const node of smartChain["effectChain"]) {
      this.effectChain.addEffect(node.effect, node.parameters);
    }
  }

  /**
   * Add effect to chain
   */
  addEffect(
    effect: string,
    parameters: Record<string, number>
  ): string {
    return this.effectChain.addEffect(effect, parameters);
  }

  /**
   * Remove effect from chain
   */
  removeEffect(effectId: string): boolean {
    return this.effectChain.removeEffect(effectId);
  }

  /**
   * Update effect
   */
  updateEffect(
    effectId: string,
    updates: Partial<EffectNode>
  ): boolean {
    return this.effectChain.updateEffect(effectId, updates);
  }

  /**
   * Get chain info
   */
  getChainInfo(): string {
    return this.effectChain.getChainInfo();
  }

  /**
   * Get effect chain
   */
  getEffectChain(): EffectChain {
    return this.effectChain;
  }
}
