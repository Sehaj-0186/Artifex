"use client";
import React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  connectorsForWallets
} from "@rainbow-me/rainbowkit";
import {
    rainbowWallet,
    walletConnectWallet,
    safeWallet,
    injectedWallet,
  } from '@rainbow-me/rainbowkit/wallets';
import { mainnet, polygon, sepolia, avalanche, linea, bsc } from "wagmi/chains";
import { WagmiProvider } from "wagmi";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";



const projectId = "c60d838bc7682699062e8af4283518b3";
const chains = [mainnet, polygon, avalanche, linea, sepolia, bsc];
const connectors = connectorsForWallets(
    [
      {
        groupName: 'Recommended',
        wallets: [rainbowWallet, walletConnectWallet, safeWallet, injectedWallet],
      },
    ],
    {
      appName: 'NFTNexus',
      projectId: projectId,
    }
  );
const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "NFTNexus",
  projectId: projectId,
  connectors,
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [linea.id]: http(),
  },
});

const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          chains={chains}
          modalSize="lg"
          theme={darkTheme({
            accentColor: "#d9dbd9",
            accentColorForeground: "black",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default Providers;