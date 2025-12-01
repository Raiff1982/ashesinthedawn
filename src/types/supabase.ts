/**
 * Supabase Database Types
 * Auto-generated from schema - do NOT edit manually
 * Run: supabase gen types typescript --schema public > src/types/supabase.ts
 */

// ============================================================================
// USER & ADMIN MANAGEMENT
// ============================================================================

export interface AdminUser {
  id: number;
  user_id: string; // UUID foreign key to auth.users
  created_at?: string;
}

export interface UserRole {
  id: string; // UUID
  user_id: string; // UUID foreign key to auth.users
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}

export interface UserFeedback {
  id: string; // UUID
  task_id: string;
  participant_role?: string;
  organization?: string;
  rating?: number; // 1-5
  feedback: string;
  preferred_system?: string;
  completion_time?: number; // seconds
  task_type?: string;
  created_at?: string;
}

export interface UserStudySession {
  id: string; // UUID
  session_id: string; // unique
  participant_id: string;
  study_type: string;
  start_time: string; // timestamp
  end_time?: string; // timestamp
  tasks_completed: number;
  total_tasks: number;
  overall_satisfaction?: number;
  would_recommend?: boolean;
  created_at?: string;
}

// ============================================================================
// CHAT & MESSAGING
// ============================================================================

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatHistory {
  id: string; // UUID
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CODETTE AI - CORE
// ============================================================================

export interface MusicKnowledge {
  id: string; // UUID
  topic: string;
  category: string; // 'mixing', 'mastering', 'production', 'music_theory', etc.
  suggestion: {
    title: string;
    description: string;
    context?: string;
    tools?: string[];
    [key: string]: any;
  };
  confidence: number; // 0-1, default 0.85
  embedding?: number[]; // 1536-dimensional vector for similarity search
  fts?: string; // Full-text search vector (auto-generated)
  created_at?: string;
  updated_at?: string;
}

export interface CodetteFile {
  id: string; // UUID
  filename: string;
  storage_path: string;
  file_type: string; // 'audio', 'document', 'project', etc.
  uploaded_at: string;
  created_at: string;
}

export interface CodetteRecord {
  FileName: string;
  ContentSnippet: string;
}

export interface EthicalCodeGeneration {
  id: string; // UUID
  prompt: string;
  generated_code: string;
  language: string; // 'python', 'typescript', 'javascript', etc.
  verification_status: 'verified' | 'testing' | 'failed';
  ethical_score: number; // 0-1
  transparency_report: Record<string, any>;
  execution_test: Record<string, any>;
  created_at?: string;
}

// ============================================================================
// EMOTIONAL & CREATIVE SYSTEMS
// ============================================================================

export interface Cocoon {
  id: string; // UUID
  user_id: string; // UUID foreign key to auth.users
  title: string;
  summary: string;
  quote?: string;
  emotion: 'compassion' | 'curiosity' | 'fear' | 'joy' | 'sorrow' | 'ethics' | 'quantum';
  tags: string[];
  intensity: number; // 0-1, default 0.5
  encrypted: boolean;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface EmotionalWeb {
  id: string; // UUID
  user_id: string; // UUID foreign key to auth.users
  emotion: 'compassion' | 'curiosity' | 'fear' | 'joy' | 'sorrow' | 'ethics' | 'quantum';
  nodes: Array<{
    id: string;
    label: string;
    value?: number;
    [key: string]: any;
  }>;
  connections: Array<{
    source: string;
    target: string;
    strength?: number;
    [key: string]: any;
  }>;
  quantum_state?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface Memory {
  id: number;
  timestamp: string; // timezone aware
  emotion_tag: string;
  content: string;
  action: 'add' | 'update' | 'delete';
  created_at?: string;
}

export interface Signal {
  id: number;
  timestamp: string;
  mode: string;
  input_signal: string;
  filtered_signal: string;
  anchors?: Record<string, any>;
  dynamics_result?: Record<string, any>;
  council_decision?: Record<string, any>;
  created_at?: string;
}

export interface WhatToDo {
  Uncertainty: string;
  Method: string;
  Description: string;
}

// ============================================================================
// API & SYSTEM MANAGEMENT
// ============================================================================

export interface ApiConfig {
  id: string; // UUID
  service_name: string; // unique
  api_url: string;
  api_key: string; // encrypted in DB
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiMetric {
  id: string; // UUID
  endpoint: string;
  method: string; // GET, POST, PUT, DELETE, etc.
  response_time: number; // milliseconds
  status_code: number;
  user_agent?: string;
  ip_address?: string;
  request_size?: number; // bytes
  response_size?: number; // bytes
  created_at?: string;
}

export interface AiCache {
  id: string; // UUID
  cache_key: string; // unique
  response: Record<string, any>;
  created_at?: string;
  expires_at: string;
  access_count: number;
}

// ============================================================================
// BENCHMARKING & ANALYSIS
// ============================================================================

export interface BenchmarkResult {
  id: string; // UUID
  test_type: string; // 'music_theory', 'mixing_advice', 'mastering', etc.
  query: string;
  codette_score: number;
  competitor_scores: Record<string, number>;
  improvement: number; // percentage
  processing_time: number; // milliseconds
  statistical_significance?: number;
  test_conditions?: string;
  created_at?: string;
}

export interface CompetitorAnalysis {
  id: string; // UUID
  competitor: string;
  metric: string;
  codette_value: number;
  competitor_value: number;
  improvement: number; // percentage
  test_date: string; // date only
  methodology?: string;
  sample_size?: number;
  confidence_interval?: number; // percentage
  created_at?: string;
}

// ============================================================================
// LEGACY / MISC TABLES
// ============================================================================

export interface Document {
  id: number;
  content?: string;
  metadata?: Record<string, any>;
}

export interface HoaxFilter {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  status?: string;
}

export interface NewTableName {
  id: number;
  inserted_at: string;
  updated_at: string;
  data?: Record<string, any>;
  name?: string;
}

export interface TableName {
  id: number;
  inserted_at: string;
  updated_at: string;
  data?: Record<string, any>;
  name?: string;
}

export interface Todo {
  id: number;
  task: string;
  completed: boolean;
  updated_at: string;
  function: Record<string, any>; // unique
}

// ============================================================================
// COMPOSITE TYPES & ENUMS
// ============================================================================

export type Emotion = 'compassion' | 'curiosity' | 'fear' | 'joy' | 'sorrow' | 'ethics' | 'quantum';
export type VerificationStatus = 'verified' | 'testing' | 'failed';
export type ChatRole = 'user' | 'assistant';

// ============================================================================
// DATABASE VIEW TYPES (if needed)
// ============================================================================

export interface UserWithRoles {
  id: string;
  email?: string;
  roles: UserRole[];
}

export interface MusicKnowledgeWithEmbedding extends MusicKnowledge {
  similarity_score?: number; // Used in search results
  usage_count?: number; // Denormalized for performance
}
