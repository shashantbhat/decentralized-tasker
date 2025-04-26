"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const types_1 = require("./types");
const TOTAL_SUBMISSIONS = 100;
const prismaClient = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post("/payouts", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    // Check if the worker exists
    const worker = yield prismaClient.worker.findFirst({
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
    const address = "0x1234567890abcdef1234567890abcdef12345678abc"; // Replace with actual address
    const txnId = "0x12312312"; // Replace with actual transaction ID
    // Perform the transaction
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
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
        yield tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: txnId
            }
        });
    }));
    res.json({
        message: "Processing payout",
        amount: worker.pending_amount
    });
}));
router.get("/balance", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount
    });
}));
router.post("/submission", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parseBody = types_1.createSubmissionInput.safeParse(body);
    if (parseBody.success) {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parseBody.data.taskId)) {
            res.status(411).json({
                message: "Incorrect taskId"
            });
            return;
        }
        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parseBody.data.selection),
                    worker_id: Number(userId),
                    task_id: Number(parseBody.data.taskId),
                    amount: Number(amount)
                }
            });
            yield tx.worker.update({
                where: {
                    id: Number(userId)
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNextTask)(Number(userId));
        res.json({
            nextTask,
            amount
        });
    }
    else {
        res.status(411).json({
            message: "Incorrect inputs"
        });
    }
}));
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({
            message: "No more tasks left for you to review"
        });
    }
    else {
        res.json({
            task
        });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //TODO: add the signed verification here
    const hardcodedWalletAddress = "0x1234567890abcdef1234567890abcdef12345678abc";
    const exsistingUser = yield prismaClient.worker.findFirst({
        where: {
            address: hardcodedWalletAddress
        },
    });
    if (exsistingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: exsistingUser.id
        }, config_1.JWT_SECRET_WORKER);
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.worker.create({
            data: {
                address: hardcodedWalletAddress,
                pending_amount: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_SECRET_WORKER);
        res.json({
            token
        });
    }
}));
exports.default = router;
