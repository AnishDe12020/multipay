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
  "So11111111111111111111111111111111111111112", // SOL
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y", // SHDW
]

const JupiterTokenSelect = ({
  onChange,
  value,
}: {
  onChange: (value: any) => void
  value: any
}) => {
  const [tokens, setTokens] = useState<any[]>()

  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await axios.get("https://token.jup.ag/all")
        const tokenData = response.data

        setTokens(tokenData)
      } catch (error) {
        console.error(error)
      }
    }

    fetchTokens()
  }, [])

  const supportedTokens = useMemo(() => {
    if (!tokens) return []

    return tokens.filter((token) =>
      PAIR_SELECTOR_TOP_TOKENS.includes(token.address)
    )
  }, [tokens])

  return tokens ? (
    <Select value={value} onValueChange={(e) => onChange(e)}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a Token" />
      </SelectTrigger>

      <SelectContent>
        {supportedTokens.map((token) => {
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
  ) : null
}

export default JupiterTokenSelect
