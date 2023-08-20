"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { ClipboardCopyIcon, ExternalLinkIcon } from "lucide-react"
import { toast } from "sonner"

import { createBrandQr } from "@/lib/qr"
import { Button, buttonVariants } from "@/components/ui/button"
import JupiterTokenSelect from "@/components/jupiter-token-select"

const DynamicWalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

export default function IndexPage() {
  const { publicKey } = useWallet()

  const [tokenChosen, setTokenChosen] = useState(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  )
  const [size, setSize] = useState(() =>
    typeof window === "undefined"
      ? 400
      : Math.min(window.screen.availWidth - 240, 300)
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => {
      setSize(Math.min(window.screen.availWidth - 128, 300))
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!publicKey) return

    const qr = createBrandQr(
      `${window.location.origin}/receive/${publicKey}?token=${tokenChosen}`,
      size
    )
    if (qrRef.current) {
      qrRef.current.innerHTML = ""
      qr.append(qrRef.current)
    }
  }, [tokenChosen, publicKey])

  return (
    <section className="container flex flex-col items-center gap-6 pt-6 pb-8 md:py-10">
      <div className="flex max-w-[980px] flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-extrabold md:text-4xl">
          Receive crypto in your preferred token
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Create a Link/QR Code where anyone can send you crypto in their token
          of choice and it will be automatically converted to your preferred
          token will minimal slippage.
        </p>
      </div>

      {publicKey ? (
        <JupiterTokenSelect value={tokenChosen} onChange={setTokenChosen} />
      ) : (
        <div className="w-fit">
          <DynamicWalletMultiButton style={{ backgroundColor: "#9945FF" }} />
        </div>
      )}

      <div className="p-4 bg-white rounded-xl w-fit">
        <div ref={qrRef} />
      </div>

      <div className="flex gap-4">
        <Link
          href={`/receive/${publicKey}/${tokenChosen}`}
          className={buttonVariants({ className: "w-fit" })}
          target="_blank"
          rel="noreferrer"
        >
          View your link
          <ExternalLinkIcon className="inline-block w-4 h-4 ml-2" />
        </Link>

        <Button
          className="w-fit"
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/receive/${publicKey}/${tokenChosen}`
            )
            toast("Link copied to clipboard")
          }}
        >
          Copy link
          <ClipboardCopyIcon className="inline-block w-4 h-4 ml-2" />
        </Button>
      </div>
    </section>
  )
}
