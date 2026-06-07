import express from "express";
import Visit from "../models/Visit.js";

const router = express.Router();

router.post("/track", async (req, res) => {
    try {
        const { visitorId, userId } = req.body;

        if (!visitorId) {
            return res.status(400).json({
                message: "Visitor ID is required",
            });
        }

        await Visit.findOneAndUpdate(
            { visitorId },
            {
                visitorId,
                userId: userId || null,
                lastSeen: new Date(),
            },
            {
                upsert: true,
                new: true,
            }
        );

        res.json({
            message: "Visit tracked",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.get("/summary", async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const onlineUsers = await Visit.distinct("userId", {
            userId: { $ne: null },
            lastSeen: { $gte: fiveMinutesAgo },
        });

        const visitorsToday = await Visit.countDocuments({
            updatedAt: { $gte: startOfToday },
        });

        res.json({
            usersOnline: onlineUsers.length,
            visitorsToday,
            date: new Date(),
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

export default router;