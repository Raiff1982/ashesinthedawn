/**
 * Codette Bridge Service
 * Handles HTTP communication between React frontend and Codette Python backend
 * 
 * Backend endpoints:
 * - http://localhost:8000/ (FastAPI unified server)
 * 
 * Authentication: Includes Supabase credentials for backend verification
 */

export interface CodetteBridgeConfig {
  backendUrl: string;
  timeout: number;
  retryAttempts: number;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface CodettePrediction {
  id: string;
  type: 'session' | 'mixing' | 'routing' | 'mastering' | 'creative' | 'gain';
  prediction: string;
  confidence: number;
  actionItems: Array<{
    action: string;
    parameter: string;
    value: number | string;
    priority: 'high' | 'medium' | 'low';
  }>;
  reasoning: string;
  timestamp: number;
}

export interface CodetteResponse {
  success: boolean;
  data: CodettePrediction | null;
  error?: string;
  duration: number;
}

class CodetteBridgeService {
  private config: CodetteBridgeConfig;
  private isHealthy: boolean = false;
  private analysisCache: Map<string, CodettePrediction> = new Map();

  constructor(config?: Partial<CodetteBridgeConfig>) {
    this.config = {
      backendUrl: import.meta.env.VITE_CODETTE_API || 'http://localhost:8000',
      timeout: parseInt(import.meta.env.VITE_CODETTE_TIMEOUT || '10000'),
      retryAttempts: parseInt(import.meta.env.VITE_CODETTE_RETRIES || '3'),
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      ...config,
    };

    this.initializeConnection();
  }

  /**
   * Initialize connection to Codette backend
   */
  private async initializeConnection(): Promise<void> {
    // Disabled to prevent infinite loop - backend health check will happen on demand
    try {
      setTimeout(async () => {
        try {
          const response = await this.healthCheck();
          this.isHealthy = response.success;
          if (this.isHealthy) {
            console.log('🌉 Codette Bridge connected successfully');
          }
        } catch (error) {
          console.warn('⚠️ Codette Backend unavailable', error);
          this.isHealthy = false;
        }
      }, 5000); // Delay health check by 5 seconds
    } catch (error) {
      console.warn('⚠️ Codette initialization deferred', error);
      this.isHealthy = false;
    }
  }

  /**
   * Build request headers with Supabase authentication
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Supabase authentication if available
    if (this.config.supabaseKey) {
      headers['Authorization'] = `Bearer ${this.config.supabaseKey}`;
    }

    return headers;
  }

  /**
   * Check if backend is healthy
   */
  async healthCheck(): Promise<CodetteResponse> {
    try {
      const response = await fetch(`${this.config.backendUrl}/health`, {
        method: 'GET',
      });
      if (response.ok) {
        return { success: true, data: null, duration: 0 };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, data: null, error: 'Health check failed', duration: 0 };
    }
  }

  /**
   * Check if bridge is connected to backend
   */
  isConnected(): boolean {
    return this.isHealthy;
  }

  /**
   * Analyze session with Codette backend
   */
  async analyzeSession(context: {
    trackCount: number;
    totalDuration: number;
    sampleRate: number;
    trackMetrics: Array<{
      trackId: string;
      name: string;
      type: string;
      level: number;
      peak: number;
      plugins: string[];
    }>;
    masterLevel: number;
    masterPeak: number;
    hasClipping: boolean;
  }): Promise<CodettePrediction> {
    const cacheKey = `session_${JSON.stringify(context).slice(0, 100)}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const response = await this.makeRequest('POST', '/codette/analyze', context);
    if (response.success && response.data) {
      const data = response.data as any;
      const prediction: CodettePrediction = {
        id: `session_${Date.now()}`,
        type: 'session',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: 'Full session analysis',
        timestamp: Date.now(),
      };
      this.analysisCache.set(cacheKey, prediction);
      return prediction;
    }
    throw new Error(response.error || 'Session analysis failed');
  }

  /**
   * Get mixing intelligence for a specific track
   */
  async getMixingIntelligence(trackType: string, metrics: {
    level: number;
    peak: number;
    plugins: string[];
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/codette/analyze', {
      trackType,
      metrics,
    });
    if (response.success && response.data) {
      // Transform flat response into CodettePrediction format
      const data = response.data as any;
      return {
        id: `mixing_${Date.now()}`,
        type: 'mixing',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: `Analysis for ${trackType} track`,
        timestamp: Date.now(),
      };
    }
    throw new Error(response.error || 'Mixing analysis failed');
  }

  /**
   * Get routing intelligence
   */
  async getRoutingIntelligence(context: {
    trackCount: number;
    trackTypes: string[];
    hasAux: boolean;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/codette/analyze', context);
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        id: `routing_${Date.now()}`,
        type: 'routing',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: 'Routing analysis',
        timestamp: Date.now(),
      };
    }
    throw new Error(response.error || 'Routing analysis failed');
  }

  /**
   * Get mastering intelligence
   */
  async getMasteringIntelligence(levels: {
    masterLevel: number;
    masterPeak: number;
    hasClipping: boolean;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/codette/analyze', levels);
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        id: `mastering_${Date.now()}`,
        type: 'mastering',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: 'Mastering analysis',
        timestamp: Date.now(),
      };
    }
    throw new Error(response.error || 'Mastering analysis failed');
  }

  /**
   * Get creative suggestions
   */
  async getCreativeIntelligence(context: {
    trackTypes: string[];
    sessionDuration: number;
    trackCount: number;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/codette/analyze', context);
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        id: `creative_${Date.now()}`,
        type: 'creative',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: 'Creative suggestions',
        timestamp: Date.now(),
      };
    }
    throw new Error(response.error || 'Creative analysis failed');
  }

  /**
   * Send gain staging recommendation request
   */
  async getGainStagingAdvice(tracks: Array<{
    id: string;
    level: number;
    peak: number;
  }>): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/codette/analyze', { tracks });
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        id: `gain_${Date.now()}`,
        type: 'gain',
        prediction: data.prediction,
        confidence: data.confidence,
        actionItems: data.actionItems || [],
        reasoning: 'Gain staging analysis',
        timestamp: Date.now(),
      };
    }
    throw new Error(response.error || 'Gain staging analysis failed');
  }

  /**
   * Get suggestions for a track (primary method used by DAW)
   * Backend returns: { suggestions: [{ type, title, description, confidence }, ...], confidence, timestamp }
   */
  async getSuggestions(context: {
    type: string;
    track_type: string;
    mood: string;
  }): Promise<{ suggestions: Array<{ id: string; title: string; description: string; type: string; confidence: number; parameters: Record<string, any> }> }> {
    try {
      // Wrap context in request object as backend expects
      const requestBody = { context, limit: 5 };
      
      // Make direct fetch call to bypass makeRequest data transformation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.backendUrl}/codette/suggest`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Backend returns { suggestions: [...], confidence, timestamp }
      if (data.suggestions && Array.isArray(data.suggestions)) {
        return {
          suggestions: data.suggestions.map((s: any) => ({
            id: s.id || `suggestion-${Date.now()}-${Math.random()}`,
            title: s.title || 'Suggestion',
            description: s.description || '',
            type: s.type || 'effect',
            confidence: s.confidence || 0.8,
            parameters: s.parameters || {},
          })),
        };
      }
      
      return { suggestions: [] };
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Stream real-time analysis (if backend supports it)
   */
  async *streamAnalysis(context: Record<string, unknown>): AsyncGenerator<CodettePrediction, void, unknown> {
    try {
      const response = await fetch(`${this.config.backendUrl}/codette/analyze`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(context),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data as CodettePrediction;
            } catch (e) {
              console.warn('Failed to parse stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Streaming not available:', error);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    body: Record<string, unknown> | null,
    retryCount: number = this.config.retryAttempts
  ): Promise<CodetteResponse> {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(`${this.config.backendUrl}${endpoint}`, {
          method,
          headers: {
            ...this.buildHeaders(),
            'X-Codette-Request': 'true',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = performance.now() - startTime;

        console.log(`📡 Codette ${method} ${endpoint} completed in ${duration.toFixed(0)}ms`);

        return {
          success: true,
          data: data as CodettePrediction,
          duration,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';

      if (retryCount > 0 && (errorName === 'AbortError' || errorMessage.includes('Failed to fetch'))) {
        console.warn(`⚠️ Request failed, retrying... (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest(method, endpoint, body, retryCount - 1);
      }

      console.error(`❌ Codette request failed:`, errorMessage);

      return {
        success: false,
        data: null,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    console.log('🗑️ Codette analysis cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.analysisCache.size,
      entries: Array.from(this.analysisCache.keys()),
    };
  }
}

// Singleton instance
let bridgeInstance: CodetteBridgeService | null = null;

/**
 * Get or create Codette Bridge service instance
 */
export function getCodetteBridge(config?: Partial<CodetteBridgeConfig>): CodetteBridgeService {
  if (!bridgeInstance) {
    bridgeInstance = new CodetteBridgeService(config);
  }
  return bridgeInstance;
}

export default CodetteBridgeService;
