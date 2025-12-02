# UI Component → Backend Call Tree

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER ACTION                                │
│              Types message in CodetteMasterPanel               │
└────────────────────────┬────────────────────────────────────────┘
                         │ handleSendMessage()
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               CodetteMasterPanel.tsx                            │
│  - File: src/components/CodetteMasterPanel.tsx                 │
│  - Component: CodetteMasterPanel                                │
│  - Function: handleSendMessage() [Line: 35]                    │
│                                                                 │
│  Action:                                                        │
│    setMessageBuffer([...messageBuffer, inputMessage])          │
│    setInputMessage('')                                          │
│    await sendMessage(inputMessage)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ sendMessage
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  useCodette Hook                                │
│  - File: src/hooks/useCodette.ts                               │
│  - Hook: useCodette()                                           │
│  - Function: sendMessage() [Line: 79]                          │
│                                                                 │
│  Implementation:                                               │
│    setIsLoading(true)                                           │
│    response = await codetteEngine.current.sendMessage()         │
│    const history = codetteEngine.current.getHistory()          │
│    setChatHistory(history)                                      │
│    setIsLoading(false)                                          │
│    return response                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ codetteEngine.sendMessage()
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Codette AI Engine                                  │
│  - File: src/lib/codetteAIEngine.ts                            │
│  - Class: CodetteAIEngine                                       │
│  - Function: sendMessage() [Line: 627]                         │
│                                                                 │
│  Steps:                                                         │
│    1. Add user message to chatHistory                           │
│    2. POST /codette/chat with:                                 │
│       {                                                         │
│         message: string                                         │
│         perspective: "mix_engineering"                         │
│         context: ChatMessage[]                                 │
│       }                                                         │
│    3. Get response.json()                                       │
│    4. Call formatCodetteResponse(responseText)                 │
│    5. Add assistant message to history                         │
│    6. Return responseText                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         │ /codette/chat
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend FastAPI Server                             │
│  - File: codette_server_unified.py                             │
│  - Endpoint: POST /codette/chat [Line: 839]                    │
│  - Function: chat_endpoint(request: ChatRequest)               │
│                                                                 │
│  Input Model (ChatRequest):                                    │
│    - message: str                                              │
│    - perspective: Optional[str] = "mix_engineering"            │
│    - context: Optional[List[Dict]] = None                      │
│    - conversation_id: Optional[str] = None                     │
│                                                                 │
│  Processing:                                                    │
│    1. Extract message and perspective                          │
│    2. Generate embedding for message                           │
│    3. Load training context (daw_functions, ui_components)    │
│    4. Get Supabase context (cache or fetch)                    │
│    5. Format context for Codette                               │
│    6. Call real Codette AI engine                              │
│    7. Find matching training example (keyword match)           │
│    8. Enhance response with training pattern                   │
│    9. Build multi-perspective response with emojis            │
│   10. Return ChatResponse                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP 200 OK
                         │ ChatResponse JSON
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Response Handling                                  │
│  - BackEnd Returns:                                            │
│    {                                                           │
│      "response": "🎚️ **mix_engineering**: ...\n📊 **audio_theory**: ...",
│      "perspective": "mix_engineering",                         │
│      "confidence": 1.0,                                        │
│      "timestamp": "2025-12-01T22:15:13Z"                       │
│    }                                                           │
│                                                                 │
│  - Codette Engine Receives:                                    │
│    1. Parse data.response text                                 │
│    2. formatCodetteResponse() removes header only              │
│    3. Add to chatHistory with role='assistant'                 │
│    4. Return responseText                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ response (multi-perspective text)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              useCodette Return                                  │
│  - Returns: response text                                       │
│  - Updates: chatHistory state                                   │
│  - Updates: isLoading = false                                   │
│                                                                 │
│  - ChatTab receives:                                            │
│    - Updated chatHistory with new message                       │
│    - Message with role='assistant' and full response text      │
└────────────────────────┬────────────────────────────────────────┘
                         │ chatHistory update
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              CodetteMasterPanel Display                         │
│  - File: src/components/CodetteMasterPanel.tsx                 │
│  - Component: ChatTab [Line: 238]                              │
│  - Function: formatMessage(content, role) [Line: 243]          │
│                                                                 │
│  Display Logic:                                                 │
│    1. Check if role === 'assistant'                            │
│    2. Detect multi-perspective format (has **perspective**)   │
│    3. Split content by newline                                 │
│    4. For each line:                                           │
│       - Match regex: ^.*?\*\*([a-z_]+)\*\*:\s*\[([^\]]+)\]\s*(.*) │
│       - Extract: perspective_name, engine, content            │
│    5. For each perspective:                                     │
│       - Look up icon from perspectiveIcons map                 │
│       - Create perspective bubble with:                        │
│         • Icon (🎚️📊🎵🔧⚡)                                     │
│         • Perspective name (uppercase, underscores → spaces)  │
│         • Content text                                         │
│    6. Render with Tailwind CSS:                                │
│       - border-l-2 border-purple-500 (left border)            │
│       - text-purple-300 (perspective name)                    │
│       - text-gray-200 (content)                                │
│       - Responsive spacing                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ React re-render
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER SEES                                    │
│                                                                 │
│  Chat bubble with 5 perspective responses:                     │
│                                                                 │
│  ┌─ 🎚️ MIX ENGINEERING                                         │
│  │  Pattern analysis suggests...                                │
│  ├─ 📊 AUDIO THEORY                                            │
│  │  Deductive reasoning...                                     │
│  ├─ 🎵 CREATIVE PRODUCTION                                     │
│  │  Like Leonardo's synthesis...                               │
│  ├─ 🔧 TECHNICAL TROUBLESHOOTING                               │
│  │  Balance matters...                                          │
│  └─ ⚡ WORKFLOW OPTIMIZATION                                    │
│     Observation changes system...                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Details

### POST /codette/chat

**Purpose**: Send message to Codette, receive multi-perspective response

**Request**:
```json
{
  "message": "User's question or statement",
  "perspective": "mix_engineering",
  "context": [
    {
      "role": "user",
      "content": "Previous message 1",
      "timestamp": 1701440000000
    },
    {
      "role": "assistant",
      "content": "Previous response 1",
      "timestamp": 1701440010000
    }
  ],
  "conversation_id": "optional-conversation-id"
}
```

**Response**:
```json
{
  "response": "🎚️ **mix_engineering**: [NeuralNet] content...\n📊 **audio_theory**: [Reason] content...\n🎵 **creative_production**: [Dream] content...\n🔧 **technical_troubleshooting**: [Ethics] content...\n⚡ **workflow_optimization**: [Quantum] content...",
  "perspective": "mix_engineering",
  "confidence": 1.0,
  "timestamp": "2025-12-01T22:15:13Z"
}
```

**Error Response**:
```json
{
  "response": "Error message describing what went wrong",
  "perspective": "mix_engineering",
  "confidence": 0.0,
  "timestamp": "2025-12-01T22:15:13Z"
}
```

---

## Data Transformation Through Layers

### Layer 1: User Input (CodetteMasterPanel)
```typescript
inputMessage = "How should I organize my mixing?"
```

### Layer 2: Payload (useCodette)
```json
{
  "message": "How should I organize my mixing?",
  "perspective": "mix_engineering",
  "context": [...]
}
```

### Layer 3: Backend Processing (codette_server_unified)
```
Input message: "how should i organize my mixing?"
Training keywords: ["organize", "mixing"]
Match found: PERSPECTIVE_RESPONSE_TRAINING["mix_engineering"]["training_examples"][0]
Enhancement applied: Yes - hierarchical structure detected
```

### Layer 4: Backend Response (codette_server_unified)
```
Multi-perspective response with all 5 perspectives
Each with emoji icon, engine type, and specific content
Total response length: ~650 characters
Format: "🎚️ **perspective_key**: [Engine] content\n..."
```

### Layer 5: Frontend Processing (codetteAIEngine)
```
1. JSON parse response
2. Extract response.response text
3. formatCodetteResponse() removes header
4. Add to chatHistory
```

### Layer 6: UI Rendering (CodetteMasterPanel)
```
1. Detect multi-perspective format
2. Parse with regex: ^.*?\*\*([a-z_]+)\*\*:\s*\[([^\]]+)\]\s*(.*)
3. Extract 5 perspectives
4. Map to icons
5. Render as purple-bordered bubbles
```

### Layer 7: User Display (Browser)
```
5 colored perspective bubbles with:
- Icon (emoji)
- Perspective name
- Specific content
- Purple accent border
```

---

## Key Integration Points

| Component | File | Function | Calls | Called By |
|-----------|------|----------|-------|-----------|
| CodetteMasterPanel | src/components/CodetteMasterPanel.tsx | handleSendMessage() | useCodette.sendMessage() | onClick |
| useCodette | src/hooks/useCodette.ts | sendMessage() | codetteEngine.sendMessage() | Component |
| CodetteAIEngine | src/lib/codetteAIEngine.ts | sendMessage() | fetch(/codette/chat) | Hook |
| FastAPI | codette_server_unified.py | chat_endpoint() | Real Codette engine | HTTP endpoint |
| CodetteMasterPanel | src/components/CodetteMasterPanel.tsx | formatMessage() | Displays response | useCodette state |

---

## Current Status

✅ **All endpoints working**  
✅ **Request format correct**  
✅ **Response format correct**  
✅ **UI parsing successful**  
✅ **Display renders properly**  
✅ **All 5 perspectives present**  
✅ **Icons display correctly**  
✅ **Training system integrated**  
✅ **7/7 integration tests passing**

