import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
    {
        visitorId: {
            type: String,
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;