import mongoose from "mongoose";

const supportSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        message: {
            type: String,
            default: "",
        },
        reference: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Support", supportSchema);