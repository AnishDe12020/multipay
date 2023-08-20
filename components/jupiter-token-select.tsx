"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export const PAIR_SELECTOR_TOP_TOKENS = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y", // SHDW
]

export const SUPPORTED_TOKENS = [
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chainId: 101,
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["old-registry"],
    extensions: {
      coingeckoId: "usd-coin",
    },
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    chainId: 101,
    decimals: 6,
    name: "USDT",
    symbol: "USDT",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    tags: ["old-registry", "solana-fm"],
    extensions: {
      coingeckoId: "tether",
    },
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    chainId: 101,
    decimals: 5,
    name: "BonkCoin",
    symbol: "Bonk",
    logoURI:
      "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I?ext=png",
    tags: ["community", "solana-fm"],
    extensions: {
      coingeckoId: "bonk",
    },
  },
  {
    address: "SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y",
    chainId: 101,
    decimals: 9,
    name: "Shadow Token",
    symbol: "SHDW",
    logoURI:
      "https://shdw-drive.genesysgo.net/FDcC9gn12fFkSU2KuQYH4TUjihrZxiTodFRWNF4ns9Kt/250x250_with_padding.png",
    tags: ["old-registry", "solana-fm"],
    extensions: {
      coingeckoId: "genesysgo-shadow",
    },
  },
]

const JupiterTokenSelect = ({
  onChange,
  value,
  validTokens,
}: {
  onChange: (value: any) => void
  value: any
  validTokens?: any[]
}) => {
  //   const [tokens, setTokens] = useState<any[]>()

  //   useEffect(() => {
  //     async function fetchTokens() {
  //       try {
  //         const response = await axios.get("https://token.jup.ag/all")
  //         const tokenData = response.data

  //         setTokens(tokenData)
  //       } catch (error) {
  //         console.error(error)
  //       }
  //     }

  //     fetchTokens()
  //   }, [])

  //   const supportedTokens = useMemo(() => {
  //     if (!tokens) return []

  //     return tokens.filter((token) =>
  //       PAIR_SELECTOR_TOP_TOKENS.includes(token.address)
  //     )
  //   }, [tokens])

  //   console.log(supportedTokens)

  //   return tokens ? (
  return (
    <Select value={value} onValueChange={(e) => onChange(e)}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a Token" />
      </SelectTrigger>

      <SelectContent>
        {(validTokens ?? SUPPORTED_TOKENS).map((token) => {
          return (
            <SelectItem key={token.address} value={token.address}>
              <div className="flex">
                <img
                  className="w-5 h-5 mr-2 rounded-full"
                  src={token.logoURI}
                  alt={token.symbol}
                />
                {token.symbol}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
  //   ) : null
}

export default JupiterTokenSelect
