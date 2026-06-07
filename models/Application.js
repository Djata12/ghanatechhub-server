import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },

        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["Applied", "Under Review", "Interview", "Rejected", "Hired"],
            default: "Applied",
        },

        coverLetter: {
            type: String,
            default: "",
        },
        
        recruiterNotes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;