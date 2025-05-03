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
                    setTaskDetails(data.taskDetails); // <-- `title` should be present here
                })
                .catch(console.error);
        }
    }, [taskId]);

    return (
        <div>
            <Appbar />
            {taskDetails.title ? (
                <div className='text-2xl pt-20 flex justify-center'>
                    {taskDetails.title}
                </div>
            ) : (
                <div className='text-2xl pt-20 flex justify-center text-gray-500'>
                    Loading task details...
                </div>
            )}
            <div className='flex justify-center pt-8 flex-wrap gap-4'>
                {Object.keys(result).length > 0 ? (
                    Object.keys(result).map((key) => (
                        <Task
                            key={key}
                            imageUrl={result[key].option.imageUrl}
                            votes={result[key].count}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-400 pt-4">No results to display</div>
                )}
            </div>
        </div>
    );
}

function Task({ imageUrl, votes }: {
    imageUrl: string;
    votes: number;
}) {
    return (
        <div className="flex flex-col items-center">
            <img
                className="p-2 w-96 rounded-md"
                src={imageUrl}
                alt="Option image"
            />
            <div className='flex justify-center text-lg font-semibold'>
                Votes: {votes}
            </div>
        </div>
    );
}