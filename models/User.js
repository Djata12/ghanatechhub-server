import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
        },

        handle: {
            type: String,
            required: true,
            unique: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: true,
        },
        
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        
        emailVerificationToken: {
            type: String,
            default: "",
        },
        
        resetPasswordToken: {
            type: String,
            default: "",
        },
        
        resetPasswordExpires: {
            type: Date,
        },

        role: {
            type: String,
            enum: ["developer", "recruiter", "startup", "admin"],
            default: "developer",
        },

        bio: {
            type: String,
            default: "",
        },

        location: {
            type: String,
            default: "",
        },

        profileImage: {
            type: String,
            default: "",
        },
        
        bannerImage: {
            type: String,
            default: "",
        },
        
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        savedJobs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Job",
            },
        ],
        
        skills: [
            {
                type: String,
            },
        ],
        
        featuredProjects: [
            {
                title: {
                    type: String,
                    default: "",
                },
        
                description: {
                    type: String,
                    default: "",
                },
        
                link: {
                    type: String,
                    default: "",
                },
            },
        ],
        
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;