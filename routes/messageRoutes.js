import express from "express";

import {
    getOrCreateConversation,
    getMyConversations,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    toggleMessageReaction,
    deleteMessage,
    editMessage,
    searchMessages,

} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/conversation/:userId", protect, getOrCreateConversation);

router.get("/conversations", protect, getMyConversations);

router.delete("/message/:messageId", protect, deleteMessage);

router.put("/message/:messageId/edit", protect, editMessage);

router.put("/message/:messageId/reaction", protect, toggleMessageReaction);

router.put("/:conversationId/read", protect, markMessagesAsRead);

router.get("/:conversationId/search", protect, searchMessages);

router.get("/:conversationId", protect, getMessages);

router.post("/:conversationId", protect, sendMessage);

export default router;