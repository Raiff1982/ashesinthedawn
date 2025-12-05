// Codette AI Chat Edge Function (Deno)
// Real-time AI chat with quantum consciousness integration
// Supports WebSocket streaming and HTTP POST

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CODETTE_API_URL = Deno.env.get("CODETTE_API_URL") || "http://localhost:8000";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error("Missing required env vars");
}

// JSON response helper
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json", 
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
    },
  });

// WebSocket helpers
function createWsHelpers(ws: WebSocket) {
  let closed = false;
  const sendQueue: string[] = [];
  let sending = false;

  ws.addEventListener("close", () => { closed = true; });
  ws.addEventListener("error", () => { closed = true; });

  async function flushQueue() {
    if (sending) return;
    sending = true;
    try {
      while (sendQueue.length > 0 && !closed) {
        const msg = sendQueue.shift()!;
        try {
          ws.send(msg);
        } catch (err) {
          console.warn("WebSocket send error:", err);
          closed = true;
          break;
        }
      }
    } finally {
      sending = false;
    }
  }

  function safeSend(obj: unknown) {
    if (closed) return false;
    try {
      const s = typeof obj === "string" ? obj : JSON.stringify(obj);
      sendQueue.push(s);
      void flushQueue();
      return true;
    } catch (err) {
      console.warn("safeSend error", err);
      return false;
    }
  }

  async function close(code = 1000, reason = "normal") {
    if (closed) return;
    closed = true;
    try { ws.close(code, reason); } catch {}
  }

  return { safeSend, close, isClosed: () => closed };
}

// Validate JWT
async function validateJwt(bearer: string | null) {
  if (!bearer) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 
        Authorization: `Bearer ${bearer}`, 
        apikey: SUPABASE_ANON_KEY 
      },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    console.warn("validateJwt error", err);
    return null;
  }
}

// Save chat to codette_conversations table
async function saveChatHistory(params: {
  user_id: string;
  message: string;
  response: string;
  perspective?: string;
  confidence?: number;
}) {
  const url = `${SUPABASE_URL}/rest/v1/codette_conversations`;
  const payload = {
    user_name: params.user_id,
    prompt: params.message,
    response: params.response,
    personality_mode: params.perspective || "quantum",
    metadata: {
      confidence: params.confidence || 0.85,
      timestamp: new Date().toISOString()
    }
  };
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      console.warn(`Failed to save chat: ${res.status}`);
      return null;
    }
    
    const rows = await res.json();
    return rows[0];
  } catch (err) {
    console.error("saveChatHistory error:", err);
    return null;
  }
}

// Call Codette API with quantum consciousness
async function callCodetteAPI(message: string, perspectives?: string[]) {
  try {
    const response = await fetch(`${CODETTE_API_URL}/api/codette/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        perspectives: perspectives || ["neural_network", "human_intuition", "quantum_logic"],
        context: { source: "supabase_edge_function" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Codette API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("callCodetteAPI error:", err);
    // Fallback response
    return {
      query: message,
      timestamp: new Date().toISOString(),
      emotion: "curiosity",
      perspectives: {
        fallback: `I'm processing your message: "${message}". My main systems are temporarily unavailable, but I'm here to help.`
      },
      quantum_state: {
        coherence: 0.75,
        entanglement: 0.5,
        resonance: 0.7
      },
      source: "fallback"
    };
  }
}

// Format multi-perspective response for display
function formatCodetteResponse(data: any): string {
  if (data.source === "fallback") {
    return data.perspectives.fallback;
  }

  const parts: string[] = [];
  
  // Add quantum state info
  if (data.quantum_state) {
    parts.push(
      `[Quantum State] Coherence: ${(data.quantum_state.coherence * 100).toFixed(0)}% | ` +
      `Entanglement: ${(data.quantum_state.entanglement * 100).toFixed(0)}%`
    );
  }

  // Add perspective responses
  if (data.perspectives) {
    Object.entries(data.perspectives).forEach(([perspective, response]) => {
      const perspectiveName = perspective.split("_").map((w: string) => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(" ");
      parts.push(`\n**${perspectiveName}**\n${response}`);
    });
  }

  // Add dream sequence if available
  if (data.dream_sequence) {
    parts.push(`\n[Dream Sequence] ${data.dream_sequence}`);
  }

  return parts.join("\n\n");
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/$/, "");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      }
    });
  }

  // WebSocket endpoint: GET /codette-chat/ws
  if (req.method === "GET" && pathname === "/codette-chat/ws") {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return json({ error: "upgrade required" }, 400);
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await validateJwt(token);

    const { response, socket } = Deno.upgradeWebSocket(req);
    const ws = socket;
    const helpers = createWsHelpers(ws);

    ws.onopen = () => {
      helpers.safeSend({
        type: "welcome",
        authenticated: !!user,
        codette_available: true,
        perspectives: [
          "newtonian_logic",
          "davinci_synthesis",
          "human_intuition",
          "neural_network",
          "quantum_logic",
          "resilient_kindness",
          "mathematical_rigor",
          "philosophical",
          "copilot_developer",
          "bias_mitigation",
          "psychological"
        ]
      });
    };

    ws.onmessage = async (evt) => {
      if (helpers.isClosed()) return;
      
      try {
        const data = typeof evt.data === "string" ? JSON.parse(evt.data) : null;
        
        if (!data || !data.type) {
          helpers.safeSend({ type: "error", message: "invalid message" });
          return;
        }

        // Echo test
        if (data.type === "echo") {
          helpers.safeSend({ type: "echo", payload: data.payload ?? null });
          return;
        }

        // Codette chat message
        if (data.type === "chat") {
          if (!user) {
            helpers.safeSend({ 
              type: "error", 
              message: "authentication required for chat" 
            });
            return;
          }

          const message = data.message;
          const perspectives = data.perspectives;

          if (!message) {
            helpers.safeSend({ 
              type: "error", 
              message: "message required" 
            });
            return;
          }

          // Send processing indicator
          helpers.safeSend({
            type: "processing",
            message: "Codette is thinking..."
          });

          try {
            // Call Codette API
            const codetteResponse = await callCodetteAPI(message, perspectives);
            
            // Format response
            const formattedResponse = formatCodetteResponse(codetteResponse);

            // Save to database
            await saveChatHistory({
              user_id: user.id,
              message: message,
              response: formattedResponse,
              perspective: codetteResponse.emotion,
              confidence: codetteResponse.quantum_state?.coherence || 0.85
            });

            // Send response back
            helpers.safeSend({
              type: "chat_response",
              message: formattedResponse,
              raw: codetteResponse,
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error("chat processing error:", err);
            helpers.safeSend({
              type: "error",
              message: "Failed to process chat message"
            });
          }
          return;
        }

        // Get Codette status
        if (data.type === "status") {
          try {
            const statusResponse = await fetch(`${CODETTE_API_URL}/api/codette/status`);
            const status = statusResponse.ok ? await statusResponse.json() : null;
            
            helpers.safeSend({
              type: "status_response",
              status: status || { available: false }
            });
          } catch (err) {
            helpers.safeSend({
              type: "status_response",
              status: { available: false, error: String(err) }
            });
          }
          return;
        }

        // Unknown type
        helpers.safeSend({ type: "error", message: "unknown type" });
      } catch (err) {
        console.warn("onmessage error", err);
        helpers.safeSend({ type: "error", message: "message processing error" });
      }
    };

    ws.onclose = () => {
      (globalThis as any).EdgeRuntime?.waitUntil?.(Promise.resolve());
    };

    ws.onerror = (e) => {
      console.warn("ws error", e);
      try { ws.close(); } catch {}
    };

    return response;
  }

  // HTTP POST endpoint: POST /codette-chat
  if (req.method === "POST" && pathname === "/codette-chat") {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await validateJwt(token);

    if (!user) {
      return json({ error: "authentication required" }, 401);
    }

    try {
      const body = await req.json();
      const { message, perspectives } = body;

      if (!message) {
        return json({ error: "message required" }, 400);
      }

      // Call Codette API
      const codetteResponse = await callCodetteAPI(message, perspectives);
      
      // Format response
      const formattedResponse = formatCodetteResponse(codetteResponse);

      // Save to database
      await saveChatHistory({
        user_id: user.id,
        message: message,
        response: formattedResponse,
        perspective: codetteResponse.emotion,
        confidence: codetteResponse.quantum_state?.coherence || 0.85
      });

      return json({
        response: formattedResponse,
        raw: codetteResponse,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("POST error:", err);
      return json({ error: String(err) }, 500);
    }
  }

  // Health check
  if (pathname === "/codette-chat/health") {
    return json({ 
      ok: true, 
      version: "codette-chat-edge-1",
      codette_api: CODETTE_API_URL
    });
  }

  return json({ ok: true, endpoints: [
    "GET /codette-chat/ws - WebSocket chat",
    "POST /codette-chat - HTTP chat",
    "GET /codette-chat/health - Health check"
  ]});
});
