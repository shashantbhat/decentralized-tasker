import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import jwt from "jsonwebtoken"      
import { S3Client, GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from "../config"
import { authMiddleware } from "../middleware"
import dotenv from "dotenv"
import { createTaskInput } from "./types"
import ts from "typescript"
import { TOTAL_DECIMALS } from "../config"
import nacl from "tweetnacl";
import { Connection, PublicKey, Transaction } from "@solana/web3.js"

const connection = new Connection(process.env.RPC_URL ?? "");

const PARENT_WALLET_ADDRESS = "43aC65pQNkYtU6vTVY3942MpsUDkaHhhPAgyrkdingpV";

const defaultTitle = "Select the most clicked thumbnail";

dotenv.config();

const router = Router();

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

const s3Client = new S3Client({
    credentials: { 
        accessKeyId: process.env.awsAccessKeyId ?? "",
        secretAccessKey: process.env.awsSecretAccessKey ?? ""
    },
    region: "eu-north-1",
})


router.get("/task", authMiddleware, async (req, res) => {
    // @ts-ignore
    const taskId: string = req.query.taskId;
    // @ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    })

    if (!taskDetails) {
        res.status(411).json({
            message: "You dont have access to this task"
        })
        return;
    }

    // Todo: Can u make this faster?
    const responses = await prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true 
        }
    });

    const result: Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        }
    })

    responses.forEach(r => {
        result[r.option_id].count++;
    });

    res.json({
        result,
        taskDetails : {
            title: taskDetails.title
        }
    })

})


router.post("/task", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parseData = createTaskInput.safeParse(body);

    const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })

    if (!parseData.success) {
        res.status(411).json({
            message: "invalid input"
        })
        return;
    }

    if (!parseData.success) {
        res.status(411).json({
            message: "You've sent the wrong inputs"
        })
        return;
    }

    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log(transaction);

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
        return;
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        res.status(411).json({
            message: "Transaction sent to wrong address"
        })
        return;
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        res.status(411).json({
            message: "Transaction sent to wrong address"
        })
        return;
    }

    let response = await prismaClient.$transaction(async tx => {
        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? defaultTitle,
                amount: 0.1 * TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;
    })

    res.json({
        id: response.id
    })
});


router.get("/presignedUrl", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'decentraliszed-taskerr',
        Key: `tasker/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            // success_action_status: '201',
            'Content-Type': 'image/png'
        },
        Expires: 3600
    })

    res.json({
        preSignedUrl: url,
        fields
    })
})

//here the signin is done using the wallet
router.post("/signin", async (req, res) => {

    //TODO: add the signed verification here
    // const hardcodedWalletAddress = "0x1234567890abcdef1234567890abcdef12345678";

    // const exsistingUser = await prismaClient.user.findFirst({
    //     where: {
    //         address: hardcodedWalletAddress
    //     },
    // })

    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into decentralized-tasker");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );


    if (!result) {
        res.status(411).json({
            message: "Incorrect signature"
        })
        return;
    }

    const existingUser = await prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    })

    if (existingUser){
        const token = jwt.sign({
            userId: existingUser.id
        }, JWT_SECRET)

        res.json({
            token
        })

    } else{
        const user = await prismaClient.user.create({
            data: {
                address: publicKey,
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)

        res.json({
            token
        })
    }

})

export default router;