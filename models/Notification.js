import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },

        type: {
            type: String,
            enum: [
                "mention",
                "comment",
                "favorite",
                "bookmark",
                "reshare",
                "quote",
                "follow",
                "message"
            ],
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;