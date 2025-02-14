import * as ethers from "ethers";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

export const executeSwap = async ({
  tokenIn,
  tokenOut,
  amountIn,
}: {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}): Promise<string> => {
  const RPC_URL =
    "https://virtual.mainnet.rpc.tenderly.co/7ca2ab36-ae0d-4c41-a3dc-7f689f27592c";
  const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
  const ENSO_API_KEY = "e1f87b25-86b7-424c-a5af-8c87e356ee91";
  const SLIPPAGE = 1000; // 10%

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log("private key", PRIVATE_KEY);
    const amountInWei = ethers.parseEther(amountIn);
    const initialBalance = await provider.getBalance(signer.address);

    if (initialBalance < amountInWei) {
      return `Error: Insufficient balance. Required: ${amountIn} ETH, Available: ${ethers.formatEther(
        initialBalance
      )} ETH`;
    }

    // Setup Enso API request
    const apiUrl = new URL("https://api.enso.finance/api/v1/shortcuts/route");
    apiUrl.searchParams.append("chainId", "1");
    apiUrl.searchParams.append("fromAddress", signer.address);
    apiUrl.searchParams.append("receiver", signer.address);
    apiUrl.searchParams.append("spender", signer.address);
    apiUrl.searchParams.append("amountIn", amountInWei.toString());
    apiUrl.searchParams.append("amountOut", amountInWei.toString());
    apiUrl.searchParams.append("slippage", SLIPPAGE.toString());
    apiUrl.searchParams.append("fee", "100");
    apiUrl.searchParams.append(
      "feeReceiver",
      "0x220866B1A2219f40e72f5c628B65D54268cA3A9D"
    );
    apiUrl.searchParams.append("disableRFQs", "false");
    apiUrl.searchParams.append("tokenIn", tokenIn);
    apiUrl.searchParams.append("tokenOut", tokenOut);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${ENSO_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const routeData = await response.json();

    const txParams = {
      to: routeData.tx.to,
      data: routeData.tx.data,
      value: routeData.tx.value,
      gasLimit: Math.floor(Number(routeData.gas) * 1.2),
    };

    const tx = await signer.sendTransaction(txParams);
    const receipt = await tx.wait();

    return `Swap executed successfully!
    Transaction Hash: ${tx.hash}
    Amount In: ${amountIn} ETH
    Expected Amount Out: ${ethers.formatUnits(routeData.amountOut, 18)}
    Price Impact: ${routeData.priceImpact}%
    Block Number: ${receipt?.blockNumber}
    Gas Used: ${receipt?.gasUsed?.toString()}`;
  } catch (error: any) {
    throw new Error(`Swap failed: ${error.message}`);
  }
};

export const swapToolMetadata = {
  name: "executeSwap",
  description: "Swap tokens using Enso Finance aggregator",
  schema: z.object({
    tokenIn: z
      .string()
      .describe(
        "Input token address (use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for ETH)"
      ),
    tokenOut: z.string().describe("Output token address"),
    amountIn: z.string().describe("Amount of input token to swap"),
  }),
};
