"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./ChatInterface.module.css";

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const wsRef = useRef(null);
  const messageEndRef = useRef(null);
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

      // Attempt reconnection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        console.log(`Reconnecting... Attempt ${reconnectAttempts.current + 1}`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      } else {
        console.error("Max reconnection attempts reached");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Connection lost. Please refresh the page.",
            type: "error",
            isComplete: true,
          },
        ]);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setConnectionStatus("error");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        // Handle different message types
        switch (data.type) {
          case "chunk":
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && !lastMessage.isComplete) {
                // Append to existing message
                const updatedMessages = [...prev.slice(0, -1)];
                updatedMessages.push({
                  ...lastMessage,
                  text: lastMessage.text + data.text,
                });
                return updatedMessages;
              } else {
                // Create new message
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    text: data.text,
                    type: "ai",
                    isComplete: false,
                  },
                ];
              }
            });
            setIsLoading(false);
            break;
          case "done":
            setMessages((prev) => {
              const updatedMessages = [...prev];
              const lastMessage = updatedMessages[updatedMessages.length - 1];
              if (lastMessage) {
                lastMessage.isComplete = true;
              }
              return updatedMessages;
            });
            break;
          case "error":
            console.error("Server Error:", data.message);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                text: `Error: ${data.message}`,
                type: "ai",
                isComplete: true,
              },
            ]);
            setIsLoading(false);
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Message parsing error:", error);
      }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current) return;

    // Send message with proper type
    const message = {
      type: "message",
      content: input.trim(),
      threadId: "default",
    };

    try {
      wsRef.current.send(JSON.stringify(message));

      // Add user message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: input,
          type: "user",
          isComplete: true,
        },
      ]);

      setInput("");
      setIsLoading(true);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.statusIndicator} ${styles[connectionStatus]}`}>
        {connectionStatus === "connected" ? "Connected" : "Disconnected"}
      </div>
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.type]}`}
          >
            <div className={styles.content}>
              {message.text}
              {!message.isComplete && <span className={styles.cursor}>▋</span>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingDots}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
