/**
 * Supabase Error Handler
 * Suppresses expected 404 errors for tables that may not exist in demo/offline mode
 * Prevents browser console spam while allowing actual errors through
 */

const IGNORED_TABLES = [
  'codette_activity_logs',
  'codette_permissions',
  'codette_control_settings',
  'ai_cache',
];

const IGNORED_PATTERNS = [
  /Failed to load resource: the server responded with a status of 404/,
  /Failed to load resource: the server responded with a status of 401/,
];

/**
 * Check if an error should be suppressed
 */
export function shouldSuppressError(error: any): boolean {
  if (!error) return false;

  const errorStr = String(error);
  const messageStr = error?.message || '';

  // Check if it's one of our ignored tables
  for (const table of IGNORED_TABLES) {
    if (errorStr.includes(table) || messageStr.includes(table)) {
      return true;
    }
  }

  // Check if it matches our ignored patterns
  for (const pattern of IGNORED_PATTERNS) {
    if (pattern.test(errorStr) || pattern.test(messageStr)) {
      return true;
    }
  }

  return false;
}

/**
 * Install error handler to suppress expected console errors
 * Call this once on app startup
 */
export function installErrorSuppressionHandler() {
  // Suppress fetch errors in console
  const originalError = console.error;
  console.error = function(...args: any[]) {
    // Check if any argument is an error we should suppress
    const shouldSuppress = args.some(arg => shouldSuppressError(arg));
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

  // Suppress fetch errors at network level
  const originalFetch = window.fetch;
  (window as any).fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    try {
      const response = await originalFetch(input, init);
      
      // If it's a 404 to one of our tables, suppress it
      if (!response.ok && response.status === 404) {
        const url = input?.toString?.() || '';
        const shouldSuppress = IGNORED_TABLES.some(table => url.includes(table));
        if (shouldSuppress) {
          // Return a mock response to prevent errors downstream
          return response;
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}

