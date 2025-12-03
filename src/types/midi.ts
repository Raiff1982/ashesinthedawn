/**
 * MIDI Data Types
 * Core interfaces for MIDI note representation and sequencing
 */

/**
 * Individual MIDI Note
 * Represents a single note event in a MIDI sequence
 */
export interface MIDINote {
  id: string;              // Unique identifier
  pitch: number;           // 0-127 (C-1 to G9)
  startTime: number;       // seconds from sequence start
  duration: number;        // seconds (length of note)
  velocity: number;        // 0-127 (note volume/intensity)
  channel: number;         // 0-15 (MIDI channel)
}

/**
 * MIDI Sequence
 * Collection of MIDI notes with timing and playback info
 */
export interface MIDISequence {
  id: string;
  name: string;
  notes: MIDINote[];
  bpm: number;             // Beats per minute (120-240 typical)
  timeSignature: [number, number];  // [beats, noteValue] (4/4 typical)
  length: number;          // Total sequence length in seconds
  loop: boolean;           // Loop playback
}

/**
 * MIDI Track
 * Links MIDI sequence to an audio track for playback
 */
export interface MIDITrack {
  id: string;
  audioTrackId: string;    // Reference to audio track
  sequence: MIDISequence;
  isRecording: boolean;
  recordingStartTime: number;  // Time when recording started
}

/**
 * Pitch constants for note names
 */
export const MIDI_NOTES = {
  'C': 0,
  'C#': 1,
  'Db': 1,
  'D': 2,
  'D#': 3,
  'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'Gb': 6,
  'G': 7,
  'G#': 8,
  'Ab': 8,
  'A': 9,
  'A#': 10,
  'Bb': 10,
  'B': 11,
} as const;

/**
 * Standard MIDI note range
 */
export const MIDI_RANGE = {
  MIN: 0,      // C-1
  MAX: 127,    // G9
  OCTAVE_SIZE: 12,
} as const;

/**
 * Common note durations in beats
 */
export const NOTE_DURATIONS = {
  WHOLE: 4,
  HALF: 2,
  QUARTER: 1,
  EIGHTH: 0.5,
  SIXTEENTH: 0.25,
  THIRTYSECOND: 0.125,
} as const;
