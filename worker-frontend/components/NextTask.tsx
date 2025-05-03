"use client"
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useEffect, useState } from "react"

interface Task {
    id: number,
    amount: number,
    title: string,
    options: {
        id: number;
        image_url: string;
        task_id: number;
    }[]
}

export const NextTask = () => {
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        })
            .then(res => {
                setCurrentTask(res.data.task);
                setLoading(false)
            })
            .catch(e => {
                setLoading(false);
                setCurrentTask(null);
            })
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white">
                <div className="text-3xl font-semibold animate-pulse">
                    Loading Task...
                </div>
            </div>
        );
    }

    if (!currentTask) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white">
                <div className="text-2xl text-center px-6 max-w-xl">
                    💤 No pending tasks available at the moment.<br />
                    Please check back soon!
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white p-6">
            <div className="text-center pt-16">
                <h2 className="text-4xl font-bold mb-2 tracking-wide">
                    🧠 Task #{currentTask.id}
                </h2>
                <p className="text-lg text-gray-300">{currentTask.title}</p>
                {submitting && (
                    <p className="text-purple-400 mt-2 animate-pulse">Submitting...</p>
                )}
            </div>

            <div className="flex justify-center flex-wrap gap-8 pt-12">
                {currentTask.options.map(option => (
                    <Option
                        key={option.id}
                        imageUrl={option.image_url}
                        onSelect={async () => {
                            setSubmitting(true);
                            try {
                                const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, {
                                    taskId: currentTask.id.toString(),
                                    selection: option.id.toString()
                                }, {
                                    headers: {
                                        "Authorization": localStorage.getItem("token")
                                    }
                                });

                                const nextTask = response.data.nextTask;
                                if (nextTask) {
                                    setCurrentTask(nextTask);
                                } else {
                                    setCurrentTask(null);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                            setSubmitting(false);
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

function Option({ imageUrl, onSelect }: {
    imageUrl: string;
    onSelect: () => void;
}) {
    return (
        <div
            onClick={onSelect}
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
        >
            <img
                src={imageUrl}
                className="w-80 rounded-xl shadow-lg border border-purple-600 hover:shadow-purple-700 transition-all duration-300"
                alt="Task Option"
            />
        </div>
    );
}