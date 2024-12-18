//Client-side modal
'use client'

import { ACTIVE_NETWORK } from "@/actions/gaia/constants";
import { useAccount, useSuggestChainAndConnect, WalletType } from "graz";
import { useEffect } from "react";
import Image from 'next/image'

export function WalletModal({ closeModal }) {

    const { data: account } = useAccount()

    useEffect(() => {
        if (account?.bech32Address) {
            closeModal()
        }
    }, [account?.bech32Address, closeModal])

    return (<>
        Connect your Wallet :
        <div style={{ display: "flex", flexDirection: "row", alignItems: "middle", margin: "20px", gap: "10px", flexWrap: "wrap" }}>
            <WalletButton walletType={WalletType.KEPLR} img="/keplr-wallet.png" alt="Keplr" />
            <WalletButton walletType={WalletType.LEAP} img="/leap-wallet.webp" alt="Leap" />
            <WalletButton walletType={WalletType.WALLETCONNECT} img="/wallet-connect.png" alt="Wallet Connect" />
            <WalletButton walletType={WalletType.METAMASK_SNAP_COSMOS} img="/metamask.png" alt="Metamask" />
        </div >
    </>
    );
}

export function WalletButton({ walletType, img, alt }: { walletType: WalletType, img: string, alt: string }) {
    const { suggestAndConnect: connect } = useSuggestChainAndConnect()
    return (<button style={{
        flex: "1 0 33%",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        alignItems: "center",
    }} onClick={() => connect({ chainInfo: ACTIVE_NETWORK.chain, walletType })}> <Image src={img} width={40} height={40} alt={alt}></Image> {alt}</button >)
}