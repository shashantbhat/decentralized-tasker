"use client";
import { UploadImage } from "@/components/UploadImage";
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export const Upload = () => {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState("");
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();

    async function onSubmit() {
        if (images.length < 2) {
            alert("Please upload at least 2 images to create a task.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("User not authenticated. Please log in.");
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
                options: images.map(image => ({
                    imageUrl: image,
                })),
                title,
                signature: txSignature
            }, {
                headers: {
                    // "Content-Type": "application/json",
                    "Authorization": token
                }
            });

            router.push(`/task/${response.data.id}`);
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Task creation failed. Please try again.");
        }
    }

    async function makePayment() {

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey!,
                toPubkey: new PublicKey("43aC65pQNkYtU6vTVY3942MpsUDkaHhhPAgyrkdingpV"),
                lamports: 100000000,
            })
        );

        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await connection.getLatestBlockhashAndContext();

        const signature = await sendTransaction(transaction, connection, { minContextSlot });

        await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
        setTxSignature(signature);
    }

    return (
        <div className="flex justify-center bg-[#0f0f0f] min-h-screen pt-16 text-white">
            <div className="max-w-screen-md w-full px-4">
                <div className="text-3xl font-bold pb-6 border-b border-gray-700">
                    Create a Task
                </div>

                <label className="block mt-6 text-sm font-medium text-gray-300">
                    Task Title
                </label>
                <input
                    onChange={(e) => setTitle(e.target.value)}
                    type="text"
                    className="mt-2 bg-[#1a1a1a] border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-600 focus:border-purple-600 block w-full p-4"
                    placeholder="What is your task?"
                    required
                />

                <label className="block mt-8 text-sm font-medium text-gray-300">
                    Add Images
                </label>
                <div className="flex flex-wrap gap-6 justify-start pt-4">
                    {images.map(image => (
                        <UploadImage
                            key={image}
                            image={image}
                            onImageAdded={(imageUrl) => {
                                setImages(i => [...i, imageUrl]);
                            }}
                        />
                    ))}
                </div>

                <div className="pt-6">
                    <UploadImage onImageAdded={(imageUrl) => {
                        setImages(i => [...i, imageUrl]);
                    }} />
                </div>

                {/* <div className="flex justify-center pt-10">
                    <button
                        onClick={onSubmit}
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm px-6 py-3 transition duration-200"
                    >
                        Submit Task
                    </button>
                </div> */}
                <div className="flex justify-center">
                    <button onClick={txSignature ? onSubmit : makePayment} type="button" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm px-6 py-3 transition duration-200  focus:outline-none focus:ring-4 focus:ring-gray-300 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                        {txSignature ? "Submit Task" : "Pay 0.1 SOL"}
                    </button>
                </div>
            </div>
        </div>
    );
};