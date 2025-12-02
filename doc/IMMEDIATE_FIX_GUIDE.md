# CoreLogic Studio - Immediate Fix Guide

**Priority**: Fix critical issues to make app functional  
**Time Estimate**: 1-2 hours  
**Difficulty**: Medium  

---

## FIXES IN ORDER

### FIX #1: Start Backend Server (5 minutes)

**Status**: 🔴 **CRITICAL** - All AI features depend on this

**Current Problem**:
- Backend not running
- All API calls to `/codette/*` fail silently
- Chat, analysis, file operations broken

**Solution**:

```bash
# Terminal 1: Navigate to workspace
cd i:\ashesinthedawn

# Terminal 2: Start backend
python codette_server.py
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Verify**:
```bash
# In another terminal, test connection
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

**✅ Success Criteria**:
- Backend terminal shows "Application startup complete"
- `curl http://localhost:8000/health` returns 200

---

### FIX #2: Fix Hardcoded Demo User (10 minutes)

**Status**: 🔴 **CRITICAL** - Breaks multi-user features

**Current Problem**:
- File: `src/components/CodettePanel.tsx` (line 66)
- All users show as `demo-user`
- User preferences not persisted
- No authentication

**Solution Option A: Use Environment Variables (Recommended for now)**

Create `.env.local`:
```bash
VITE_DEMO_USER_ID=demo-user
VITE_DEMO_USER_NAME=Demo User
VITE_AUTH_ENABLED=false
```

Update `src/components/CodettePanel.tsx`:
```typescript
// Line 66: Replace
const userId = 'demo-user'; // TODO: Replace with actual auth user ID

// With
const userId = import.meta.env.VITE_DEMO_USER_ID || 'anonymous-user';
const userName = import.meta.env.VITE_DEMO_USER_NAME || 'User';
```

**Solution Option B: Use Supabase Auth (Better long-term)**

Install Supabase client:
```bash
npm install @supabase/supabase-js
```

Update `src/lib/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Update `CodettePanel.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function CodettePanel() {
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || 'anonymous');
    };
    getUser();
  }, []);
  
  // Rest of component...
}
```

**✅ Success Criteria**:
- `npm run typecheck` passes
- No TypeScript errors in CodettePanel.tsx
- User ID can be changed via environment or auth

---

### FIX #3: Add Error Handling to useCodette (30 minutes)

**Status**: 🟠 **HIGH** - Chat fails silently

**Current Problem**:
- File: `src/hooks/useCodette.ts`
- Network errors caught but not displayed
- Methods return `null` with no explanation
- No retry logic

**Solution**:

```typescript
// src/hooks/useCodette.ts - Around line 140

// ADD THIS: Network error handler
const handleNetworkError = (error: Error, context: string) => {
  console.error(`[useCodette] ${context}:`, error);
  setError(new Error(`Connection failed: ${error.message}`));
  onError?.(new Error(`Could not ${context}: ${error.message}`));
};

// REPLACE: sendMessage function
const sendMessage = useCallback(
  async (message: string, dawContext?: Record<string, unknown>): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      setChatHistory(prev => [...prev, {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      }]);

      // ADD TIMEOUT
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`${apiUrl}/codette/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            user_id: userId, // Add user context
            daw_context: dawContext || {},
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // ADD VALIDATION
        if (!data || typeof data.response !== 'string') {
          throw new Error('Invalid response format from backend');
        }

        const assistantMessage: CodetteChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
          source: data.source || 'codette_engine',
          confidence: data.confidence || 0.5,
          ml_score: data.ml_score,
        };

        setChatHistory(prev => [...prev, assistantMessage]);
        return assistantMessage.content;
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.name === 'AbortError') {
          throw new Error('Request timed out (5s) - backend may be slow or offline');
        }
        throw timeoutError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      handleNetworkError(error, 'send message');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  },
  [apiUrl, onError]
);
```

**✅ Success Criteria**:
- TypeScript errors cleared
- Chat errors show helpful messages
- 5-second timeout prevents hanging
- Console logs error details

---

### FIX #4: Add Simple Error Boundary (15 minutes)

**Status**: 🟠 **HIGH** - App crashes silently on errors

**Current Problem**:
- File: `src/components/ErrorBoundary.tsx`
- Errors don't show to user
- No recovery mechanism

**Solution**:

```typescript
// src/components/ErrorBoundary.tsx

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 0 };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error);
    console.error('Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-300">
          <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4 max-w-md">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 ml-2"
          >
            Refresh page
          </button>
          <details className="mt-8 text-xs">
            <summary>Error details</summary>
            <pre className="bg-gray-900 p-2 mt-2 rounded overflow-auto">
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Update `src/main.tsx`:
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

**✅ Success Criteria**:
- App doesn't crash silently
- Error message shown to user
- "Try again" button available

---

### FIX #5: Test Backend Connectivity (15 minutes)

**Status**: 🟡 **MEDIUM** - Verify integration working

**Current Problem**:
- Frontend can't reach backend
- Network requests fail
- No indication why

**Solution**:

Create `src/lib/healthCheck.ts`:
```typescript
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`Backend health check failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Backend connected:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}
```

Add to `App.tsx` or `main.tsx`:
```typescript
import { useEffect } from 'react';
import { checkBackendHealth } from './lib/healthCheck';

export function App() {
  useEffect(() => {
    checkBackendHealth().then(isHealthy => {
      if (isHealthy) {
        console.log('🎉 All systems ready');
      } else {
        console.warn('⚠️ Backend not connected - chat features may not work');
      }
    });
  }, []);

  return (
    // existing app content
  );
}
```

**Manual Test**:
```bash
# Terminal 1: Backend running
python codette_server.py

# Browser console: Verify message
console.log('✅ Backend connected')
```

**✅ Success Criteria**:
- Browser console shows "✅ Backend connected"
- Or "⚠️ Backend not connected" if not running

---

### FIX #6: Add Retry Logic (20 minutes)

**Status**: 🟡 **MEDIUM** - Network resilience

**Current Problem**:
- Single request failure breaks everything
- No retry mechanism
- Network hiccups cause permanent failures

**Solution**:

Create `src/lib/retryFetch.ts`:
```typescript
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

export async function retryFetch(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoffMultiplier = 2,
    timeoutMs = 5000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response; // Don't retry client errors
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.warn(
          `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`,
          lastError.message
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
```

Update `useCodette.ts` to use retryFetch:
```typescript
import { retryFetch } from '../lib/retryFetch';

// In sendMessage:
const response = await retryFetch(`${apiUrl}/codette/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, daw_context: dawContext }),
  maxAttempts: 3,
  delayMs: 100,
});
```

**✅ Success Criteria**:
- Temporary network issues don't break chat
- Retries happen automatically
- Console shows retry messages

---

## VERIFICATION CHECKLIST

After applying all fixes:

- [ ] Backend running: `python codette_server.py`
- [ ] Frontend running: `npm run dev`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No lint errors: `npm run lint`
- [ ] Browser opens to `http://localhost:5173`
- [ ] Console shows "✅ Backend connected"
- [ ] Can type in Codette chat and get response
- [ ] Error boundary visible if something crashes
- [ ] Network tab shows `/codette/chat` returning 200
- [ ] No hardcoded `demo-user` in code

---

## QUICK START AFTER FIXES

```bash
# Terminal 1: Backend
python codette_server.py

# Terminal 2: Frontend  
npm run dev

# Browser
http://localhost:5173

# Verify in browser console
console.log('✅ Ready to test!')
```

---

## NEXT PRIORITIES (After These Fixes)

1. **File System**: Replace mock with real file upload
2. **Project Persistence**: Implement save/load
3. **Audio Playback**: Test Web Audio API with real files
4. **Authentication**: Replace demo-user with real auth
5. **UI Polish**: Error messages, loading states

---

## GETTING HELP

If fixes don't work:

1. Check `DIAGNOSTIC_REPORT.md` for step-by-step testing
2. Check `BROKEN_FUNCTIONALITY_AUDIT.md` for detailed issue explanations
3. Check browser console (`F12 → Console`) for errors
4. Check backend terminal for logs
5. Check Network tab (`F12 → Network`) for API failures

All three documents are in the workspace root: `i:\ashesinthedawn\`
