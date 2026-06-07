import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            default: "Remote",
        },

        jobType: {
            type: String,
            enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
            default: "Full-time",
        },

        salary: {
            type: String,
            default: "",
        },

        skills: [
            {
                type: String,
            },
        ],

        description: {
            type: String,
            required: true,
        },

        applyLink: {
            type: String,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;