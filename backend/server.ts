import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { ChatOllama } from "@langchain/ollama";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { safeTools, safeToolsMetadata } from "./tools/safe";
import { getEthPriceUsd, getEthPriceUsdMetadata } from "./tools/prices";
import { multiply, multiplyMetadata } from "./tools/math";

// Configuration
const FALLBACK_MODELS = ["llama3.2:latest"];
const MAX_RETRIES = 3;

// Add system prompt
const SYSTEM_PROMPT = `You are an AI assistant that helps users interact with Safe smart contract wallets and perform calculations. 

When users want to send ETH from their Safe wallet, use the createSafeTransaction tool with these parameters:
- safeAddress: the user's Safe wallet address
- to: recipient address
- value: amount of ETH to send as a string
- data: usually "0x" for simple ETH transfers

For example, if a user says "send 0.02 ETH from my safe 0x123... to 0x456...", use:
createSafeTransaction({
  safeAddress: "0x123...",
  to: "0x456...",
  value: "0.02",
  data: "0x"
})

You have access to these tools:
- Get ETH balance of any Safe wallet on mainnet or testnet
- Deploy new Safe wallets on Sepolia testnet
- Create and confirm transactions for Safe wallets
- Get current ETH price in USD
- Perform basic multiplication

When users greet you or ask general questions, respond naturally without using tools.
For Safe-specific tasks, use the appropriate tools and format responses clearly.`;

// Agent state management
type AgentState = {
  currentModel: string;
  agent: any;
  retryCount: number;
};

const state: AgentState = {
  currentModel: FALLBACK_MODELS[0],
  agent: null,
  retryCount: 0,
};

// Add logging utility
const log = {
  info: (...args: any[]) =>
    console.log(new Date().toISOString(), "[INFO]", ...args),
  error: (...args: any[]) =>
    console.error(new Date().toISOString(), "[ERROR]", ...args),
  debug: (...args: any[]) =>
    console.debug(new Date().toISOString(), "[DEBUG]", ...args),
};

// Initialize agent with all Safe tools
const initializeAgent = async () => {
  log.info("Initializing agent with model:", state.currentModel);
  const agentTools = [
    tool(
      async (input) => {
        log.debug("Executing getEthBalance with input:", input);
        const result = await safeTools.getEthBalance(input);
        log.debug("getEthBalance result:", result);
        const ethPrice = await getEthPriceUsd();
        log.debug("ETH price:", ethPrice);
        return `${result}\n${ethPrice}`;
      },
      {
        name: safeToolsMetadata.getEthBalanceMetadata.name,
        description: safeToolsMetadata.getEthBalanceMetadata.description,
        schema: safeToolsMetadata.getEthBalanceMetadata.schema,
      }
    ),
    tool(
      async (input) => {
        try {
          const result = await safeTools.deployNewSafe(input);
          return result;
        } catch (error) {
          console.error("Tool execution error (deployNewSafe):", error);
          throw error;
        }
      },
      {
        name: safeToolsMetadata.deployNewSafeMetadata.name,
        description: safeToolsMetadata.deployNewSafeMetadata.description,
        schema: safeToolsMetadata.deployNewSafeMetadata.schema,
      }
    ),
    tool(
      async (input) => {
        try {
          const result = await safeTools.createSafeTransaction(input);
          return result;
        } catch (error) {
          console.error("Tool execution error (createSafeTransaction):", error);
          throw error;
        }
      },
      {
        name: safeToolsMetadata.createSafeTransactionMetadata.name,
        description:
          safeToolsMetadata.createSafeTransactionMetadata.description,
        schema: safeToolsMetadata.createSafeTransactionMetadata.schema,
      }
    ),
    tool(
      async (input) => {
        try {
          const result = await safeTools.confirmSafeTransaction(input);
          return result;
        } catch (error) {
          console.error(
            "Tool execution error (confirmSafeTransaction):",
            error
          );
          throw error;
        }
      },
      {
        name: safeToolsMetadata.confirmSafeTransactionMetadata.name,
        description:
          safeToolsMetadata.confirmSafeTransactionMetadata.description,
        schema: safeToolsMetadata.confirmSafeTransactionMetadata.schema,
      }
    ),
    tool(
      async () => {
        try {
          const result = await getEthPriceUsd();
          return result;
        } catch (error) {
          console.error("Tool execution error (getEthPriceUsd):", error);
          throw error;
        }
      },
      {
        name: getEthPriceUsdMetadata.name,
        description: getEthPriceUsdMetadata.description,
        schema: getEthPriceUsdMetadata.schema,
      }
    ),
    tool(
      async (input) => {
        try {
          const result = await multiply(input);
          return result;
        } catch (error) {
          console.error("Tool execution error (multiply):", error);
          throw error;
        }
      },
      {
        name: multiplyMetadata.name,
        description: multiplyMetadata.description,
        schema: multiplyMetadata.schema,
      }
    ),
  ];

  try {
    const agentModel = new ChatOllama({
      model: state.currentModel,
      temperature: 0.7,
    });

    state.agent = createReactAgent({
      llm: agentModel,
      tools: agentTools,
      checkpointSaver: new MemorySaver(),
    });

    // Initialize with a default thread
    await state.agent.invoke(
      {
        messages: [
          new SystemMessage(SYSTEM_PROMPT),
          new HumanMessage(
            "Hello, I'm ready to help you with Safe operations."
          ),
        ],
      },
      {
        configurable: {
          thread_id: "default",
        },
      }
    );

    log.info("Agent initialized successfully");
    return true;
  } catch (error) {
    log.error("Agent initialization failed:", error);
    return false;
  }
};

// Message processing with better error handling and logging
const processMessage = async (message: string, threadId = "default") => {
  log.debug(`Processing message. ThreadId: ${threadId}`, { message });
  
  if (!state.agent) {
    const initialized = await initializeAgent();
    if (!initialized) {
      throw new Error("Failed to initialize agent");
    }
  }

  if (!message.trim()) {
    return "Please provide a valid message or question.";
  }

  try {
    const response = await state.agent.invoke(
      {
        messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(message)],
      },
      {
        configurable: {
          thread_id: threadId || "default",
        },
      }
    );

    // Extract the last message content from the response
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage?.content || "No response generated";

  } catch (error) {
    if (state.retryCount < MAX_RETRIES) {
      state.retryCount++;
      state.currentModel =
        FALLBACK_MODELS[state.retryCount % FALLBACK_MODELS.length];
      await initializeAgent();
      return processMessage(message, threadId);
    }
    
    throw new Error(`Failed to process message after ${MAX_RETRIES} attempts`);
  }
};

// Server setup with improved error handling
const serverConfig = {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
};

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }
  res.writeHead(404);
  res.end();
});

// Replace Socket.IO setup with WebSocket
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket) => {
  log.info("New client connected");

  ws.on("message", async (data: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const parsedData = JSON.parse(data.toString());
      log.debug("Received message:", parsedData);

      if (parsedData.type === "message" && typeof parsedData.content === "string") {
        const { content, threadId = "default" } = parsedData;
        state.retryCount = 0;

        try {
          const response = await processMessage(content, threadId);
              if (ws.readyState === WebSocket.OPEN) {
            // Stream response with progress tracking
            const chunks = response.split(" ");
            const totalChunks = chunks.length;

            for (let i = 0; i < chunks.length; i++) {
              ws.send(
                JSON.stringify({
                  type: "chunk",
                  text: chunks[i] + " ",
                  progress: Math.round(((i + 1) / totalChunks) * 100),
                })
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
          }

            ws.send(JSON.stringify({ type: "done" }));
          }
        } catch (error) {
          log.error("Processing error:", error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "AI processing failed"
            }));
          }
        }
      }
    } catch (error) {
      log.error("Message parsing error:", error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "Invalid message format" 
        }));
      }
    }
  });

  ws.on("close", () => {
    log.info("Client disconnected");
  });

  ws.on("error", (error) => {
    log.error("WebSocket error:", error);
  });
});

// Initialize and start server
initializeAgent()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready with config:`, serverConfig);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize agent:", error);
    process.exit(1);
  });
