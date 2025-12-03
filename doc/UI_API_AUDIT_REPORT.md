# UI → Backend API Call Audit Report

**Date**: December 1, 2025  
**Status**: 🔴 ISSUES FOUND - Ready to Fix

---

## 1. Current Flow Analysis

### Frontend → Backend Call Chain

```
CodetteMasterPanel.tsx
    ↓
useCodette hook (sendMessage)
    ↓
codetteAIEngine.ts (sendMessage)
    ↓
fetch POST /codette/chat
    ↓
codette_server_unified.py (chat_endpoint)
```

### What the UI Sends
**File**: `src/lib/codetteAIEngine.ts` (line 627)

```typescript
const response = await fetch(`${this.apiUrl}/codette/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: message,
    perspective: 'mix_engineering',
    context: this.chatHistory.slice(-5),
  }),
});
```

**Payload Structure**:
```json
{
  "message": "user input text",
  "perspective": "mix_engineering",
  "context": [{"role": "...", "content": "...", "timestamp": ...}]
}
```

✅ **CORRECT**: Matches `ChatRequest` model in backend

---

## 2. Backend Expectation

**File**: `codette_server_unified.py` (line 342)

```python
class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    context: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None
```

✅ **Backend Request Model Matches Frontend Send**

---

## 3. Backend Response

**File**: `codette_server_unified.py` (line 348)

```python
class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
```

### What Backend Returns
Example from backend (line 1115):

```python
return ChatResponse(
    response=response,
    perspective=perspective_source or "mix_engineering",
    confidence=min(confidence, 1.0),
    timestamp=get_timestamp(),
)
```

**Response Structure**:
```json
{
  "response": "🎚️ **mix_engineering**: ...\n📊 **audio_theory**: ...",
  "perspective": "mix_engineering",
  "confidence": 1.0,
  "timestamp": "2025-12-01T10:30:00Z"
}
```

---

## 4. Frontend Response Parsing

**File**: `src/lib/codetteAIEngine.ts` (line 627)

```typescript
const data = await response.json();
let responseText = data.response || data.message || 'No response received';

// Clean up multi-perspective analysis format
responseText = this.formatCodetteResponse(responseText);
```

### ISSUE FOUND 🔴

**Location**: `src/lib/codetteAIEngine.ts` (line 642)  
**Method**: `formatCodetteResponse()` - **NOT IMPLEMENTED**

```typescript
// The method is called but never defined!
responseText = this.formatCodetteResponse(responseText);
```

**Result**: Response text is not being formatted, multi-perspective response shows raw format.

---

## 5. UI Display Issues

### CodetteMasterPanel.tsx - ChatTab Component

**Location**: Line 250 in `CodetteMasterPanel.tsx`

```typescript
const formatMessage = (content: string, role: string) => {
  if (role !== 'assistant') return content;

  // Detects multi-perspective format
  const perspectiveMarkers = [
    'mix_engineering',
    'audio_theory',
    'creative_production',
    'technical_troubleshooting',
    'workflow_optimization'
  ];
  
  const hasPerspectives = perspectiveMarkers.some(marker => 
    content.includes(`**${marker}**`)
  );
```

**ISSUE**: The `formatMessage` function is defined in the component, but it's PARSING correctly already.

**Root Cause**: The `formatCodetteResponse()` in codetteAIEngine is not implemented, so raw response text reaches the parser with incorrect formatting.

---

## 6. Summary of Issues

| # | Component | Issue | Severity | Impact |
|---|-----------|-------|----------|--------|
| 1 | codetteAIEngine.ts | `formatCodetteResponse()` not implemented | 🔴 HIGH | Multi-perspective format not cleaned |
| 2 | codetteAIEngine.ts | Response doesn't go through formatting pipeline | 🔴 HIGH | Parser receives malformed text |
| 3 | CodetteMasterPanel.tsx | Depending on text format that isn't generated | 🟡 MEDIUM | Response display may fail for edge cases |

---

## 7. Fix Required

### Step 1: Implement `formatCodetteResponse()` in codetteAIEngine.ts

**Purpose**: Ensure multi-perspective response is properly formatted before display

**Current**: Method called but not defined (line 642)  
**Fix**: Implement the method to ensure response has correct format:
- Each perspective on new line
- Format: `🎚️ **perspective_name**: [engine] content`
- Preserve all 5 perspectives

### Step 2: Verify End-to-End Flow

**Test Path**:
1. UI sends: `{ message: "test", perspective: "mix_engineering", context: [...] }`
2. Backend receives: `ChatRequest` model validates
3. Backend returns: `{ response: "🎚️ **mix_engineering**: ...", perspective: "mix_engineering", confidence: 1.0 }`
4. Frontend parses: `formatCodetteResponse()` cleans response
5. UI displays: Multi-perspective bubbles with icons

---

## 8. Files to Modify

1. ✏️ `src/lib/codetteAIEngine.ts` - Implement `formatCodetteResponse()` method
2. ✅ `src/lib/codetteAIEngine.ts` - Verify sendMessage calls formatCodetteResponse
3. ✅ `src/components/CodetteMasterPanel.tsx` - formatMessage parser (already correct)
4. ✅ `codette_server_unified.py` - Backend already correct

---

## Verification Checklist

- [ ] formatCodetteResponse() implemented
- [ ] Response contains all 5 perspectives with icons
- [ ] Each perspective on separate line
- [ ] Format matches parser expectation: `**perspective_name**:`
- [ ] Test: Send "hello" → Receive multi-perspective response
- [ ] Test: Send training example question → Response shows training pattern
- [ ] UI displays all 5 perspective bubbles with correct icons

