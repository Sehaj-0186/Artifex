import * as ethers from "ethers";

interface RouteArgs {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage: string;
}

interface DepositArgs {
    primaryAddress: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: { useOutputOfCallAt: number };
}

interface Action {
    protocol: string;
    action: string;
    args: RouteArgs | DepositArgs;
}

class AaveDeposit {
    private baseUrl = 'https://api.enso.finance/api/v1';
    private apiKey: string;
    private provider: ethers.JsonRpcProvider;
    private signer: ethers.Wallet;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        const RPC_URL = "https://virtual.mainnet.rpc.tenderly.co/7ca2ab36-ae0d-4c41-a3dc-7f689f27592c";
        const PRIVATE_KEY = "038bbe9d017b11ecfba2676f983d365a926126e68930a30921ff605ed9332d1f";
        
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
    }

    async deposit(): Promise<any> {
        try {
            const initialBalance = await this.provider.getBalance(this.signer.address);
            console.log('Initial ETH balance:', ethers.formatEther(initialBalance), 'ETH');

            const actions: Action[] = [
                {
                    protocol: "enso",
                    action: "route",
                    args: {
                        tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        tokenOut: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                        amountIn: ethers.parseEther("0.1").toString(),
                        slippage: "300"
                    }
                },
                {
                    protocol: "aave-v3",
                    action: "deposit",
                    args: {
                        primaryAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
                        tokenIn: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                        tokenOut: "0x0b925ed163218f6662a35e0f0371ac234f9e9371",
                        amountIn: { useOutputOfCallAt: 0 }
                    }
                }
            ];

            const bundleUrl = new URL(`${this.baseUrl}/shortcuts/bundle`);
            bundleUrl.searchParams.append('chainId', '1');
            bundleUrl.searchParams.append('fromAddress', this.signer.address);
            bundleUrl.searchParams.append('receiver', this.signer.address);
            bundleUrl.searchParams.append('spender', this.signer.address);
            bundleUrl.searchParams.append('routingStrategy', 'delegate');

            const response = await fetch(bundleUrl.toString(), {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(actions)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Details:', errorData);
                throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const routeData = await response.json();
            console.log('Route received:', routeData);

            // ... rest of the transaction execution code remains the same ...
        } catch (error: any) {
            console.error('Deposit failed:', error);
            throw error;
        }
    }
}

// Usage
const aaveDeposit = new AaveDeposit('e1f87b25-86b7-424c-a5af-8c87e356ee91');
aaveDeposit.deposit()
    .then(() => console.log('Deposit completed'))
    .catch(error => console.error('Error:', error));