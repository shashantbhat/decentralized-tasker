"use client";

import { Appbar } from '@/components/Appbar';
import { BACKEND_URL } from '@/utils';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

async function getTaskDetails(taskId: string) {
    const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`, {
        headers: {
            "Authorization": localStorage.getItem("token") || ""
        }
    });
    return response.data;
}

export default function Page() {
    const params = useParams();
    const taskId = params?.taskId as string;

    const [result, setResult] = useState<Record<string, {
        count: number;
        option: {
            imageUrl: string;
        };
    }>>({});

    const [taskDetails, setTaskDetails] = useState<{ title: string | null }>({
        title: null
    });

    useEffect(() => {
        if (taskId) {
            getTaskDetails(taskId)
                .then((data) => {
                    setResult(data.result);
                    setTaskDetails(data.taskDetails);
                })
                .catch(console.error);
        }
    }, [taskId]);

    return (
        <div className="min-h-screen bg-[#121212] text-white">
            <Appbar />
            <div className='pt-24 px-6'>
                {taskDetails.title ? (
                    <h1 className='text-4xl font-extrabold text-center text-purple-400'>
                        {taskDetails.title}
                    </h1>
                ) : (
                    <p className='text-lg text-center text-gray-500'>
                        Loading task details...
                    </p>
                )}
                <div className='flex justify-center pt-10 flex-wrap gap-8'>
                    {Object.keys(result).length > 0 ? (
                        Object.keys(result).map((key) => (
                            <Task
                                key={key}
                                imageUrl={result[key].option.imageUrl}
                                votes={result[key].count}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-400 pt-4">
                            No results to display
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Task({ imageUrl, votes }: {
    imageUrl: string;
    votes: number;
}) {
    return (
        <div className="flex flex-col items-center border border-gray-700 rounded-lg shadow-lg p-4 bg-[#1a1a1a] w-80 hover:bg-[#222222] transition-all duration-200">
            <img
                className="w-full h-auto rounded-md mb-4 object-cover"
                src={imageUrl}
                alt="Option image"
            />
            <div className='text-lg font-medium text-gray-300'>
                Votes: {votes}
            </div>
        </div>
    );
}