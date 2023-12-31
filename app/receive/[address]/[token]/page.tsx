"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
// @ts-ignore
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import axios from "axios"
import { toast } from "sonner"

import { truncatePubkey } from "@/lib/truncate"
import { getTokens } from "@/lib/wallet-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import JupiterTokenSelect, {
  SUPPORTED_TOKENS,
} from "@/components/jupiter-token-select"

const getLookupTableAccounts = async (
  connection: Connection,
  addressLookupTableAddresses: string[]
) => {
  const data = await Promise.all(
    addressLookupTableAddresses.map((lookupTableAddress) =>
      connection.getAddressLookupTable(new PublicKey(lookupTableAddress))
    )
  )

  return data.map((lookupTable) => lookupTable.value)
}

const DynamicWalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

const ReceivePage = ({
  params,
}: {
  params: {
    address: string
    token: string
  }
}) => {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [amount, setAmount] = useState<number>()
  const [token, setToken] = useState(params.token)
  const [validTokens, setValidTokens] = useState<any[]>()
  const [quote, setQuote] = useState<any>()
  const [walletData, setWalletData] = useState<any>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!publicKey) return
      const tokens = await getTokens(publicKey?.toBase58(), connection)

      setWalletData({
        tokens,
      })
    })()
  }, [connection, publicKey])

  useEffect(() => {
    ;(async () => {
      const { data: indexedRouteMap } = await axios.get(
        "https://quote-api.jup.ag/v6/indexed-route-map"
      )

      const getMint = (index: number) => indexedRouteMap["mintKeys"][index]

      let generatedRouteMap: Record<string, string[]> = {}
      const indexedRouteMapData: { indexedRouteMap: Record<string, number[]> } =
        await axios
          .get("https://quote-api.jup.ag/v6/indexed-route-map")
          .then((res) => res.data)

      Object.keys(indexedRouteMapData.indexedRouteMap).forEach(
        (key: string) => {
          generatedRouteMap[getMint(Number(key))] =
            indexedRouteMapData.indexedRouteMap[key].map((index: number) =>
              getMint(index)
            )
        }
      )

      const possibleTokens = generatedRouteMap[params.token]

      setValidTokens(
        SUPPORTED_TOKENS.filter((token) =>
          possibleTokens.includes(token.address)
        )
      )
    })()
  }, [params.token])

  useEffect(() => {
    ;(async () => {
      if (!amount) return
      if (params.token === token) {
        setQuote(undefined)
        return
      }

      try {
        const { data: quote } = await axios.get(
          `https://quote-api.jup.ag/v6/quote?inputMint=${token}&outputMint=${
            params.token
          }&amount=${
            amount *
            10 **
              (SUPPORTED_TOKENS.find((t) => t.address === token)?.decimals || 1)
          }`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        )

        setQuote(quote)
      } catch (error) {
        toast.error("Swap not possible", {
          description: "Try increasing the amount or changing the token",
        })
        setQuote(undefined)
        console.error(error)
      }
    })()
  }, [amount, token, params.token])

  const pay = async () => {
    if (!amount) return
    if (!publicKey) return

    try {
      // Token
      const tokenData = walletData.tokens.find((t: any) => t.address === token)
      if (amount > tokenData?.balance) {
        toast.error("Insufficient balance", {
          description: `You don't have enough ${tokenData.symbol} to pay`,
        })
        return
      }

      setLoading(true)

      if (token === params.token) {
        const userATA = getAssociatedTokenAddressSync(
          new PublicKey(token),
          publicKey
        )
        const receiverATA = getAssociatedTokenAddressSync(
          new PublicKey(token),
          new PublicKey(params.address)
        )

        if (!userATA || !receiverATA) {
          toast.error("Payment failed")
          return
        }

        const splToken = SUPPORTED_TOKENS.find(
          (t) => t.address === token
        ) as any

        const tx = new Transaction().add(
          createTransferCheckedInstruction(
            userATA,
            new PublicKey(token),
            receiverATA,
            publicKey,
            amount * 10 ** splToken.decimals,
            splToken.decimals
          )
        )

        const latestBlockhash = await connection.getLatestBlockhash()

        const sig = await sendTransaction(tx, connection)

        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "processed"
        )

        toast.success("Payment successful!")
        setLoading(false)
      } else {
        const { data: swapInstructions } = await axios.post(
          "https://quote-api.jup.ag/v6/swap-instructions",
          JSON.stringify({
            userPublicKey: publicKey.toBase58(),
            quoteResponse: quote,
            wrapUnwrapSOL: true,
          })
        )

        const {
          computeBudgetInstructions: computeBudgetInstructionsPayload, // The necessary instructions to setup the compute budget.
          swapInstruction: swapInstructionPayload, // The actual swap instruction.
          addressLookupTableAddresses,
        } = swapInstructions

        const swapInstruction = new TransactionInstruction({
          programId: new PublicKey(swapInstructionPayload.programId),
          keys: swapInstructionPayload.accounts.map((key: any) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          data: Buffer.from(swapInstructionPayload.data, "base64"),
        })

        const computerBudgetInstructions = computeBudgetInstructionsPayload.map(
          (instruction: any) =>
            new TransactionInstruction({
              programId: new PublicKey(instruction.programId),
              keys: instruction.accounts.map((key: any) => ({
                pubkey: new PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
              })),
              data: Buffer.from(instruction.data, "base64"),
            })
        )

        const userATA = getAssociatedTokenAddressSync(
          new PublicKey(params.token),
          publicKey
        )
        const receiverATA = getAssociatedTokenAddressSync(
          new PublicKey(params.token),
          new PublicKey(params.address)
        )

        if (!userATA || !receiverATA) {
          toast.error("Payment failed")
          return
        }

        const splToken = SUPPORTED_TOKENS.find(
          (t) => t.address === token
        ) as any

        const sendIx = createTransferCheckedInstruction(
          userATA,
          new PublicKey(params.token),
          receiverATA,
          publicKey,
          0.99 * (amount * 10 ** splToken.decimals),
          splToken.decimals
        )

        const lookupTableAccounts = await getLookupTableAccounts(
          connection,
          addressLookupTableAddresses
        )

        const latestBlockhash = await connection.getLatestBlockhash()

        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: [
            ...computerBudgetInstructions,
            swapInstruction,
            sendIx,
          ],
        }).compileToV0Message(
          lookupTableAccounts as AddressLookupTableAccount[]
        )

        const transaction = new VersionedTransaction(messageV0)

        const sig = await sendTransaction(transaction, connection)

        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "processed"
        )

        toast.success("Payment successful!")
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      toast.error("Payment failed")
      setLoading(false)
    }
  }

  return (
    <section className="container flex flex-col items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex gap-2">
        <p>{truncatePubkey(params.address)} is receiving</p>
        <div className="inline-flex gap-2">
          <img
            src={
              SUPPORTED_TOKENS.find((token) => token.address === params.token)
                ?.logoURI
            }
            className="w-6 h-6"
          />
          <p>
            {
              SUPPORTED_TOKENS.find((token) => token.address === params.token)
                ?.symbol
            }
          </p>
        </div>
      </div>

      {publicKey ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <JupiterTokenSelect
              value={token}
              onChange={setToken}
              validTokens={validTokens}
            />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <p className="text-xs text-gray-400">
            Max amount:{" "}
            {walletData?.tokens?.find((t: any) => t.address === token)?.balance}
          </p>

          {amount &&
            (token !== params.token ? (
              <>
                {quote && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <p>Estimated amount: </p>
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            SUPPORTED_TOKENS.find(
                              (token) => token.address === params.token
                            )?.logoURI
                          }
                          className="w-6 h-6"
                        />
                        <p>
                          {0.99 *
                            (quote.outAmount /
                              10 **
                                (SUPPORTED_TOKENS.find(
                                  (t) => t.address === params.token
                                )?.decimals || 1))}
                        </p>
                        <p>
                          {
                            SUPPORTED_TOKENS.find(
                              (token) => token.address === params.token
                            )?.symbol
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button className="mt-8" onClick={pay} isLoading={loading}>
                  Swap and Pay
                </Button>
              </>
            ) : (
              <Button className="mt-8" onClick={pay} isLoading={loading}>
                Pay
              </Button>
            ))}
        </div>
      ) : (
        <div className="w-fit">
          <DynamicWalletMultiButton style={{ backgroundColor: "#9945FF" }} />
        </div>
      )}
    </section>
  )
}

export default ReceivePage
