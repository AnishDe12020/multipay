import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Connection, GetProgramAccountsFilter } from "@solana/web3.js"
import axios from "axios"

export const getTokens = async (address: string, connection: Connection) => {
  if (!address) {
    return null
  }

  const filters: GetProgramAccountsFilter[] = [
    {
      dataSize: 165,
    },
    {
      memcmp: {
        offset: 32,
        bytes: address,
      },
    },
  ]

  const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: filters,
  })

  const { data: tokenList } = await axios.get("https://cache.jup.ag/tokens")

  const tokensParsedInfo = accounts.map((account) => {
    const parsedAccountInfo: any = account.account.data
    const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"]
    const tokenBalance: number =
      parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"]

    return {
      mintAddress,
      tokenBalance,
      ata: account.pubkey.toBase58(),
    }
  })

  const tokens = tokensParsedInfo.map(({ mintAddress, tokenBalance, ata }) => {
    const meta = tokenList.find((token: any) => token.address === mintAddress)

    return {
      ata,
      balance: tokenBalance,
      ...meta,
    }
  })

  return tokens
}
