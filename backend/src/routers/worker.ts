import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import jwt from "jsonwebtoken"      
import { JWT_SECRET_WORKER } from "../config"
import { workerMiddleware } from "../middleware"
import { getNextTask } from "../db"
import { createSubmissionInput } from "./types"
import { TOTAL_DECMIALS } from "../config"
import ts from "typescript"

const TOTAL_SUBMISSIONS = 100;
const prismaClient = new PrismaClient();

prismaClient.$transaction(
    async (prisma) => {
      // Code running in a transaction...
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 10000, // default: 5000
    }
)

const router = Router();


router.post("/payouts", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    // Check if the worker exists
    const worker = await prismaClient.worker.findFirst({
        where: { id: Number(userId) }
    });

    if (!worker) {
        res.status(403).json({
            message: "Worker not found"
        });
        return;
    }

    // Check if the user exists
    // const user = await prismaClient.user.findFirst({
    //     where: { id: Number(userId) }
    // });

    // if (!user) {
    //     res.status(404).json({
    //         message: "User not found"
    //     });
    //     return;
    // }
    const address = "0x1234567fdf890abcdef1234567890abcdef12345678abc"; // Replace with actual address
    const txnId = "0x12312312"; // Replace with actual transaction ID

    // Perform the transaction
    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        });

        await tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: txnId
            }
        });
    });

    res.json({
        message: "Processing payout",
        amount: worker.pending_amount
    });
});



router.get("/balance", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.locked_amount
    });
})

router.post("/submission", workerMiddleware, async (req, res) => {

    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parseBody = createSubmissionInput.safeParse(body);

    if(parseBody.success){
        const task = await getNextTask(Number(userId));
        if (!task || task?.id !== Number(parseBody.data.taskId)){
            res.status(411).json({
                message: "Incorrect taskId"
            })
            return;
        } 
        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prismaClient.$transaction(async tx =>{
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parseBody.data.selection),
                    worker_id: Number(userId),
                    task_id: Number(parseBody.data.taskId),
                    amount: Number(amount)
                }
            })
            await tx.worker.update({
                where: {
                    id: Number(userId)
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })
            return submission;
        })

        
        
        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })

    } else {
        res.status(411).json({
            message: "Incorrect inputs"
        })
    }
})

router.get("/nextTask", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;
    const task = await getNextTask(Number(userId));
        
    if (!task) {
        res.status(411).json({
            message: "No more tasks left for you to review"
        });
    } else{
        res.json({
           task
        })
    }
})

router.post("/signin", async (req, res) => {
    
        //TODO: add the signed verification here
    const hardcodedWalletAddress = "0x1234567890abcdef1234567890abcdef12345678abc";

    const exsistingUser = await prismaClient.worker.findFirst({
        where: {
            address: hardcodedWalletAddress
        },
    })

    if (exsistingUser){
        const token = jwt.sign({
            userId: exsistingUser.id
        }, JWT_SECRET_WORKER)

        res.json({
            token
        })

    } else{
        const user = await prismaClient.worker.create({
            data: {
                address: hardcodedWalletAddress,
                pending_amount: 0,
                locked_amount: 0
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET_WORKER)

        res.json({
            token
        })
    }

})

export default router;