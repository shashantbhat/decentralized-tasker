import { PrismaClient } from "@prisma/client"

const prismaClient = new PrismaClient();

export const getNextTask = async (userId: number) => {
    const task = await prismaClient.task.findFirst({
        where: {
            done: Boolean(false),
            submissions: {
                none: {
                    worker_id: Number(userId),
                }
            }
        },
        select: {
            id: true,
            title: true,
            amount: true,
            options: true
        }
    })
    return task;
}