"use client";
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/utils';

import Link from "next/link";

import { useState } from 'react';

export const Appbar = () => {
    const { publicKey , signMessage } = useWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (publicKey) signAndSend();
    }, [publicKey]);

    async function signAndSend() {
        if (!publicKey) return;

        const message = new TextEncoder().encode("Sign into decentralized-tasker");
        const signature = await signMessage?.(message);

        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
            signature,
            publicKey: publicKey.toString()
        });

        localStorage.setItem("token", response.data.token);
    }

    return (
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#0D0D0D] shadow-md">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                decentralized-tasker<span className="text-gray-400 ml-1 text-sm"></span>
            </Link>

            <div className="text-xl pr-4 pb-2">
                {mounted && (publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />)}
            </div>
        </div>
    );
};