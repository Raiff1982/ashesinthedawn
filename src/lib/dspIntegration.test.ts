/**
 * Backend-Frontend Integration Test Helpers
 * 
 * This file provides helper functions for manually testing DSP Bridge integration.
 * Run tests manually by calling the exported functions from the browser console.
 * 
 * Usage:
 * import { testDSPBridge, testEffectChain } from './dspIntegration.test'
 * await testDSPBridge()
 * await testEffectChain()
 */

import {
  initializeDSPBridge,
  analyzeLevels,
  analyzeSpectrum,
  generateLFO,
  listAvailableEffects,
  getConnectionStatus,
} from "../lib/dspBridge";
import {
  analyzeTrackWithCodette,
  generateOptimalEffectChain,
} from "../lib/codetteAIDSP";
import { EffectChain, TrackEffectManager } from "../lib/effectChain";
import { getCodetteBridge } from "../lib/codetteBridge";
import type { Track } from "../types";

// Mock audio data
function createMockAudio(duration: number = 1, sampleRate: number = 44100): Float32Array {
  const samples = new Float32Array(duration * sampleRate);
  for (let i = 0; i < samples.length; i++) {
    // Generate a 440 Hz sine wave
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }
  return samples;
}

// Mock track
function createMockTrack(): Track {
  return {
    id: "test-track-1",
    name: "Test Track",
    type: "audio",
    color: "#FF0000",
    muted: false,
    soloed: false,
    armed: false,
    inputGain: 0,
    volume: -6,
    pan: 0,
    stereoWidth: 100,
    phaseFlip: false,
    inserts: [],
    sends: [],
    routing: "master",
  };
}

/**
 * Test DSP Bridge connections
 */
export async function testDSPBridge(): Promise<void> {
  console.log("\n=== Testing DSP Bridge ===\n");

  try {
    // Test 1: Initialize
    console.log("1. Initializing DSP Bridge...");
    const initialized = await initializeDSPBridge();
    console.log(`   ✓ Result: ${initialized}`);

    // Test 2: Get status
    console.log("2. Getting connection status...");
    const status = getConnectionStatus();
    console.log("   ✓ Status:", status);

    // Test 3: List effects
    console.log("3. Listing available effects...");
    const effects = await listAvailableEffects();
    console.log("   ✓ Effects:", effects);

    // Test 4: Analyze levels
    console.log("4. Analyzing audio levels...");
    const audio = createMockAudio(1, 44100);
    const levels = await analyzeLevels(audio);
    console.log("   ✓ Levels:", levels);

    // Test 5: Analyze spectrum
    console.log("5. Analyzing spectrum...");
    const spectrum = await analyzeSpectrum(audio);
    console.log("   ✓ Spectrum bins:", spectrum.num_bins);

    // Test 6: Generate LFO
    console.log("6. Generating LFO...");
    const lfo = await generateLFO(4, "sine", 1.0, 0.5);
    console.log("   ✓ LFO samples:", lfo.length);

    console.log("\n✅ DSP Bridge tests completed!\n");
  } catch (error) {
    console.error("❌ DSP Bridge test failed:", error);
  }
}

/**
 * Test Codette AI integration
 */
export async function testCodetteAI(): Promise<void> {
  console.log("\n=== Testing Codette AI ===\n");

  try {
    // Test 1: Get bridge
    console.log("1. Getting Codette bridge instance...");
    const codette = getCodetteBridge();
    console.log("   ✓ Bridge initialized");

    // Test 2: Health check
    console.log("2. Checking Codette connection...");
    const health = await codette.healthCheck();
    console.log(`   ✓ Health: ${health}`);

    // Test 3: Analyze track
    console.log("3. Analyzing track with Codette...");
    const track = createMockTrack();
    const audio = createMockAudio(1);
    const analysis = await analyzeTrackWithCodette(track, audio, "pop", "energetic");
    console.log(`   ✓ Got ${analysis.length} suggestions`);

    // Test 4: Generate optimal chain
    console.log("4. Generating optimal effect chain...");
    const optimization = await generateOptimalEffectChain(track, audio);
    console.log(`   ✓ Chain: ${optimization.optimizedChain.length} effects`);

    console.log("\n✅ Codette AI tests completed!\n");
  } catch (error) {
    console.error("❌ Codette AI test failed:", error);
  }
}

/**
 * Test Effect Chain functionality
 */
export async function testEffectChain(): Promise<void> {
  console.log("\n=== Testing Effect Chain ===\n");

  try {
    const track = createMockTrack();

    // Test 1: Create chain
    console.log("1. Creating effect chain...");
    const chain = new EffectChain(track);
    console.log("   ✓ Chain created:", chain.getChainInfo());

    // Test 2: Add effects
    console.log("2. Adding effects...");
    const id1 = chain.addEffect("compressor", { threshold: -20, ratio: 4 });
    chain.addEffect("highpass", { cutoff: 100 });
    console.log(`   ✓ Added 2 effects: ${chain.getChainInfo()}`);

    // Test 3: Update effect
    console.log("3. Updating effect parameter...");
    chain.updateEffect(id1, { bypass: true });
    console.log("   ✓ Compressor bypassed");

    // Test 4: Export chain
    console.log("4. Exporting chain...");
    const exported = chain.export();
    console.log(`   ✓ Exported ${exported.nodes.length} nodes`);

    // Test 5: Switch modes
    console.log("5. Switching chain modes...");
    chain.setMode("parallel");
    console.log(`   ✓ Mode: ${chain.getMode()}`);

    console.log("\n✅ Effect Chain tests completed!\n");
  } catch (error) {
    console.error("❌ Effect Chain test failed:", error);
  }
}

/**
 * Test Track Effect Manager
 */
export async function testTrackEffectManager(): Promise<void> {
  console.log("\n=== Testing Track Effect Manager ===\n");

  try {
    const track = createMockTrack();

    // Test 1: Create manager
    console.log("1. Creating track effect manager...");
    const manager = new TrackEffectManager(track);
    console.log("   ✓ Manager created");

    // Test 2: Add and save preset
    console.log("2. Adding effect and saving preset...");
    manager.addEffect("compressor", { threshold: -20 });
    manager.savePreset("test-preset");
    console.log("   ✓ Preset saved");

    // Test 3: Load preset
    console.log("3. Loading preset...");
    manager.getEffectChain().clear();
    const loaded = manager.loadPreset("test-preset");
    console.log(`   ✓ Loaded: ${loaded}`);

    // Test 4: Get chain info
    console.log("4. Getting chain info...");
    const info = manager.getChainInfo();
    console.log(`   ✓ Chain: ${info}`);

    console.log("\n✅ Track Effect Manager tests completed!\n");
  } catch (error) {
    console.error("❌ Track Effect Manager test failed:", error);
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("Backend-Frontend Integration Tests");
  console.log("=".repeat(50));

  await testDSPBridge();
  await testCodetteAI();
  await testEffectChain();
  await testTrackEffectManager();

  console.log("\n" + "=".repeat(50));
  console.log("✅ All tests completed!");
  console.log("=".repeat(50) + "\n");
}

export default {
  testDSPBridge,
  testCodetteAI,
  testEffectChain,
  testTrackEffectManager,
  runAllTests,
};
