import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        parentPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
        },

        quotedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null,
        },

        postType: {
            type: String,
            enum: ["post", "comment", "quote"],
            default: "post",
        },

        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        reshares: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        downvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Post = mongoose.model("Post", postSchema);

export default Post;