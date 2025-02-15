"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

const WebSocketContext = createContext(null);

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function WebSocketProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = useCallback(() => {
    console.log("Attempting to connect to WebSocket...");
    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setConnectionStatus("connected");
      reconnectAttempts.current = 0;
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setConnectionStatus("disconnected");

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        console.log(`Reconnecting... Attempt ${reconnectAttempts.current + 1}`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setConnectionStatus("error");
    };

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return () => cleanup();
  }, [connectWebSocket]);

  return (
    <WebSocketContext.Provider value={{ wsRef, connectionStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
