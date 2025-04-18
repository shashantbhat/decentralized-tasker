import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import jwt from "jsonwebtoken"      
import { S3Client, GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from ".."
import { authMiddleware } from "../middleware"
import dotenv from "dotenv"

dotenv.config();

const router = Router();

const prismaClient = new PrismaClient();

const s3Client = new S3Client({
    credentials: { 
        accessKeyId: process.env.awsAccessKeyId ?? "",
        secretAccessKey: process.env.awsSecretAccessKey ?? ""
    },
    region: "eu-north-1",
})

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

    console.log({url, fields})

    res.json({
        preSignedUrl: url,
        fields
    })
})

//here the signin is done using the wallet
router.post("/signin", async (req, res) => {

    //TODO: add the signed verification here
    const hardcodedWalletAddress = "0x1234567890abcdef1234567890abcdef12345678";

    const exsistingUser = await prismaClient.user.findFirst({
        where: {
            address: hardcodedWalletAddress
        },
    })

    if (exsistingUser){
        const token = jwt.sign({
            userId: exsistingUser.id
        }, JWT_SECRET)

        res.json({
            token
        })

    } else{
        const user = await prismaClient.user.create({
            data: {
                address: hardcodedWalletAddress,
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