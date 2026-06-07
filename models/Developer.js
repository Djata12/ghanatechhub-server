import mongoose from "mongoose";

const developerSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        required: true,
    },

    location: {
        type: String,
        required: true,
    },

    experience: {
        type: String,
    },

    specialty: {
        type: String,
    },

    availability: {
        type: String,
    },

    stack: {
        type: [String],
        default: [],
    },

    image: {
        type: String,
        required: true,
    },
    
    profile: {
        type: String,
        required: true,
    },

    bio: {
        type: String,
    },
},
{
    timestamps: true,
}
);

export default mongoose.model("Developer", developerSchema);