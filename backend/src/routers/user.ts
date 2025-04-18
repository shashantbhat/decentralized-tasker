import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import jwt from "jsonwebtoken"

const router = Router();

const prismaClient = new PrismaClient();
const JWT_SECRET = "shash"; 


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