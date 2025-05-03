"use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

import Link from "next/link";

export const Appbar = () => {
    // const { publicKey , signMessage } = useWallet();

    // async function signAndSend() {
    //     if (!publicKey) {
    //         return;
    //     }
    //     const message = new TextEncoder().encode("Sign into mechanical turks");
    //     const signature = await signMessage?.(message);
    //     console.log(signature)
    //     console.log(publicKey)
    //     const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
    //         signature,
    //         publicKey: publicKey?.toString()
    //     });

    //     localStorage.setItem("token", response.data.token);
    // }

    // useEffect(() => {
    //     signAndSend()
    // }, [publicKey]);

    return (
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#0D0D0D] shadow-md">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                Turkify<span className="text-gray-400 ml-1 text-sm">(User)</span>
            </Link>

            {/* {publicKey ? (
                <WalletDisconnectButton className="text-white" />
            ) : (
                <WalletMultiButton className="text-white" />
            )} */}

            <button
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold tracking-wide"
            >
                Connect Wallet
            </button>
        </div>
    );
};