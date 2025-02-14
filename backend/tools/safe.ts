import { z } from "zod";
import {
  createSafeClient,
  SafeClientResult,
} from "@safe-global/sdk-starter-kit";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// Update configuration constants to support multiple networks
const NETWORK_CONFIG = {
  "1": {
    name: "mainnet",
    serviceUrl: "https://safe-transaction-mainnet.safe.global/api/v1",
    explorer: "https://etherscan.io",
  },
  "11155111": {
    name: "sepolia",
    serviceUrl: "https://safe-transaction-sepolia.safe.global/api/v1",
    explorer: "https://sepolia.etherscan.io",
  },
} as const;

// Configuration constants for our Safe operations
const RPC_URL = "https://rpc.ankr.com/eth_sepolia";

/**
 * Creates a basic Safe client with either existing safe configuration or new safe setup
 * @param signerKey - Private key for signing transactions
 * @param existingSafeAddress - Optional address of existing safe
 * @param owners - Optional array of owner addresses for new safe creation
 */
const createBasicClient = async (
  signerKey: string,
  existingSafeAddress?: string,
  owners: string[] = []
) => {
  // When creating a new safe, if no owners are provided, we'll use the signer's address
  const clientConfig = existingSafeAddress
    ? {
        provider: RPC_URL,
        signer: signerKey,
        safeAddress: existingSafeAddress,
      }
    : {
        provider: RPC_URL,
        signer: signerKey,
        safeOptions: {
          owners: owners.length > 0 ? owners : [],
          threshold: 1,
          saltNonce: Math.trunc(Math.random() * 10 ** 10).toString(), // Random nonce for address generation
        },
      };

  return await createSafeClient(clientConfig);
};

/**
 * Retrieves the ETH balance for a Safe address on mainnet or sepolia
 */
export const getEthBalance = async ({
  address,
  chainId,
}: {
  address: string;
  chainId: string;
}): Promise<string> => {
  // Input validation for chain and address format
  if (!NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG]) {
    throw new Error(
      "Chain ID not supported. Only mainnet (chainId: 1) and sepolia (chainId: 11155111) are supported."
    );
  }

  if (!address.startsWith("0x") || address.length !== 42) {
    throw new Error("Invalid Ethereum address format.");
  }

  const networkConfig = NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG];

  try {
    const response = await fetch(
      `${networkConfig.serviceUrl}/safes/${address}/balances/`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const balanceData = await response.json();
    console.log("Raw balance data:", balanceData);

    const ethBalanceEntry = balanceData.find(
      (element: any) =>
        element?.tokenAddress === null && element?.token === null
    );

    if (!ethBalanceEntry) {
      throw new Error("ETH balance not found in response");
    }

    // Improved balance calculation with proper decimal handling
    const balance = ethBalanceEntry.balance;
    const balanceInWei = BigInt(balance);
    const balanceInEth = Number(balanceInWei) / 1e18;

    // console.log("Calculated ETH balance:", balanceInEth);

    return `The current balance of the Safe Multisig at address ${address} on ${
      networkConfig.name
    } is ${balanceInEth.toLocaleString("en-US", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 18,
    })} ETH. View on explorer: ${networkConfig.explorer}/address/${address}`;
  } catch (error) {
    console.error("Full error details:", error);
    throw new Error(
      `Failed to fetch ETH balance: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Deploys a new Safe with specified owner(s)
 */
export const deployNewSafe = async ({
  ownerAddress,
}: {
  ownerAddress: string;
}): Promise<string> => {
  try {
    // Create new safe client with the agent's private key and specified owner
    const safeClient = await createBasicClient(
      process.env.AGENT_PRIVATE_KEY!,
      undefined,
      [ownerAddress] // Set the provided address as the owner
    );

    // Get predicted address and check deployment status
    const safeAddress = await safeClient.protocolKit.getAddress();
    const isDeployed = await safeClient.protocolKit.isSafeDeployed();

    if (isDeployed) {
      throw new Error(`Safe already deployed at address ${safeAddress}`);
    }

    // Prepare and send deployment transaction
    const deploymentTransaction =
      await safeClient.protocolKit.createSafeDeploymentTransaction();
    const signer = await safeClient.protocolKit
      .getSafeProvider()
      .getExternalSigner();

    if (!signer) {
      throw new Error("Failed to get signer");
    }

    const transactionHash = await signer.sendTransaction({
      to: deploymentTransaction.to,
      value: BigInt(deploymentTransaction.value),
      data: deploymentTransaction.data as `0x${string}`,
      chain: sepolia,
    });

    // Wait for deployment confirmation
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    await publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    });

    return `A new Safe multisig was successfully deployed on Sepolia. You can see it live at https://app.safe.global/home?safe=sep:${safeAddress}. The deployed transaction hash is ${transactionHash}.`;
  } catch (error) {
    throw new Error(
      `Failed to deploy new Safe: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Creates a new transaction for an existing Safe
 */
export const createSafeTransaction = async ({
  safeAddress,
  to,
  value,
  data = "0x",
}: {
  safeAddress: string;
  to: string;
  value: string;
  data?: string;
}): Promise<string> => {
  try {
    const safeClient = await createBasicClient(
      process.env.AGENT_PRIVATE_KEY!,
      safeAddress
    );

    // Convert ETH amount to Wei
    const valueInWei = BigInt(Math.floor(parseFloat(value) * 1e18)).toString();

    const transaction = {
      to,
      data,
      value: valueInWei,
    };

    const result = await safeClient.send({ transactions: [transaction] });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    // Check if we have a transaction hash
    const safeTxHash = result.transactions?.ethereumTxHash;
    if (!safeTxHash) {
      console.error("No transaction hash found in the result");
    }

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({
      hash: safeTxHash as `0x${string}`,
    });

    return `Transaction created and confirmed successfully for Safe ${safeAddress}. 
    Sending ${value} ETH to ${to}
    Transaction hash: ${safeTxHash}
    View on explorer: https://sepolia.etherscan.io/tx/${safeTxHash}
    Please check your Safe wallet to confirm the transaction.`;
  } catch (error) {
    throw new Error(
      `Failed to create Safe transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Confirms a pending transaction for a Safe
 */
export const confirmSafeTransaction = async ({
  safeAddress,
  safeTxHash,
}: {
  safeAddress: string;
  safeTxHash: string;
}): Promise<SafeClientResult> => {
  try {
    const safeClient = await createBasicClient(
      process.env.AGENT_PRIVATE_KEY!,
      safeAddress
    );
    return await safeClient.confirm({ safeTxHash });
  } catch (error) {
    throw new Error(
      `Failed to confirm Safe transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Zod schemas for input validation
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

// Update the chainId schema to include Sepolia
const chainIdSchema = z.enum(["1", "11155111"]);

// Metadata for function documentation and validation
export const safeToolsMetadata = {
  getEthBalanceMetadata: {
    name: "getEthBalance",
    description:
      "Get ETH balance of a Safe Multisig on mainnet or sepolia testnet",
    schema: z.object({
      address: addressSchema,
      chainId: chainIdSchema,
    }),
  },
  deployNewSafeMetadata: {
    name: "deployNewSafe",
    description: "Deploy a new Safe Multisig on Sepolia",
    schema: z.object({
      ownerAddress: addressSchema,
    }),
  },
  createSafeTransactionMetadata: {
    name: "createSafeTransaction",
    description:
      "Create a new ETH transfer transaction for an existing Safe wallet",
    schema: z.object({
      safeAddress: addressSchema.describe("The address of your Safe wallet"),
      to: addressSchema.describe("Recipient address"),
      value: z.string().describe("Amount of ETH to send"),
      data: z
        .string()
        .optional()
        .default("0x")
        .describe("Transaction data (optional)"),
    }),
  },
  confirmSafeTransactionMetadata: {
    name: "confirmSafeTransaction",
    description: "Confirm a pending transaction for a Safe",
    schema: z.object({
      safeAddress: addressSchema,
      safeTxHash: z.string(),
    }),
  },
};

// Export all tools in a single object for easier importing
export const safeTools = {
  getEthBalance,
  deployNewSafe,
  createSafeTransaction,
  confirmSafeTransaction,
};
