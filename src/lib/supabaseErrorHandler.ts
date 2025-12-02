/**
 * Supabase Error Handler & Fallback System
 * Gracefully handles missing tables and RLS errors by falling back to local storage
 */

export interface QueryResult<T> {
  data: T | T[] | null;
  error: { message: string; code?: string } | null;
}

/**
 * Check if error is due to missing table (404)
 */
export function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const message = error.message || '';
  return (
    code === '42P01' || // PostgreSQL missing relation
    code === 404 ||
    message.includes('does not exist') ||
    message.includes('not found')
  );
}

/**
 * Check if error is due to RLS policy (401/403)
 */
export function isRLSError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const message = error.message || '';
  return (
    code === '42501' || // PostgreSQL RLS violation
    code === '401' ||
    code === '403' ||
    message.includes('row-level security') ||
    message.includes('violates row-level security')
  );
}

/**
 * Check if error is due to missing constraint (400)
 */
export function isConstraintError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.status;
  const message = error.message || '';
  return (
    code === '42P10' || // PostgreSQL constraint not found
    code === '400' ||
    message.includes('constraint') ||
    message.includes('no unique or exclusion constraint')
  );
}

/**
 * Wrap Supabase query with fallback to local storage
 */
export async function withFallback<T>(
  operation: () => Promise<QueryResult<T>>,
  localStorageFallback: () => Promise<QueryResult<T>>,
  operationName: string = 'database_operation'
): Promise<QueryResult<T>> {
  try {
    const result = await operation();

    // Check for Supabase errors
    if (result.error) {
      const error = result.error as any;

      if (
        isMissingTableError(error) ||
        isRLSError(error) ||
        isConstraintError(error)
      ) {
        console.warn(
          `[Supabase Fallback] ${operationName} failed with Supabase (${error.code}), falling back to local storage`,
          error.message
        );
        try {
          return await localStorageFallback();
        } catch (fallbackError) {
          console.error(
            `[Supabase Fallback] Local storage fallback also failed:`,
            fallbackError
          );
          return result; // Return original error
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`[Supabase Fallback] ${operationName} threw exception:`, error);

    // Try fallback on exception
    try {
      return await localStorageFallback();
    } catch (fallbackError) {
      console.error(
        `[Supabase Fallback] Local storage fallback also failed:`,
        fallbackError
      );
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'FALLBACK_FAILED',
        },
      };
    }
  }
}

/**
 * Create a simple in-memory cache for frequently accessed data
 */
export class FallbackCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, _ttlMs?: number): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Demo/Offline mode configuration
 */
export interface OfflineConfig {
  enableOfflineMode: boolean;
  enableLocalStorage: boolean;
  enableMemoryCache: boolean;
  cacheTTL: number; // milliseconds
}

export const defaultOfflineConfig: OfflineConfig = {
  enableOfflineMode: true,
  enableLocalStorage: true,
  enableMemoryCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
};

/**
 * Global offline configuration
 */
let offlineConfig = { ...defaultOfflineConfig };

export function setOfflineConfig(config: Partial<OfflineConfig>): void {
  offlineConfig = { ...offlineConfig, ...config };
}

export function getOfflineConfig(): OfflineConfig {
  return { ...offlineConfig };
}
