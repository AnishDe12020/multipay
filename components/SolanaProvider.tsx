"use client"

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"

import "@solana/wallet-adapter-react-ui/styles.css"
import { useMemo } from "react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  // const endpoint = useMemo(() => clusterApiUrl("mainnet-beta"), []);
  const endpoint = useMemo(() => "https://solana-mainnet.rpc.extrnode.com", [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
