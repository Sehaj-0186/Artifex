"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ParticlesNetwork from "../components/ParticlesNetwork";
import { MavenPro } from "../page";
import TextareaAutosize from "react-textarea-autosize";
import { useWebSocket } from "@/context/WebSocketContext";

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { wsRef, connectionStatus } = useWebSocket();
  const messageEndRef = useRef(null);
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("message");

  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = (event) => {
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

    wsRef.current.addEventListener("message", handleMessage);
    return () => wsRef.current?.removeEventListener("message", handleMessage);
  }, [wsRef.current]);

  useEffect(() => {
    const sendInitialMessage = () => {
      if (
        initialMessage &&
        messages.length === 0 &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        // Set initial message in chat
        const newMessage = {
          id: Date.now().toString(),
          text: initialMessage,
          type: "user",
          isComplete: true,
        };
        setMessages([newMessage]);

        // Send to websocket
        const wsMessage = {
          type: "message",
          content: initialMessage,
          threadId: "default",
        };
        wsRef.current.send(JSON.stringify(wsMessage));
        setIsLoading(true);
      }
    };

    // Only attempt to send message when websocket is connected
    if (connectionStatus === "connected") {
      sendInitialMessage();
    }
  }, [connectionStatus, initialMessage, messages.length]);

  useEffect(() => {
    if (connectionStatus === 'connected' && initialMessage && messages.length === 0) {
      // Decode the URL-encoded message to preserve line breaks
      const decodedMessage = decodeURIComponent(initialMessage)
      setMessages([
        {
          id: Date.now().toString(),
          text: decodedMessage,
          type: 'user',
          isComplete: true,
        }
      ])
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          content: decodedMessage,
        }))
      }
    }
  }, [connectionStatus, initialMessage, messages.length])

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
    <div className={MavenPro.className}>
      <div className="Parent-most flex justify-center items-center h-screen bg-zinc-950 relative">
        <ParticlesNetwork />
        {/* Main Content */}
        <div className="w-[700px] mx-auto p-5 h-[95vh] rounded-2xl flex flex-col relative bg-[#010208]/30 backdrop-blur-xl border border-zinc-800/50">
          {/* Background SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full z-0"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="100%" height="100%" fill="#010208" />

            <radialGradient id="cornerGradient1" cx="0" cy="0" r="95%">
              <stop offset="0%" stopColor="rgba(165, 180, 252, 0.2)" />
              <stop offset="50%" stopColor="rgba(165, 180, 252, 0.1)" />
              <stop offset="100%" stopColor="rgba(20, 21, 31, 0)" />
            </radialGradient>
            <rect width="100%" height="100%" fill="url(#cornerGradient1)" />

            <radialGradient id="cornerGradient2" cx="100%" cy="100%" r="95%">
              <stop offset="0%" stopColor="rgba(249, 168, 212, 0.2)" />
              <stop offset="50%" stopColor="rgba(249, 168, 212, 0.1)" />
              <stop offset="100%" stopColor="rgba(20, 21, 31, 0)" />
            </radialGradient>
            <rect width="100%" height="100%" fill="url(#cornerGradient2)" />
          </svg>

          {/* Chat content */}
          <div className="flex-grow overflow-y-auto p-5 flex flex-col gap-3 no-scrollbar relative z-10 ">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] animate-[fadeIn_0.3s_ease-in] 
        ${
          message.type === "user"
            ? "self-end backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-tl-xl rounded-bl-xl rounded-tr-xl px-4 py-2 whitespace-pre-wrap"
            : "self-start text-white rounded-tl-xl rounded-br-xl rounded-tr-xl relative p-[1px]"
        }`}
              >
                {/* Gradient border background for AI messages */}
                {message.type !== "user" && (
                  <div className="absolute inset-0 rounded-tl-xl rounded-br-xl rounded-tr-xl bg-gradient-to-br from-indigo-600 via-pink-300 to-indigo-600 -z-10" />
                )}

                {/* Message content with background */}
                <div
                  className={`leading-relaxed break-words ${
                    message.type !== "user"
                      ? "bg-zinc-800 m-[0.1px] p-4 rounded-tl-xl rounded-br-xl rounded-tr-xl"
                      : ""
                  }`}
                >
                  {message.text}
                  {!message.isComplete && (
                    <span className="inline-block w-0.5 ml-0.5 animate-[blink_1s_infinite]">
                      ▋
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="self-start">
                <div className="star-parent relative w-[70px] h-[40px] rounded-tr-full rounded-tl-full rounded-br-full bg-gradient-to-br from-indigo-600 via-pink-300 to-indigo-600 flex justify-center items-center">
                  <div className="star absolute w-[65px] h-[35px] bg-zinc-900 rounded-full flex justify-center items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gradient-to-br from-indigo-600 to-pink-300 from-[0%] to-[100%] animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 rounded-full bg-pink-300 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 rounded-full bg-gradient-to-tl from-indigo-600 to-pink-300 from-[0%] to-[100%] animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-[600px] mx-auto"
          >
            <div className="relative">
              <TextareaAutosize
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder="Type your message..."
                minRows={1}
                maxRows={7}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-800/50 text-white border border-zinc-700 focus:outline-none focus:border-indigo-600 pr-12 no-scrollbar  overflow-y-auto"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-indigo-600 to-pink-300 from-[0%] to-[100%] rounded-full hover:scale-105 transition-all duration-400 ease-in-out"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
