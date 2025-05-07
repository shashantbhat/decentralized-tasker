"use client";
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/utils';

import Link from "next/link";


export const Appbar = () => {
    const { publicKey , signMessage } = useWallet();
    const [mounted, setMounted] = useState(false);
    const [balance, setBalance] = useState(0);

    async function signAndSend() {
        if (!publicKey) {
            return;
        }
        const message = new TextEncoder().encode("Sign into decentralized-tasker as worker");
        const signature = await signMessage?.(message);
        console.log(signature)
        console.log(publicKey)
        const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
            signature,
            publicKey: publicKey?.toString()
        });

        console.log(response.data)
        setBalance(response.data.amount)

        localStorage.setItem("token", response.data.token);
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (publicKey) signAndSend();
    }, [publicKey]);

    return (
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-[#0D0D0D] shadow-md">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                decentralized-tasker<span className="text-gray-400 ml-1 text-sm"></span>
            </Link>

            <div className="text-xl pr-4 pb-2 flex">
                <button onClick={() => {
                    axios.post(`${BACKEND_URL}/v1/worker/payout`, {
                        
                    }, {
                        headers: {
                            "Authorization": localStorage.getItem("token")
                        }
                    })
                }} className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Pay me out ({balance}) SOL</button>
                {mounted && (publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />)}
            </div>
        </div>
    );
};

