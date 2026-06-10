import express from "express";
import axios from "axios";
import Support from "../models/Support.js";

const router = express.Router();

router.post("/initialize", async (req, res) => {
    try {
        const { name, email, amount, message } = req.body;

        if (!name || !email || !amount) {
            return res.status(400).json({
                message: "Name, email and amount are required",
            });
        }

        const reference = `SUPPORT-${Date.now()}`;

        const support = await Support.create({
            name,
            email,
            amount,
            message,
            reference,
            status: "pending",
        });

        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: Number(amount) * 100,
                currency: "GHS",
                reference,
                callback_url: `${process.env.FRONTEND_URL}/support/success?reference=${reference}`,
                metadata: {
                    supportId: support._id,
                    name,
                    message,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({
            authorizationUrl: response.data.data.authorization_url,
            reference,
        });
    } catch (error) {
        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message ||
                "Unable to initialize support payment",
        });
    }
});

router.get("/verify/:reference", async (req, res) => {
    try {
        const { reference } = req.params;

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const transaction = response.data.data;

        const support = await Support.findOneAndUpdate(
            { reference },
            {
                status:
                    transaction.status === "success"
                        ? "successful"
                        : transaction.status,
            },
            { new: true }
        );

        res.json({
            support,
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            message:
                error.response?.data?.message ||
                error.message ||
                "Unable to verify payment",
        });
    }
});

router.get("/recent", async (req, res) => {
    try {
        const supporters = await Support.find({
            status: "successful",
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(supporters);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const successful = await Support.find({
            status: "successful",
        });

        const totalAmount = successful.reduce(
            (sum, item) => sum + item.amount,
            0
        );

        res.json({
            totalAmount,
            totalSupporters: successful.length,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

export default router;