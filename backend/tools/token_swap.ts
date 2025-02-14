import * as ethers from "ethers";

async function executeEnsoSwap() {
  // Configuration
  const RPC_URL =
    "https://virtual.mainnet.rpc.tenderly.co/7ca2ab36-ae0d-4c41-a3dc-7f689f27592c";
  const PRIVATE_KEY =
    "038bbe9d017b11ecfba2676f983d365a926126e68930a30921ff605ed9332d1f";
  const ENSO_API_KEY = "e1f87b25-86b7-424c-a5af-8c87e356ee91";
  const AMOUNT_IN = "0.1"; // Reduced amount for testing
  const TOKEN_IN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH
  const TOKEN_OUT = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI
  const SLIPPAGE = 1000; // 10% - increased for better chances of success

  try {
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Log wallet address and balance
    const address = await signer.getAddress();
    console.log("Wallet address:", address);

    const initialBalance = await provider.getBalance(address);
    console.log(
      "Initial ETH balance:",
      ethers.formatEther(initialBalance),
      "ETH"
    );

    // Convert ETH amount to Wei
    const amountInWei = ethers.parseEther(AMOUNT_IN);
    console.log(
      `Amount to swap: ${AMOUNT_IN} ETH (${amountInWei.toString()} wei)`
    );

    // Check balance
    if (initialBalance < amountInWei) {
      throw new Error(
        `Insufficient balance. Required: ${AMOUNT_IN} ETH, Available: ${ethers.formatEther(
          initialBalance
        )} ETH`
      );
    }

    // Get route from Enso API
    console.log("Fetching route from Enso API...");
    const apiUrl = new URL("https://api.enso.finance/api/v1/shortcuts/route");

    // Required parameters
    apiUrl.searchParams.append("chainId", "1");
    apiUrl.searchParams.append("fromAddress", address);
    apiUrl.searchParams.append("tokenIn", TOKEN_IN);
    apiUrl.searchParams.append("tokenOut", TOKEN_OUT);
    apiUrl.searchParams.append("amountIn", amountInWei.toString());
    apiUrl.searchParams.append("slippage", SLIPPAGE.toString());

    // Optional parameters for better routing
    apiUrl.searchParams.append("disableRFQs", "true");
    apiUrl.searchParams.append("compatibility", "true");

    console.log("API URL:", apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${ENSO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API request failed: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const routeData = await response.json();
    console.log("Route details:", {
      gas: routeData.gas,
      expectedAmountOut: ethers.formatUnits(routeData.amountOut, 18),
      priceImpact: routeData.priceImpact + "%",
    });

    // Simulate transaction first
    console.log("Simulating transaction...");
    const simulationResult = await provider.call({
      from: address,
      to: routeData.tx.to,
      data: routeData.tx.data,
      value: routeData.tx.value,
    });
    console.log("Simulation successful:", simulationResult);

    // Execute transaction
    const tx = await signer.sendTransaction({
      to: routeData.tx.to,
      data: routeData.tx.data,
      value: routeData.tx.value,
      gasLimit: Math.floor(Number(routeData.gas) * 1.2),
    });

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt?.blockNumber,
    };
  } catch (error: any) {
    console.error("Detailed error:", {
      message: error.message,
      code: error.code,
      data: error.data,
      reason: error.reason,
    });
    throw error;
  }
}

// Execute with better error handling
executeEnsoSwap()
  .then((result) => console.log("Swap completed:", result))
  .catch((error) => {
    console.error("Swap failed:", error);
    process.exit(1);
  });
