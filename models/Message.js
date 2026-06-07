import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        text: {
            type: String,
            trim: true,
            default: "",
        },
        
        image: {
            type: String,
            default: "",
        },
        
        file: {
            url: {
                type: String,
                default: "",
            },
            name: {
                type: String,
                default: "",
            },
            type: {
                type: String,
                default: "",
            },
            size: {
                type: Number,
                default: 0,
            },
        },
        
        edited: {
            type: Boolean,
            default: false,
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        reactions: [
            {
                emoji: {
                    type: String,
                    required: true,
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;