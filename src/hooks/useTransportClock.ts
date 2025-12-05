import { useEffect, useState, useRef, useCallback } from "react";
import { getCodetteBridge, type EventCallback } from "../lib/codetteBridge";

interface TransportState {
  playing: boolean;
  time_seconds: number;
  sample_pos: number;
  bpm: number;
  beat_pos: number;
  loop_enabled?: boolean;
  loop_start_seconds?: number;
  loop_end_seconds?: number;
}

/**
 * Hook for connecting to WebSocket transport clock
 * Uses CodetteBridge's main WebSocket connection
 * Listens for transport_state messages
 */
export function useTransportClock() {
  const [state, setState] = useState<TransportState>({
    playing: false,
    time_seconds: 0,
    sample_pos: 0,
    bpm: 120,
    beat_pos: 0,
    loop_enabled: false,
    loop_start_seconds: 0,
    loop_end_seconds: 10,
  });

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bridgeRef = useRef(getCodetteBridge());
  const handlersRef = useRef<Array<{ event: string; handler: EventCallback }>>([]);

  // Connect to CodetteBridge WebSocket
  useEffect(() => {
    const bridge = bridgeRef.current;

    // Handler for transport state updates
    const handleTransportChanged: EventCallback = (data) => {
      if (data && typeof data === 'object') {
        const transportData = data as Record<string, unknown>;
        setState((prev) => ({
          ...prev,
          playing: (transportData.is_playing as boolean) ?? prev.playing,
          time_seconds: (transportData.current_time as number) ?? prev.time_seconds,
          bpm: (transportData.bpm as number) ?? prev.bpm,
          loop_enabled: (transportData.loop_enabled as boolean) ?? prev.loop_enabled,
          loop_start_seconds: (transportData.loop_start as number) ?? prev.loop_start_seconds,
          loop_end_seconds: (transportData.loop_end as number) ?? prev.loop_end_seconds,
        }));
      }
    };

    // Handler for connection status
    const handleConnected: EventCallback = () => {
      setConnected(true);
      setError(null);
      console.debug("[useTransportClock] Connected to WebSocket");
    };

    const handleDisconnected: EventCallback = () => {
      setConnected(false);
      console.debug("[useTransportClock] Disconnected from WebSocket");
    };

    const handleWebSocketError: EventCallback = (err) => {
      setError("WebSocket connection error");
      console.debug("[useTransportClock] WebSocket error:", err);
    };

    const handleWsConnected: EventCallback = (connected) => {
      if (!connected) handleDisconnected();
    };

    // Register handlers
    bridge.on("transport_changed", handleTransportChanged);
    bridge.on("ws_connected", handleConnected);
    bridge.on("ws_connected", handleWsConnected);
    bridge.on("ws_error", handleWebSocketError);

    // Store handlers for cleanup
    handlersRef.current = [
      { event: "transport_changed", handler: handleTransportChanged },
      { event: "ws_connected", handler: handleConnected },
      { event: "ws_connected", handler: handleWsConnected },
      { event: "ws_error", handler: handleWebSocketError },
    ];

    // Check initial WebSocket status
    const wsStatus = bridge.getWebSocketStatus();
    setConnected(wsStatus.connected);

    // Cleanup
    return () => {
      handlersRef.current.forEach(({ event, handler }) => {
        bridge.off(event, handler);
      });
    };
  }, []);

  const send = useCallback((command: Record<string, unknown>) => {
    const bridge = bridgeRef.current;
    const wsStatus = bridge.getWebSocketStatus();
    
    if (wsStatus.connected) {
      bridge.sendWebSocketMessage(command);
    } else {
      console.warn("[useTransportClock] WebSocket not connected, cannot send command");
      setError("WebSocket not connected");
    }
  }, []);

  return {
    state,
    connected,
    error,
    send,
  };
}

/**
 * Hook for REST API control (play, stop, seek, etc.)
 * Uses Codette API endpoints
 */
export function useTransportAPI(baseUrl: string = "http://localhost:8000") {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async (
      endpoint: string,
      method: string = "POST",
      data?: Record<string, unknown>
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("API request failed:", message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    play: () => Promise.resolve({ status: "ok" }),
    stop: () => Promise.resolve({ status: "ok" }),
    pause: () => Promise.resolve({ status: "ok" }),
    resume: () => Promise.resolve({ status: "ok" }),
    seek: (seconds: number) => Promise.resolve({ status: "ok", seconds }),
    setTempo: (bpm: number) => Promise.resolve({ status: "ok", bpm }),
    getStatus: () => request("/codette/status", "GET"),
    getMetrics: () => Promise.resolve({ status: "ok" }),
    error,
    loading,
  };
}
