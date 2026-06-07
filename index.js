import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";

import developerRoutes from "./routes/developerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://jamindjata.dev",
        ],
        methods: ["GET", "POST"],
    },
});

const onlineUsers = new Map();

const emitOnlineStatus = () => {
    const onlineUserIds = Array.from(onlineUsers.keys());

    io.emit("online-users-count", onlineUsers.size);
    io.emit("online-users-list", onlineUserIds);
};

io.on("connection", (socket) => {
    socket.on("join-user-room", (userId) => {
        if (!userId) return;

        socket.join(userId);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        emitOnlineStatus();
    });

    socket.on("user-online", (userId) => {
        if (!userId) return;

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        emitOnlineStatus();
    });

    socket.on("disconnect", () => {
        for (const [userId, sockets] of onlineUsers.entries()) {
            sockets.delete(socket.id);

            if (sockets.size === 0) {
                onlineUsers.delete(userId);
            }
        }

        emitOnlineStatus();
    });

    socket.on("join-conversation", (conversationId) => {
        if (conversationId) {
            socket.join(conversationId);
        }
    });

    socket.on("typing", ({ conversationId, user }) => {
        if (conversationId && user) {
            socket.to(conversationId).emit("typing", {
                conversationId,
                user,
            });
        }
    });

    socket.on("stop-typing", ({ conversationId }) => {
        if (conversationId) {
            socket.to(conversationId).emit("stop-typing", {
                conversationId,
            });
        }
    });
});

app.set("io", io);

// MIDDLEWARE
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://jamindjata.dev",
        ],
        credentials: true,
    })
);
app.use(express.json());

// ROUTES
app.use("/api/developers", developerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/uploads", uploadRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("API is running...");
});

// MONGODB CONNECTION
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        server.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });