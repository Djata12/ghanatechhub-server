import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const getOrCreateConversation = async (req, res) => {
    try {
        const otherUserId = req.params.userId;

        if (otherUserId === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot message yourself",
            });
        }

        const otherUser = await User.findById(otherUserId);

        if (!otherUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user._id, otherUserId],
            },
        }).populate(
            "participants",
            "name username handle profileImage bio location"
        );

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, otherUserId],
            });

            conversation = await conversation.populate(
                "participants",
                "name username handle profileImage bio location"
            );
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getMyConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate(
                "participants",
                "name username handle profileImage bio location"
            )
            .sort({ lastMessageAt: -1 });

        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conversation) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conversation._id,
                    sender: { $ne: req.user._id },
                    readBy: { $ne: req.user._id },
                });

                return {
                    ...conversation.toObject(),
                    unreadCount,
                };
            })
        );

        res.json(conversationsWithUnread);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(
            req.params.conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized to view this conversation",
            });
        }

        const messages = await Message.find({
            conversation: conversation._id,
        })
            .populate("sender", "name username handle profileImage")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file } = req.body;

        if ((!text || !text.trim()) && !image && !file?.url) {
            return res.status(400).json({
                message: "Message cannot be empty",
            });
        }

        const conversation = await Conversation.findById(
            req.params.conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized to send message",
            });
        }

        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            text: text || "",
            image: image || "",
            file: file || {
                url: "",
                name: "",
                type: "",
                size: 0,
            },
            readBy: [req.user._id],
        });

        conversation.lastMessage = text || (image ? "📷 Image" : "📎 File");
        conversation.lastMessageAt = new Date();

        await conversation.save();

        const populatedMessage = await message.populate(
            "sender",
            "name username handle profileImage"
        );
        
        const recipientId = conversation.participants.find(
            (id) => id.toString() !== req.user._id.toString()
        );
        
        if (recipientId) {
            const notification = await Notification.create({
                recipient: recipientId,
                sender: req.user._id,
                type: "message",
                message: `${req.user.handle} sent you a message`,
            });
        
            req.app
                .get("io")
                .to(recipientId.toString())
                .emit("new-notification", notification);
        }

        req.app
            .get("io")
            .to(conversation._id.toString())
            .emit("new-message", populatedMessage);

            if (recipientId) {
                req.app
                    .get("io")
                    .to(recipientId.toString())
                    .emit("new-message", populatedMessage);
            }

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const conversation = await Conversation.findById(
            req.params.conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        await Message.updateMany(
            {
                conversation: conversation._id,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id },
            },
            {
                $addToSet: {
                    readBy: req.user._id,
                },
            }
        );

        req.app
            .get("io")
            .to(conversation._id.toString())
            .emit("messages-read", {
                conversationId: conversation._id,
                userId: req.user._id,
            });

        res.json({
            message: "Messages marked as read",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};



export const toggleMessageReaction = async (req, res) => {
    try {
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({
                message: "Emoji is required",
            });
        }

        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        const conversation = await Conversation.findById(message.conversation);

        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const existingReaction = message.reactions.find(
            (reaction) =>
                reaction.user.toString() === req.user._id.toString() &&
                reaction.emoji === emoji
        );

        if (existingReaction) {
            message.reactions = message.reactions.filter(
                (reaction) =>
                    !(
                        reaction.user.toString() === req.user._id.toString() &&
                        reaction.emoji === emoji
                    )
            );
        } else {
            message.reactions.push({
                emoji,
                user: req.user._id,
            });
        }

        await message.save();

        const populatedMessage = await message.populate(
            "sender",
            "name username handle profileImage"
        );

        req.app
            .get("io")
            .to(message.conversation.toString())
            .emit("message-reaction", populatedMessage);

        res.json(populatedMessage);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can only delete your own messages",
            });
        }

        const conversationId = message.conversation;

        await message.deleteOne();

        req.app
            .get("io")
            .to(conversationId.toString())
            .emit("message-deleted", {
                messageId: req.params.messageId,
                conversationId,
            });

        res.json({
            message: "Message deleted",
            messageId: req.params.messageId,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Message cannot be empty",
            });
        }

        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can only edit your own messages",
            });
        }

        message.text = text;
        message.edited = true;

        await message.save();

        const populatedMessage = await message.populate(
            "sender",
            "name username handle profileImage"
        );

        req.app
            .get("io")
            .to(message.conversation.toString())
            .emit("message-edited", populatedMessage);

        res.json(populatedMessage);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const searchMessages = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.json([]);
        }

        const conversation = await Conversation.findById(
            req.params.conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const messages = await Message.find({
            conversation: conversation._id,
            $or: [
                { text: { $regex: q, $options: "i" } },
                { "file.name": { $regex: q, $options: "i" } },
            ],
        })
            .populate("sender", "name username handle profileImage")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};