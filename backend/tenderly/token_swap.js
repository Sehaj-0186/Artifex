import * as ethers from "ethers";

async function simulateEthTransfer() {
    // Configuration
    const RPC_URL = "https://virtual.mainnet.rpc.tenderly.co/7ca2ab36-ae0d-4c41-a3dc-7f689f27592c";
    const private_key = "038bbe9d017b11ecfba2676f983d365a926126e68930a30921ff605ed9332d1f";
    const RECIPIENT = '0x7B0a6E40f8861E6744D46DbA18cC8b914CDac11A';
    const AMOUNT = '1.0'; // Amount in ETH

    try {
        // Set up provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(private_key, provider);
        console.log("Initialized with wallet:", await signer.getAddress());

        // Get initial balance
        const initialBalance = await provider.getBalance(signer.address);
        console.log('Initial ETH balance:', ethers.formatEther(initialBalance), 'ETH');

        // Convert ETH amount to Wei
        const amountInWei = ethers.parseEther(AMOUNT);
        console.log(`Amount to transfer: ${AMOUNT} ETH (${amountInWei.toString()} wei)`);

        // Check if balance is sufficient
        if (initialBalance < amountInWei) {
            console.error("Error: Insufficient balance");
            console.log("Required:", AMOUNT, "ETH");
            console.log("Available:", ethers.formatEther(initialBalance), "ETH");
            throw new Error('Insufficient balance for transfer');
        }

        // Estimate gas
        const gasEstimate = await provider.estimateGas({
            from: signer.address,
            to: RECIPIENT,
            value: amountInWei
        });

        // Get current gas price
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || BigInt(0);

        // Calculate total cost including gas
        const gasCost = gasEstimate * gasPrice;
        console.log(`Estimated gas cost: ${ethers.formatEther(gasCost)} ETH`);

        // Simulate the transaction
        // ! something wrong here
        await provider.call({
            from: signer.address,
            to: RECIPIENT,
            value: amountInWei
        });

        console.log('Simulation successful!');
        console.log({
            from: signer.address,
            to: RECIPIENT,
            amount: AMOUNT,
            gasEstimate: gasEstimate.toString(),
            gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
        });

        // Send the actual transaction
        const tx = await signer.sendTransaction({
            to: RECIPIENT,
            value: amountInWei
        });
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        if (receipt) {
            console.log('Transaction confirmed in block:', receipt.blockNumber);
        } else {
            console.error('Transaction receipt is null');
        }

        // Get final balance
        const finalBalance = await provider.getBalance(signer.address);
        
        return {
            success: true,
            walletAddress: signer.address,
            initialBalance: ethers.formatEther(initialBalance),
            finalBalance: ethers.formatEther(finalBalance),
            transactionHash: tx.hash
        };

    } catch (error: any) {
        console.error('Simulation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute simulation
simulateEthTransfer()
    .then(result => console.log('Simulation result:', result))
    .catch(error => console.error('Error:', error));